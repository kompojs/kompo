import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { log } from '@clack/prompts'
import { detectPackageManager } from '@kompojs/kit'
import color from 'picocolors'

const FRAMEWORKS_WITH_BLUEPRINTS = new Set(['nextjs', 'react', 'vue', 'nuxt'])

/**
 * Ensure the framework-specific blueprint package is installed at the repo root.
 *
 * When users scaffold via `pnpm create kompojs` without a template flag, the
 * blueprint package for their chosen framework may be missing. Without it,
 * `listDesignSystems(framework)` returns an empty array and `@clack/prompts`
 * `select({ options: [] })` crashes with:
 *     TypeError: Cannot read properties of undefined (reading 'disabled')
 *
 * This helper installs `@kompojs/blueprints-<framework>` on-demand before the
 * design system prompt runs.
 */
export async function ensureFrameworkBlueprintInstalled(
  repoRoot: string,
  framework: string
): Promise<void> {
  if (!FRAMEWORKS_WITH_BLUEPRINTS.has(framework)) {
    return
  }

  const packageName = `@kompojs/blueprints-${framework}`
  const packageDir = join(repoRoot, 'node_modules', '@kompojs', `blueprints-${framework}`)

  if (existsSync(packageDir)) {
    return
  }

  const pm = detectPackageManager(repoRoot)
  const [cmd, ...args] = pm.addCommand([packageName], true)

  // pnpm/yarn require an explicit workspace-root flag when adding deps at the
  // monorepo root. `addCommand()` does not know the caller's intent, so we
  // inject the flag here where it is unambiguous.
  if (pm.name === 'pnpm') {
    args.splice(1, 0, '-w')
  } else if (pm.name === 'yarn') {
    args.splice(1, 0, '-W')
  }

  log.info(color.dim(`Installing ${packageName}...`))

  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: repoRoot, stdio: 'pipe' })
    const stderr: string[] = []

    child.stderr?.on('data', (data: Buffer) => {
      stderr.push(data.toString())
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(
          new Error(`Failed to install ${packageName} (exit ${code}).\n${stderr.join('')}`.trim())
        )
      }
    })

    child.on('error', reject)
  })
}
