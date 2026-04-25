import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DoctorCheck, DoctorCheckContext, DoctorCheckResult } from '../doctor.check'
import { registerDoctorCheck } from '../doctor.registry'

const KOMPO_PACKAGES = [
  '@kompojs/cli',
  '@kompojs/kit',
  '@kompojs/config',
  '@kompojs/core',
  '@kompojs/blueprints',
  '@kompojs/blueprints-nextjs',
  '@kompojs/blueprints-react',
  '@kompojs/blueprints-nuxt',
  '@kompojs/blueprints-vue',
  '@kompojs/blueprints-express',
  '@kompojs/workbench',
]

function resolvePackageVersion(repoRoot: string, packageName: string): string | null {
  // Try to find the package in node_modules
  const parts = packageName.split('/')
  const pkgJsonPath = join(repoRoot, 'node_modules', ...parts, 'package.json')

  if (!existsSync(pkgJsonPath)) return null

  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    return pkg.version ?? null
  } catch {
    return null
  }
}

function getInstalledKompoPackages(repoRoot: string): Map<string, string> {
  const installed = new Map<string, string>()

  // Check @kompojs scope in node_modules
  const kompoDir = join(repoRoot, 'node_modules', '@kompojs')
  if (existsSync(kompoDir)) {
    try {
      const entries = readdirSync(kompoDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() || entry.isSymbolicLink()) {
          const pkgName = `@kompojs/${entry.name}`
          const version = resolvePackageVersion(repoRoot, pkgName)
          if (version) installed.set(pkgName, version)
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // Also check @kompojs scope
  const kompojsDir = join(repoRoot, 'node_modules', '@kompojs')
  if (existsSync(kompojsDir)) {
    try {
      const entries = readdirSync(kompojsDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() || entry.isSymbolicLink()) {
          const pkgName = `@kompojs/${entry.name}`
          const version = resolvePackageVersion(repoRoot, pkgName)
          if (version) installed.set(pkgName, version)
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return installed
}

function parseMajorMinor(version: string): string {
  // Strip pre-release info for comparison (e.g. 0.1.3-beta.6 -> 0.1)
  const clean = version.replace(/^[~^]/, '')
  const parts = clean.split('.')
  return `${parts[0]}.${parts[1]}`
}

export const crossPackageVersionsCheck: DoctorCheck = {
  id: 'cross-package-versions',
  description: 'Checking @kompojs/* package version compatibility',
  async run(ctx: DoctorCheckContext): Promise<DoctorCheckResult[]> {
    const results: DoctorCheckResult[] = []
    const installed = getInstalledKompoPackages(ctx.repoRoot)

    if (installed.size === 0) {
      return [
        {
          status: 'warning',
          message: 'No @kompo packages found in node_modules.',
          suggestion: 'Run your package manager install command first.',
        },
      ]
    }

    // Group by major.minor version
    const versionGroups = new Map<string, string[]>()
    for (const [pkg, version] of installed) {
      const mm = parseMajorMinor(version)
      const group = versionGroups.get(mm) || []
      group.push(`${pkg}@${version}`)
      versionGroups.set(mm, group)
    }

    // If all packages share the same major.minor, they're compatible
    if (versionGroups.size <= 1) {
      const versions = Array.from(installed.entries())
        .map(([pkg, v]) => `${pkg}@${v}`)
        .join(', ')
      results.push({
        status: 'info',
        message: `Found ${installed.size} @kompo package(s): ${versions}`,
      })
      return [{ status: 'ok' }]
    }

    // Version mismatch detected
    for (const [mm, packages] of versionGroups) {
      results.push({
        status: 'warning',
        message: `Version group ${mm}.x: ${packages.join(', ')}`,
      })
    }

    results.unshift({
      status: 'error',
      message: `Version mismatch: @kompo packages are at different minor versions.`,
      suggestion:
        'Update all @kompo packages to the same version: pnpm add -D @kompojs/cli@latest @kompojs/blueprints@latest @kompojs/config@latest @kompojs/kit@latest',
    })

    // Check individual package.json dependencies for workspace vs npm
    const rootPkgPath = join(ctx.repoRoot, 'package.json')
    if (existsSync(rootPkgPath)) {
      try {
        const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'))
        const allDeps = {
          ...(rootPkg.dependencies || {}),
          ...(rootPkg.devDependencies || {}),
        }

        for (const pkgName of KOMPO_PACKAGES) {
          const spec = allDeps[pkgName]
          if (spec?.startsWith('workspace:')) {
            results.push({
              status: 'info',
              message: `${pkgName} is linked via workspace protocol (${spec})`,
            })
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    return results
  },
}

registerDoctorCheck(crossPackageVersionsCheck)
