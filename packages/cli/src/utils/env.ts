import path from 'node:path'
import type { FrameworkId } from '@kompojs/config/constants'
import type { ObjectLiteralExpression } from 'ts-morph'
import { Project, SyntaxKind } from 'ts-morph'
import { createFsEngine } from '../engine/fs-engine'

/**
 * Injects environment variables into the workspace's .env and .env.example files.
 * Appends the content only if the keys don't already exist.
 *
 * @param repoRoot - The root directory of the repository
 * @param envEntry - Alternatively provide the raw env string content to inject
 */
export async function injectEnvVariables(repoRoot: string, envEntry: string) {
  if (!envEntry || !envEntry.trim()) return

  const fs = createFsEngine()
  const envPath = path.join(repoRoot, '.env')
  const envExamplePath = path.join(repoRoot, '.env.example')

  // Helper to append unique variables
  const appendUnique = async (filePath: string, contentToAdd: string) => {
    // Check for each key specifically
    const lines = contentToAdd.split('\n')
    const finalLines = []

    if (await fs.fileExists(filePath)) {
      const existingContent = await fs.readFile(filePath)
      for (const line of lines) {
        const key = line.split('=')[0].trim()
        if (key && !existingContent.includes(`${key}=`)) {
          finalLines.push(line)
        }
      }

      if (finalLines.length > 0) {
        const separator = existingContent.endsWith('\n') ? '' : '\n'
        await fs.writeFile(filePath, `${existingContent}${separator}${finalLines.join('\n')}\n`)
      }
    } else {
      await fs.writeFile(filePath, contentToAdd)
    }
  }

  await appendUnique(envPath, envEntry)
  await appendUnique(envExamplePath, envEntry)
}

/**
 * Injects environment variable schemas into the appropriate file:
 * - Server vars → libs/config/src/schema.ts (serverSchema object literal)
 * - Client vars → apps/<name>/src/env.ts (z.object() call argument)
 *
 * Uses ts-morph for AST manipulation. Also appends keys to .env/.env.example.
 *
 * @param repoRoot - The root directory of the repository
 * @param snippet - Object literal properties to inject (e.g. "KEY: z.string(),")
 * @param target - 'server' | 'react' | 'vue' | 'nextjs' | 'nuxt'
 * @param envContent - Optional explicit env content for .env files
 * @param appDir - Required for client targets. The app directory (e.g. /repo/apps/web)
 */
export async function injectEnvSnippet(
  repoRoot: string,
  snippet: string,
  target: FrameworkId | 'server' = 'server',
  envContent?: string,
  appDir?: string
) {
  const isClient = target !== 'server'

  // Determine target file and schema variable
  let targetPath: string
  let schemaVarName: string

  if (isClient) {
    if (!appDir) {
      console.warn(
        '⚠️  injectEnvSnippet: appDir required for client env injection, skipping schema injection'
      )
      // Still inject .env variables into app dir if known
      if (envContent) await injectEnvVariables(appDir || repoRoot, envContent)
      return
    }
    targetPath = path.join(appDir, 'src', 'env.ts')
    schemaVarName = 'clientSchema'
  } else {
    targetPath = path.join(repoRoot, 'libs', 'config', 'src', 'server.ts')
    schemaVarName = 'serverSchema'
  }

  const fs = createFsEngine()

  if (!(await fs.fileExists(targetPath))) {
    // env.ts will be created by the template engine during framework scaffolding.
    // Just inject .env variables if provided.
    if (envContent) await injectEnvVariables(isClient && appDir ? appDir : repoRoot, envContent)
    return
  }

  // Initialize ts-morph project
  const project = new Project({
    tsConfigFilePath: path.join(repoRoot, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  })

  // Add target file to project
  const sourceFile = project.addSourceFileAtPath(targetPath)

  // Find the schema variable declaration
  const varDec = sourceFile.getVariableDeclaration(schemaVarName)

  if (!varDec) {
    throw new Error(`Could not find ${schemaVarName} declaration in ${targetPath}`)
  }

  // Get the object literal — for server it's a plain object, for client it's inside z.object()
  let objectLiteral: ObjectLiteralExpression | undefined
  if (isClient) {
    // clientSchema = z.object({ ... }) — get the argument of z.object()
    const callExpr = varDec.getInitializerIfKind(SyntaxKind.CallExpression)
    if (callExpr) {
      const args = callExpr.getArguments()
      if (args.length > 0 && args[0].isKind(SyntaxKind.ObjectLiteralExpression)) {
        objectLiteral = args[0]
      }
    }
  } else {
    objectLiteral = varDec.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)
  }

  if (!objectLiteral) {
    throw new Error(`${schemaVarName} initializer must contain an object literal in ${targetPath}`)
  }

  // Parse the snippet to extract keys for conflict checking
  const tempFile = project.createSourceFile(
    `temp_${Date.now()}.ts`,
    `const temp = {\n${snippet}\n}`
  )
  const tempObject = tempFile
    .getVariableDeclaration('temp')
    ?.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)

  if (!tempObject) {
    throw new Error('Invalid snippet format. Must be valid object literal properties.')
  }

  const newProperties = tempObject.getProperties()
  const validKeys: string[] = []
  const structureToInject: Array<{ name: string; initializer: string }> = []

  for (const prop of newProperties) {
    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
      const keyName = prop.getName()

      // Skip if it already exists
      const exists = objectLiteral.getProperties().some((p: any) => {
        if (p.isKind(SyntaxKind.SpreadAssignment)) return false

        let name = p.getName()
        if (
          (name.startsWith("'") && name.endsWith("'")) ||
          (name.startsWith('"') && name.endsWith('"'))
        ) {
          name = name.slice(1, -1)
        }
        return name === keyName
      })

      if (exists) {
        continue
      }

      if (!envContent) {
        validKeys.push(`${keyName}=`)
      }

      structureToInject.push({
        name: keyName,
        initializer: prop.getInitializer()?.getText() || '',
      })
    }
  }

  if (structureToInject.length > 0) {
    objectLiteral.addPropertyAssignments(structureToInject)

    // For Next.js/Nuxt apps: also inject static process.env.KEY entries into runtimeEnv
    // so the framework can inline public env vars at build time in client components.
    if (target === 'nextjs' || target === 'nuxt') {
      const runtimeEnvDec = sourceFile.getVariableDeclaration('runtimeEnv')
      const runtimeEnvObj = runtimeEnvDec?.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)
      if (runtimeEnvObj) {
        const runtimeEntries = structureToInject.map((s) => ({
          name: s.name,
          initializer: `process.env.${s.name}`,
        }))
        runtimeEnvObj.addPropertyAssignments(runtimeEntries)
      }
    }

    await sourceFile.save()
  }

  // Inject keys into .env and .env.example
  // Client vars go to app dir, server vars go to repo root
  const envDir = isClient && appDir ? appDir : repoRoot
  if (envContent) {
    await injectEnvVariables(envDir, envContent)
  } else if (validKeys.length > 0) {
    const envBlock = validKeys.join('\n')
    await injectEnvVariables(envDir, envBlock)
  }
}
