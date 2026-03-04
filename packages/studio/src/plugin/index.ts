/* eslint-disable @typescript-eslint/no-explicit-any */

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export interface KompoStudioPluginOptions {
  /**
   * Keyboard shortcut to toggle the studio panel.
   * @default 'k' (Ctrl+K)
   */
  shortcutKey?: string
}

const STUDIO_ENTRY = '/@kompo-studio/client.js'
const VIRTUAL_CONFIG = 'virtual:kompo-config'
const RESOLVED_CONFIG = '\0virtual:kompo-config'

/**
 * Walk up from `startDir` looking for kompo.config.json
 * Checks: <root>/kompo.config.json and <root>/libs/config/kompo.config.json
 */
function findKompoConfig(startDir: string): string | null {
  let dir = startDir
  const seen = new Set<string>()
  while (!seen.has(dir)) {
    seen.add(dir)
    // Direct: <root>/kompo.config.json
    const direct = resolve(dir, 'kompo.config.json')
    if (existsSync(direct)) return direct
    // Convention: <root>/libs/config/kompo.config.json
    const nested = resolve(dir, 'libs/config/kompo.config.json')
    if (existsSync(nested)) return nested
    dir = dirname(dir)
  }
  return null
}

/**
 * Vite plugin that injects Kompo Studio DevTools into any application.
 * Works with React, Vue, Nuxt, SvelteKit, or any Vite-based app.
 *
 * The studio bundles its own React internally — no framework dependency on the host app.
 *
 * Usage in vite.config.ts:
 * ```ts
 * import { kompoStudio } from '@kompo/studio/plugin'
 * export default defineConfig({
 *   plugins: [kompoStudio()],
 * })
 * ```
 *
 * Usage in nuxt.config.ts:
 * ```ts
 * import { kompoStudio } from '@kompo/studio/plugin'
 * export default defineNuxtConfig({
 *   vite: { plugins: [kompoStudio()] },
 * })
 * ```
 */
export function kompoStudio(options?: KompoStudioPluginOptions) {
  const shortcutKey = options?.shortcutKey ?? 'k'
  let isDev = false
  let rootDir = ''

  return {
    name: 'kompo-studio',
    enforce: 'pre' as const,

    configResolved(config: any) {
      isDev = config.command === 'serve'
      rootDir = config.root || process.cwd()
    },

    configureServer(server: any) {
      // Find workspace root (where pnpm-workspace.yaml lives)
      function findWorkspaceRoot(startDir: string): string {
        let dir = startDir
        const visited = new Set<string>()
        while (!visited.has(dir)) {
          visited.add(dir)
          if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir
          dir = dirname(dir)
        }
        return startDir
      }

      return () => {
        const cwd = findWorkspaceRoot(rootDir)

        // Shell exec endpoint — runs `pnpm kompo <args>` with all flags pre-resolved
        server.middlewares.use(async (req: any, res: any, next: any) => {
          if (req.url !== '/@kompo-studio/exec' || req.method !== 'POST') return next()

          let body = ''
          req.on('data', (chunk: any) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { command } = JSON.parse(body)
              if (!command || typeof command !== 'string') {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing command' }))
                return
              }

              const args = command.trim().split(/\s+/)
              // Only add --yes for commands that support it (add, new)
              // Don't add for list, wire, help, etc.
              const SUPPORTS_YES = ['add', 'new']
              const finalArgs = SUPPORTS_YES.includes(args[0]) ? [...args, '--yes'] : args
              const child = spawn('pnpm', ['kompo', ...finalArgs], {
                cwd,
                env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', TERM: 'dumb' },
                stdio: ['ignore', 'pipe', 'pipe'],
              })

              const timeout = setTimeout(() => {
                child.kill('SIGTERM')
              }, 120_000)

              let stdout = ''
              let stderr = ''
              child.stdout.on('data', (data: any) => {
                stdout += data.toString()
              })
              child.stderr.on('data', (data: any) => {
                stderr += data.toString()
              })
              child.on('close', (code: number) => {
                clearTimeout(timeout)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ stdout, stderr, exitCode: code }))
              })
              child.on('error', (err: any) => {
                clearTimeout(timeout)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              })
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid JSON body' }))
            }
          })
        })

        // Serve the studio client entry
        server.middlewares.use(async (req: any, res: any, next: any) => {
          if (req.url !== STUDIO_ENTRY) return next()

          try {
            const result = await server.transformRequest(STUDIO_ENTRY)
            if (result) {
              res.setHeader('Content-Type', 'application/javascript')
              res.end(result.code)
            } else {
              res.statusCode = 500
              res.end('// Kompo Studio: transform failed')
            }
          } catch {
            res.statusCode = 500
            res.end('// Kompo Studio: transform error')
          }
        })
      }
    },

    resolveId(id: string) {
      if (id === STUDIO_ENTRY) return id
      if (id === VIRTUAL_CONFIG) return RESOLVED_CONFIG
    },

    load(id: string) {
      if (id === STUDIO_ENTRY) {
        return `import '@kompo/studio/client-src';`
      }
      if (id === RESOLVED_CONFIG) {
        const configPath = findKompoConfig(rootDir)
        if (configPath) {
          const config = readFileSync(configPath, 'utf-8')
          return `export default ${config}`
        }
        return `export default {}`
      }
    },

    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string) {
        if (!isDev) return html

        const studioScript = `
<script type="module" src="${STUDIO_ENTRY}"></script>
<script>
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === '${shortcutKey}') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('kompo-studio:toggle'));
    }
  });
</script>`

        return html.replace('</body>', `${studioScript}\n</body>`)
      },
    },
  }
}

export default kompoStudio
