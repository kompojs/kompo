/**
 * Package manager detection and command abstraction.
 *
 * Detects npm, yarn, pnpm, or bun based on lockfiles found
 * in the project root, and exposes helpers to build install /
 * exec / run commands for the detected manager.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type PackageManagerName = 'pnpm' | 'npm' | 'yarn' | 'bun'

export interface PackageManager {
  /** The detected package manager name */
  name: PackageManagerName
  /** The lockfile that was used for detection */
  lockfile: string
  /** Build an install command (e.g. `pnpm install`) */
  installCommand(args?: string[]): string[]
  /** Build a run-script command (e.g. `pnpm run build`) */
  runCommand(script: string, args?: string[]): string[]
  /** Build an exec command (e.g. `pnpm exec biome check`) */
  execCommand(bin: string, args?: string[]): string[]
  /** Build an add-dependency command (e.g. `pnpm add -D foo`) */
  addCommand(packages: string[], dev?: boolean): string[]
  /** Build a workspace-filtered run command */
  workspaceRunCommand(filter: string, script: string, args?: string[]): string[]
}

interface LockfileEntry {
  file: string
  name: PackageManagerName
}

const LOCKFILES: LockfileEntry[] = [
  { file: 'package-lock.json', name: 'npm' },
  { file: 'pnpm-lock.yaml', name: 'pnpm' },
  { file: 'bun.lock', name: 'bun' },
  { file: 'bun.lockb', name: 'bun' },
  { file: 'yarn.lock', name: 'yarn' },
]

/**
 * Detect the package manager by walking up from `startDir`
 * looking for known lockfiles. Returns `pnpm` as default
 * when nothing is found.
 */
export function detectPackageManager(startDir: string): PackageManager {
  let dir = startDir
  let lastDir = ''

  while (dir !== lastDir) {
    lastDir = dir

    // First check for lockfiles (most reliable)
    for (const entry of LOCKFILES) {
      const lockfilePath = join(dir, entry.file)
      if (existsSync(lockfilePath)) {
        return createPackageManager(entry.name, entry.file)
      }
    }

    // If no lockfile, check for npm workspaces configuration
    const packageJsonPath = join(dir, 'package.json')
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        if (pkg.workspaces && Array.isArray(pkg.workspaces)) {
          // Has workspaces - assume npm if no other lockfile found
          return createPackageManager('npm', 'package-lock.json')
        }
      } catch {
        // Ignore errors reading package.json
      }
    }

    // Stop at repository root (.git)
    if (existsSync(join(dir, '.git'))) {
      break
    }

    dir = join(dir, '..')
  }

  // Default to pnpm when no lockfile is found
  return createPackageManager('pnpm', 'pnpm-lock.yaml')
}

function createPackageManager(name: PackageManagerName, lockfile: string): PackageManager {
  return {
    name,
    lockfile,
    installCommand: (args?: string[]) => buildInstallCommand(name, args),
    runCommand: (script: string, args?: string[]) => buildRunCommand(name, script, args),
    execCommand: (bin: string, args?: string[]) => buildExecCommand(name, bin, args),
    addCommand: (packages: string[], dev?: boolean) => buildAddCommand(name, packages, dev),
    workspaceRunCommand: (filter: string, script: string, args?: string[]) =>
      buildWorkspaceRunCommand(name, filter, script, args),
  }
}

function buildInstallCommand(pm: PackageManagerName, args: string[] = []): string[] {
  return [pm, 'install', ...args]
}

function buildRunCommand(pm: PackageManagerName, script: string, args: string[] = []): string[] {
  if (pm === 'npm') return ['npm', 'run', script, '--', ...args]
  return [pm, 'run', script, ...args]
}

function buildExecCommand(pm: PackageManagerName, bin: string, args: string[] = []): string[] {
  switch (pm) {
    case 'npm':
      return ['npx', bin, ...args]
    case 'yarn':
      return ['yarn', 'dlx', bin, ...args]
    case 'bun':
      return ['bunx', bin, ...args]
    default:
      return ['pnpm', 'exec', bin, ...args]
  }
}

function buildAddCommand(pm: PackageManagerName, packages: string[], dev = false): string[] {
  const devFlag = dev ? (pm === 'npm' ? '--save-dev' : '-D') : ''

  const cmd = [pm, 'add']
  if (devFlag) cmd.push(devFlag)
  cmd.push(...packages)
  return cmd
}

function buildWorkspaceRunCommand(
  pm: PackageManagerName,
  filter: string,
  script: string,
  args: string[] = []
): string[] {
  switch (pm) {
    case 'pnpm':
      return ['pnpm', '--filter', filter, 'run', script, ...args]
    case 'yarn':
      return ['yarn', 'workspace', filter, 'run', script, ...args]
    case 'npm':
      return ['npm', 'run', script, '--workspace', filter, '--', ...args]
    case 'bun':
      return ['bun', 'run', '--filter', filter, script, ...args]
  }
}
