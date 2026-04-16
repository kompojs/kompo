import { log } from '@clack/prompts'
import color from 'picocolors'

/**
 * Maps framework IDs to their corresponding blueprint package names.
 */
const FRAMEWORK_PACKAGES: Record<string, string> = {
  nextjs: '@kompojs/blueprints-nextjs',
  react: '@kompojs/blueprints-react',
  nuxt: '@kompojs/blueprints-nuxt',
  vue: '@kompojs/blueprints-vue',
  express: '@kompojs/blueprints-express',
}

/**
 * Check if a framework blueprint package is installed and prompt to install if missing.
 * Returns true if the package is available (or was just installed), false if user declined.
 */
export async function ensureBlueprintPackage(
  repoRoot: string,
  framework: string
): Promise<boolean> {
  const { createBlueprintRegistry } = await import('@kompojs/blueprints')
  const registry = createBlueprintRegistry(repoRoot)

  // Check if framework dir resolves (installed package or core fallback)
  const frameworkDir = registry.resolveFrameworkDir(framework)
  if (frameworkDir) return true

  const packageName = FRAMEWORK_PACKAGES[framework]
  if (!packageName) {
    log.warn(`No blueprint package found for framework "${framework}".`)
    return false
  }

  // Package not installed — prompt user
  const { confirm } = await import('@clack/prompts')

  const shouldInstall = await confirm({
    message: `Blueprint package ${color.cyan(packageName)} is not installed. Install it now?`,
    initialValue: true,
  })

  if (typeof shouldInstall === 'symbol' || !shouldInstall) {
    log.warn(`Skipped installing ${packageName}. Some templates may be missing.`)
    return false
  }

  // Install the package
  const { detectPackageManager } = await import('@kompojs/kit')
  const pm = detectPackageManager(repoRoot)
  const [cmd, ...args] = pm.addCommand([packageName, '-D'])

  log.info(`Installing ${color.cyan(packageName)}...`)

  const { execSync } = await import('node:child_process')
  try {
    execSync([cmd, ...args].join(' '), { cwd: repoRoot, stdio: 'pipe' })
    log.success(`Installed ${color.green(packageName)}`)
    return true
  } catch (e) {
    log.error(`Failed to install ${packageName}: ${(e as Error).message}`)
    return false
  }
}

/**
 * Get the expected blueprint package name for a given framework.
 */
export function getBlueprintPackageName(framework: string): string | undefined {
  return FRAMEWORK_PACKAGES[framework]
}
