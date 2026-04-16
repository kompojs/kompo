import path from 'node:path'
import { cancel, isCancel, log, select, text } from '@clack/prompts'
import {
  type DesignSystemId,
  FRAMEWORKS,
  type FrameworkId,
  getFrameworkFamily,
} from '@kompojs/config/constants'
import {
  addStep,
  ensureKompoCatalog,
  getRequiredFeatures,
  initKompoConfig,
  mergeBlueprintCatalog,
  readKompoConfig,
  resolveCatalogReferences,
  resolveWorkspaceReferences,
  updateCatalogFromFeatures,
  updateCatalogSources,
  upsertApp,
} from '@kompojs/kit'
import { Command } from 'commander'
import color from 'picocolors'
import { createFsEngine } from '../../../engine/fs-engine'
import { generateDesignSystem } from '../../../generators/apps/design.generator'
import { generateFramework } from '../../../generators/apps/framework.generator'
import { getDesignSystemSelectOptions } from '../../../utils/design-systems'
import { runFormat, runSort } from '../../../utils/format'
import { installDependencies } from '../../../utils/install'
import { findRepoRoot } from '../../../utils/project'
import { selectWithNavigation } from '../../../utils/prompts'
import { loadStarterFromTemplateArg } from '../../../utils/starters'
import {
  createKebabCaseValidator,
  RESTRICTED_APP_NAMES,
} from '../../../validations/naming.validation'

const DEFAULT_ORG = 'org'

export function createAddAppCommand(): Command {
  return new Command('app')
    .description('Add a new application to the project')
    .argument('[name]', 'Application name')
    .option('--framework <name>', 'Framework (nextjs, react, vue, nuxt, express)')
    .option('--design <name>', 'Design system (tailwind, shadcn, vanilla)')
    .option('-t, --template <name>', 'Starter/template id or manifest path')
    .option('--org <name>', 'Organization name')
    .option('-y, --yes', 'Skip prompts')
    .option('--verbose', 'Verbose output')
    .action(async (name, options) => {
      await runAddApp(name, options)
    })
}

export interface AddAppOptions {
  framework?: string
  design?: string
  template?: string
  org?: string
  yes?: boolean
  blueprintPath?: string
  skipInstall?: boolean
  verbose?: boolean
}

export async function runAddApp(
  nameArg: string | undefined,
  options: AddAppOptions
): Promise<void> {
  const fs = createFsEngine()
  const cwd = process.cwd()
  const repoRoot = (await findRepoRoot(cwd)) || cwd

  // Resolve or initialize Kompo project context
  let config = readKompoConfig(repoRoot)

  if (!config) {
    // New project: prompt for organization unless --yes or --org is provided
    let orgForInit: string
    if (options.yes || options.org) {
      orgForInit = options.org || DEFAULT_ORG
    } else {
      const response = await text({
        message: 'Organization name (namespace for your packages)',
        defaultValue: DEFAULT_ORG,
        placeholder: DEFAULT_ORG,
      })
      if (isCancel(response)) {
        cancel('Cancelled')
        process.exit(0)
      }
      orgForInit = (response as string) || DEFAULT_ORG
    }
    initKompoConfig(repoRoot, `${orgForInit}-project`, orgForInit)
    ensureKompoCatalog(repoRoot)

    config = readKompoConfig(repoRoot)
    if (!config) {
      log.error(color.red('❌ Failed to initialize Kompo project.'))
      process.exit(1)
    }
  }

  const org = options.org || config.project.org || 'company'

  let appName = nameArg
  let targetDir = ''
  let framework = options.framework as FrameworkId | undefined
  let designSystem = options.design

  // 1. App Type & Framework / Design System
  if (options.template) {
    // When a template is provided, derive framework/design from the starter
    const { config: starterConfig } = await loadStarterFromTemplateArg(options.template)
    framework = starterConfig.framework as FrameworkId
    designSystem = starterConfig.designSystem
    log.step(
      `Using starter ${color.cyan(options.template)} with framework ${color.cyan(
        String(framework)
      )} and design system ${color.cyan(String(designSystem))}`
    )
  } else {
    // 1.a Interactive framework selection when no template is provided
    if (!framework) {
      if (options.yes) {
        // Default to Next.js Fullstack if yes flag is used without args
        framework = FRAMEWORKS.NEXTJS
      } else {
        const choice = await select({
          message: 'How do you want to start your application?',
          options: [
            {
              label: 'From Starter',
              value: 'starter',
              hint: 'Use a predefined starter (recommended)',
            },
            {
              label: 'Blank App',
              value: 'blank',
              hint: 'Start from a minimal app and choose framework/design',
            },
          ],
        })
        if (isCancel(choice)) {
          cancel('Cancelled')
          process.exit(0)
        }

        if (choice === 'starter') {
          // Delegate to starter list prompt (reusing registry)
          const { createBlueprintRegistry } = await import('@kompojs/blueprints')
          const appRegistry = createBlueprintRegistry(repoRoot)
          const resolvedStarters = appRegistry.listStarters()
          if (resolvedStarters.length === 0) {
            log.error(color.red('No starters available. Please update your installation.'))
            process.exit(1)
          }

          const starterChoice = await select({
            message: 'Select a starter',
            options: resolvedStarters.map((rs) => ({
              label: rs.starter.name || rs.starter.id,
              value: rs.starter.id,
              hint: rs.starter.description,
            })),
          })
          if (isCancel(starterChoice)) {
            cancel('Cancelled')
            process.exit(0)
          }

          const { config: starterConfig } = await loadStarterFromTemplateArg(
            starterChoice as string
          )
          framework = starterConfig.framework as FrameworkId
          designSystem = starterConfig.designSystem
          log.step(
            `Using starter ${color.cyan(String(starterChoice))} with framework ${color.cyan(
              String(framework)
            )} and design system ${color.cyan(String(designSystem))}`
          )
        } else {
          // Map selection to framework variables for blank/frontend/backend choices
          const selection = await selectWithNavigation<FrameworkId | 'express'>(
            'What kind of application do you want to add?',
            [
              {
                label: 'Frontend / Fullstack Web App',
                value: 'frontend',
                hint: 'React, Vue, Next.js, Nuxt',
                submenuMessage: 'What kind of application do you want to add?',
                options: [
                  {
                    label: 'Next.js (App Router)',
                    value: FRAMEWORKS.NEXTJS,
                    hint: 'React - App Router + API',
                  },
                  { label: 'React + Vite', value: FRAMEWORKS.REACT, hint: 'React SPA' },
                  { label: 'Nuxt', value: FRAMEWORKS.NUXT, hint: 'Vue - Fullstack' },
                  { label: 'Vue + Vite', value: FRAMEWORKS.VUE, hint: 'Vue SPA' },
                ],
              },
              {
                label: 'Backend API Service',
                value: 'backend',
                hint: 'Node.js, Express',
                submenuMessage: 'What kind of application do you want to add?',
                options: [
                  { label: 'Node.js (Express)', value: 'express', hint: 'Using Vite for build' },
                ],
              },
            ]
          )

          if (selection === 'express') {
            framework = FRAMEWORKS.EXPRESS
          } else {
            framework = selection as FrameworkId
          }

          // Feedback Log
          if (framework) {
            const fwNames: Record<string, string> = {
              [FRAMEWORKS.NEXTJS]: 'Next.js',
              [FRAMEWORKS.REACT]: 'React + Vite',
              [FRAMEWORKS.VUE]: 'Vue + Vite',
              [FRAMEWORKS.NUXT]: 'Nuxt',
              [FRAMEWORKS.EXPRESS]: 'Express (Node.js)',
            }
            const fwName = fwNames[framework as string] || framework

            log.step(`Framework selected: ${color.cyan(fwName)}`)
          }
        }
      }
    }
  }

  // Handle CLI args direct set

  // 3. App Name Prompt (Loop for validity)
  while (true) {
    if (!appName) {
      if (options.yes) {
        appName = 'web'
      } else {
        const response = await text({
          message: 'Application name',
          defaultValue: 'web',
          placeholder: 'web',
          validate: createKebabCaseValidator('Application name', {
            restrictedNames: RESTRICTED_APP_NAMES,
            defaultValue: 'web',
          }),
        })
        if (isCancel(response)) {
          cancel('Cancelled')
          process.exit(0)
        }
        appName = response as string
      }
    }

    targetDir = path.join(repoRoot, 'apps', appName)
    if (await fs.fileExists(targetDir)) {
      if (options.yes) {
        log.error(color.red(`Directory apps/${appName} already exists`))
        process.exit(1)
      }

      log.error(color.red(`Directory apps/${appName} already exists`))
      appName = '' // Reset so next loop prompts again
      continue
    }

    break
  }

  // 4. Design System (Skip for pure backend frameworks)
  const isBackend = framework === FRAMEWORKS.EXPRESS

  if (isBackend) {
    designSystem = designSystem || 'vanilla'
  }

  if (!designSystem) {
    if (options.yes) {
      designSystem = 'vanilla'
    } else {
      const response = await select({
        message: 'Design System',
        options: getDesignSystemSelectOptions(framework),
      })
      if (isCancel(response)) {
        cancel('Cancelled')
        process.exit(0)
      }
      designSystem = response as string
    }
  }

  await generateFramework({
    cwd: repoRoot,
    targetDir,
    framework: framework as FrameworkId,
    scope: org,
    packageName: `@${org}/${appName}`,
    projectName: appName,
    frontendAppName: appName,
    designSystem,
    ports: ['default'],
    apps: {
      ...config.apps,
      [`apps/${appName}`]: {
        framework: framework as FrameworkId,
      },
    },
    targetApp: `apps/${appName}`,
    blueprintPath: options.blueprintPath,
  })

  await generateDesignSystem({
    targetDir,
    designSystem: designSystem as DesignSystemId,
    scope: org,
    blueprintPath: options.blueprintPath,
    framework: framework as FrameworkId,
  })

  // Update Config
  upsertApp(repoRoot, `apps/${appName}`, {
    packageName: `@${org}/${appName}`,
    framework: framework as FrameworkId,
    designSystem: designSystem as DesignSystemId,
    ports: { default: 'default' },
  })

  addStep(repoRoot, {
    command: 'add',
    type: 'app',
    name: appName,
    driver: framework,
    app: `apps/${appName}`,
  })

  // Catalog
  const { createBlueprintRegistry } = await import('@kompojs/blueprints')
  const catalogRegistry = createBlueprintRegistry(repoRoot)
  const { mergeBlueprintScripts } = await import('../../../utils/scripts')

  const mergeCatalogFor = async (
    name: string,
    blueprintPath: string,
    context: Record<string, any> = {}
  ) => {
    const catalogPath = catalogRegistry.getBlueprintCatalogPath(blueprintPath)
    if (catalogPath) {
      mergeBlueprintCatalog(repoRoot, name, catalogPath)
      await mergeBlueprintScripts(repoRoot, blueprintPath, {
        scope: org,
        app: appName,
        ...context,
      })
    }
  }

  const frameworkId = framework as string
  await mergeCatalogFor(frameworkId, `apps/${frameworkId}/framework`, { name: frameworkId })

  if (designSystem) {
    const family = getFrameworkFamily(framework as string)
    await mergeCatalogFor(designSystem, `libs/ui/${family}/${designSystem}`, {
      name: designSystem,
      family,
    })
  }
  const features = getRequiredFeatures(framework as string, designSystem)
  updateCatalogFromFeatures(repoRoot, features)
  updateCatalogSources(repoRoot, features)

  // Regenerate catalog now that config has full app info (framework + designSystem)
  // This ensures design system catalogs are included in the final catalog
  const { regenerateCatalog } = await import('../../../utils/catalog.utils')
  await regenerateCatalog(repoRoot, { silent: true })

  // Resolve all "catalog:" references in generated package.json files
  // This replaces pnpm-specific "catalog:" with actual versions from kompo.catalog.json
  // making the output compatible with all package managers (bun, npm, yarn, pnpm)
  const { readdirSync, existsSync } = await import('node:fs')
  const resolveAllRefs = async (dir: string) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const pkgJson = path.join(dir, entry.name, 'package.json')
        if (existsSync(pkgJson)) {
          resolveCatalogReferences(repoRoot, pkgJson)
          await resolveWorkspaceReferences(repoRoot, pkgJson)
        }
        await resolveAllRefs(path.join(dir, entry.name))
      }
    }
  }
  // kompo adds files only on apps and libs directories
  await resolveAllRefs(path.join(repoRoot, 'apps'))
  await resolveAllRefs(path.join(repoRoot, 'libs'))

  runSort(repoRoot)
  if (!options.skipInstall) {
    await installDependencies(repoRoot)
    runFormat(repoRoot)
  }
}
