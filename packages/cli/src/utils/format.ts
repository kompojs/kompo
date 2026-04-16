import { execSync } from 'node:child_process'
import { detectPackageManager } from '@kompojs/kit'

/**
 * Runs pnpm format in the specified directory
 * Defaults to ignoring output unless error occurs
 */
export function runFormat(cwd: string) {
  const pm = detectPackageManager(cwd)
  try {
    // 1. Try running 'check' script (standard in this repo)
    execSync(pm.runCommand('check').join(' '), { cwd, stdio: 'ignore' })
  } catch (_error) {
    try {
      // 2. Fallback: Run biome directly via exec
      execSync(pm.execCommand('biome', ['check', '--write', '.']).join(' '), {
        cwd,
        stdio: 'ignore',
      })
    } catch (_e) {
      // Ignore
    }
  }
}

/**
 * Runs pnpm sort (sort-package-json) in the specified directory
 */
export function runSort(cwd: string) {
  const pm = detectPackageManager(cwd)
  try {
    // 1. Try running 'sort' script
    execSync(pm.runCommand('sort').join(' '), { cwd, stdio: 'ignore' })
  } catch (_error) {
    try {
      // 2. Fallback: Run sort-package-json directly
      execSync(pm.execCommand('sort-package-json', ['package.json']).join(' '), {
        cwd,
        stdio: 'ignore',
      })
    } catch (_e) {
      // Ignore
    }
  }
}
