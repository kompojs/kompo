/**
 * Workspace detection and configuration utilities.
 *
 * Supports multiple workspace formats:
 * - pnpm-workspace.yaml (pnpm)
 * - package.json#workspaces (npm, yarn, bun)
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export type WorkspaceType = 'pnpm' | 'npm' | 'yarn' | 'bun' | 'unknown'

export interface WorkspaceInfo {
  /** Absolute path to the workspace root */
  root: string
  /** Which workspace type was detected */
  type: WorkspaceType
  /** The workspace glob patterns */
  patterns: string[]
}

/**
 * Walk up from `startDir` looking for a workspace root.
 *
 * Detection order:
 * 1. pnpm-workspace.yaml → pnpm workspace
 * 2. package.json with `workspaces` field → npm/yarn/bun workspace
 *
 * Returns null if no workspace root is found.
 */
export function findWorkspaceRoot(startDir: string): WorkspaceInfo | null {
  let dir = startDir

  while (true) {
    // 1. pnpm-workspace.yaml
    const pnpmWorkspace = join(dir, 'pnpm-workspace.yaml')
    if (existsSync(pnpmWorkspace)) {
      const patterns = parsePnpmWorkspace(pnpmWorkspace)
      return { root: dir, type: 'pnpm', patterns }
    }

    // 2. package.json with `workspaces`
    const pkgJsonPath = join(dir, 'package.json')
    if (existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
        if (pkg.workspaces) {
          const patterns = Array.isArray(pkg.workspaces)
            ? pkg.workspaces
            : pkg.workspaces.packages || []

          // Determine workspace type from lockfile
          const type = detectWorkspaceType(dir)
          return { root: dir, type, patterns }
        }
      } catch {
        // Invalid package.json, skip
      }
    }

    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return null
}

/**
 * Parse pnpm-workspace.yaml and return the package globs.
 */
function parsePnpmWorkspace(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, 'utf-8')
    // Simple YAML parsing for the packages field — avoids needing
    // the yaml package here since the format is predictable.
    const lines = content.split('\n')
    const patterns: string[] = []
    let inPackages = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === 'packages:') {
        inPackages = true
        continue
      }
      if (inPackages) {
        if (trimmed.startsWith('- ')) {
          patterns.push(trimmed.slice(2).replace(/^['"]|['"]$/g, ''))
        } else if (trimmed && !trimmed.startsWith('#')) {
          break
        }
      }
    }

    return patterns
  } catch {
    return []
  }
}

/**
 * Detect workspace type by checking which lockfile exists in a directory.
 */
function detectWorkspaceType(dir: string): WorkspaceType {
  if (existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb'))) return 'bun'
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(dir, 'package-lock.json'))) return 'npm'
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm'
  return 'unknown'
}
