import { spawn } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import * as p from '@clack/prompts'
import {
  checkModel,
  checkRunning,
  ensureKompoDir,
  KOMPO_MODEL,
  KOMPO_PROXY_PORT,
  PROXY_PID_PATH,
  readLicence,
} from '@kompojs/ai'
import { Command } from 'commander'
import color from 'picocolors'

export function createAiServeCommand(): Command {
  const cmd = new Command('ai:serve').description(
    'Start/stop the Kompo AI proxy (OpenAI-compatible endpoint)'
  )

  cmd
    .command('start')
    .description('Start the proxy daemon')
    .option('-p, --port <port>', 'Port to listen on', String(KOMPO_PROXY_PORT))
    .action(async (opts) => {
      const port = parseInt(opts.port, 10)

      // Check if already running
      if (existsSync(PROXY_PID_PATH)) {
        const pid = readFileSync(PROXY_PID_PATH, 'utf-8').trim()
        if (isProcessRunning(parseInt(pid, 10))) {
          p.log.warn(`Proxy already running (PID ${pid}) on port ${port}`)
          p.log.message(`  Endpoint: ${color.cyan(`http://localhost:${port}/v1/chat/completions`)}`)
          return
        }
        unlinkSync(PROXY_PID_PATH)
      }

      // Pre-flight checks
      const s = p.spinner()
      s.start('Pre-flight checks...')

      const licence = readLicence()
      if (!licence) {
        s.stop(color.red('No licence found'))
        p.log.error(`Run ${color.cyan('kompo ai:setup')} first.`)
        return
      }

      const ollamaRunning = await checkRunning()
      if (!ollamaRunning) {
        s.stop(color.red('Ollama is not running'))
        p.log.error(`Start Ollama first: ${color.cyan('ollama serve')}`)
        return
      }

      const modelReady = await checkModel(KOMPO_MODEL)
      if (!modelReady) {
        s.stop(color.red(`Model "${KOMPO_MODEL}" not found`))
        p.log.error(`Run ${color.cyan('kompo ai:setup')} to install the model.`)
        return
      }

      s.stop(color.green('All checks passed'))

      // Start proxy as detached process
      const proxyModule = resolveProxyModule()
      if (!proxyModule) {
        p.log.error('Could not resolve @kompojs/ai proxy module. Is @kompojs/ai installed?')
        return
      }

      const child = spawn('node', [proxyModule], {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, KOMPO_PROXY_PORT: String(port) },
      })

      child.unref()

      if (child.pid) {
        ensureKompoDir()
        writeFileSync(PROXY_PID_PATH, String(child.pid))
        p.log.success(`Proxy started (PID ${child.pid})`)
        p.log.message(
          `  Endpoint:     ${color.cyan(`http://localhost:${port}/v1/chat/completions`)}`
        )
        p.log.message(`  Health:       ${color.cyan(`http://localhost:${port}/health`)}`)
        p.log.message(`  Model:        ${color.cyan(KOMPO_MODEL)}`)
        p.log.message('')
        p.log.message(`  ${color.dim('Add to your IDE as a custom OpenAI-compatible endpoint.')}`)
        p.log.message(`  ${color.dim(`Stop with: ${color.cyan('kompo ai:serve stop')}`)}`)
      } else {
        p.log.error('Failed to start proxy process.')
      }
    })

  cmd
    .command('stop')
    .description('Stop the proxy daemon')
    .action(async () => {
      if (!existsSync(PROXY_PID_PATH)) {
        p.log.info('No proxy running.')
        return
      }

      const pid = parseInt(readFileSync(PROXY_PID_PATH, 'utf-8').trim(), 10)
      try {
        process.kill(pid, 'SIGTERM')
        unlinkSync(PROXY_PID_PATH)
        p.log.success(`Proxy stopped (PID ${pid})`)
      } catch {
        unlinkSync(PROXY_PID_PATH)
        p.log.info('Proxy was not running (stale PID file removed).')
      }
    })

  cmd
    .command('status')
    .description('Check proxy status')
    .action(async () => {
      if (!existsSync(PROXY_PID_PATH)) {
        p.log.info('Proxy is not running.')
        return
      }

      const pid = parseInt(readFileSync(PROXY_PID_PATH, 'utf-8').trim(), 10)
      if (!isProcessRunning(pid)) {
        unlinkSync(PROXY_PID_PATH)
        p.log.info('Proxy is not running (stale PID file cleaned up).')
        return
      }

      p.log.success(`Proxy is running (PID ${pid})`)

      try {
        const res = await fetch(`http://localhost:${KOMPO_PROXY_PORT}/health`)
        if (res.ok) {
          const health = await res.json()
          p.log.message(
            `  Ollama:  ${health.ollamaConnected ? color.green('connected') : color.red('disconnected')}`
          )
          p.log.message(`  Model:   ${health.model}`)
          p.log.message(`  Version: ${health.proxyVersion}`)
          if (health.quota) {
            p.log.message(`  Plan:    ${health.quota.plan}`)
            p.log.message(
              `  Monthly: ${health.quota.monthlyUsed.toLocaleString()} / ${health.quota.monthlyLimit.toLocaleString()} tokens`
            )
            p.log.message(
              `  Daily:   ${health.quota.dailyUsed.toLocaleString()} / ${health.quota.dailyLimit.toLocaleString()} tokens`
            )
          }
        }
      } catch {
        p.log.warn('Could not reach proxy health endpoint.')
      }
    })

  // Default action (no subcommand) → start
  cmd.action(async () => {
    await cmd.commands.find((c) => c.name() === 'start')!.parseAsync([], { from: 'user' })
  })

  return cmd
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function resolveProxyModule(): string | null {
  try {
    const require = createRequire(import.meta.url)
    return require.resolve('@kompojs/ai/proxy')
  } catch {
    return null
  }
}
