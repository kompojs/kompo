import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Command } from 'commander'
import color from 'picocolors'

interface WorkbenchOptions {
  port?: string
  host?: string
  cwd?: string
}

/**
 * Walk up from startDir looking for workspace markers (pnpm-workspace.yaml, package.json#workspaces)
 */
function findWorkspaceRoot(startDir: string): string {
  let dir = startDir
  const seen = new Set<string>()

  while (!seen.has(dir)) {
    seen.add(dir)

    // pnpm workspace
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      return dir
    }

    // npm/yarn workspaces
    const pkgPath = resolve(dir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.workspaces) {
          return dir
        }
      } catch {
        /* continue */
      }
    }

    // Stop at filesystem root
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return startDir
}

export function createWorkbenchCommand(): Command {
  const command = new Command('workbench')
    .description('Launch Kompo Workbench DevTools (standalone server)')
    .option('-p, --port <port>', 'HTTP port (default: 9100)', '9100')
    .option('--host <host>', 'Bind host (default: 127.0.0.1)', '127.0.0.1')
    .option('--cwd <dir>', 'Project root directory (default: auto-detect)')
    .action(async (options: WorkbenchOptions) => {
      const projectRoot = options.cwd ?? findWorkspaceRoot(process.cwd())

      // Detect package manager
      const pm = detectPackageManager(projectRoot)

      // Check if workbench is installed
      const workbenchInstalled = isWorkbenchInstalled(projectRoot, pm)
      if (!workbenchInstalled) {
        console.log(color.yellow('⚠️  @kompojs/workbench not found in workspace'))
        console.log(color.gray(`   Installing via ${pm}...`))

        const installResult = await installWorkbench(projectRoot, pm)
        if (!installResult) {
          console.error(color.red('❌ Failed to install @kompojs/workbench'))
          process.exit(1)
        }
        console.log(color.green('✓ @kompojs/workbench installed'))
      }

      console.log(color.gray(`   Project: ${projectRoot}`))
      console.log(color.gray(`   Package manager: ${pm}`))
      console.log(color.cyan('\n🚀 Starting Kompo Workbench...\n'))

      // Spawn workbench server
      const args = [
        'kompo-workbench',
        '--port',
        options.port ?? '9100',
        '--host',
        options.host ?? '127.0.0.1',
      ]
      if (options.cwd) {
        args.push('--cwd', options.cwd)
      }

      const child = spawn(pm, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          FORCE_COLOR: '1',
        },
      })

      child.on('error', (err) => {
        console.error(color.red(`\n❌ Failed to start workbench: ${err.message}\n`))
        process.exit(1)
      })

      child.on('exit', (code) => {
        process.exit(code ?? 0)
      })

      // Handle termination signals
      const shutdown = (signal: string) => {
        console.log(color.gray(`\n${signal} received — stopping workbench...`))
        child.kill(signal as NodeJS.Signals)
      }

      process.on('SIGINT', () => shutdown('SIGINT'))
      process.on('SIGTERM', () => shutdown('SIGTERM'))
    })

  return command
}

function detectPackageManager(cwd: string): string {
  if (existsSync(resolve(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(resolve(cwd, 'bun.lock')) || existsSync(resolve(cwd, 'bun.lockb'))) return 'bun'
  if (existsSync(resolve(cwd, 'yarn.lock'))) return 'yarn'
  if (existsSync(resolve(cwd, 'package-lock.json'))) return 'npm'
  return 'pnpm'
}

function isWorkbenchInstalled(cwd: string, pm: string): boolean {
  // Check node_modules for @kompojs/workbench
  const workbenchPaths = [
    resolve(cwd, 'node_modules/@kompojs/workbench/package.json'),
    resolve(cwd, 'apps/node_modules/@kompojs/workbench/package.json'),
  ]

  // Also check root for pnpm workspaces
  if (pm === 'pnpm') {
    workbenchPaths.push(resolve(cwd, '../../node_modules/@kompojs/workbench/package.json'))
  }

  return workbenchPaths.some((p) => existsSync(p))
}

async function installWorkbench(cwd: string, pm: string): Promise<boolean> {
  return new Promise((resolve) => {
    const args: string[] = []

    switch (pm) {
      case 'pnpm':
        args.push('add', '-D', '-w', '@kompojs/workbench')
        break
      case 'yarn':
        args.push('add', '-D', '-W', '@kompojs/workbench')
        break
      case 'npm':
        args.push('install', '-D', '@kompojs/workbench')
        break
      case 'bun':
        args.push('add', '-D', '@kompojs/workbench')
        break
      default:
        args.push('add', '-D', '@kompojs/workbench')
    }

    const child = spawn(pm, args, {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    })

    let stderr = ''
    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(stderr)
      }
      resolve(code === 0)
    })

    child.on('error', () => {
      resolve(false)
    })
  })
}
