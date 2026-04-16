import * as p from '@clack/prompts'
import { Command } from 'commander'
import 'dotenv/config'
import { checkQuota, KOMPO_MODEL, KOMPO_PROXY_PORT, readLicence, readQuota } from '@kompojs/ai'
import color from 'picocolors'

const PROXY_BASE = `http://localhost:${KOMPO_PROXY_PORT}`

export function createAiCommand(): Command {
  return new Command('ai')
    .description('Chat with Kompo AI via the local proxy')
    .action(async () => {
      // Pre-flight: check proxy is running
      const s = p.spinner()
      s.start('Connecting to Kompo AI proxy...')

      let proxyOk = false
      try {
        const res = await fetch(`${PROXY_BASE}/health`)
        proxyOk = res.ok
      } catch {
        // not running
      }

      if (!proxyOk) {
        s.stop(color.red('Proxy not running'))
        p.log.error(`Start the proxy first: ${color.cyan('kompo ai:serve')}`)
        p.log.message(`  Or run ${color.cyan('kompo ai:setup')} if you haven't set up yet.`)
        return
      }

      s.stop(color.green('Connected to proxy'))

      // Show quota info
      const licence = readLicence()
      if (licence) {
        const quota = readQuota(licence.licenceKey)
        if (quota) {
          const check = checkQuota(quota)
          if (!check.allowed) {
            const reason =
              check.reason === 'daily_limit'
                ? 'Daily token limit reached. Resets at midnight UTC.'
                : `Monthly quota reached. Manage your plan → ${color.cyan('kompo workbench')}`
            p.log.error(reason)
            return
          }
          if (check.warning) {
            p.log.warn(check.warning)
          }
        }
      }

      await chatLoop()
    })
}

async function chatLoop() {
  p.intro(
    `${color.bgCyan(color.black(' kompo ai '))}${color.bgMagenta(` ${color.bold(color.white(KOMPO_MODEL))} `)}`
  )
  p.log.message(color.dim(`  Proxy: ${PROXY_BASE} | Type "exit" to quit`))

  const messages: Array<{ role: string; content: string }> = []

  while (true) {
    try {
      const input = await p.text({
        message: 'kompo ai >',
        placeholder: 'Type your message (or "exit" to quit)',
      })

      if (
        p.isCancel(input) ||
        (typeof input === 'string' &&
          (input.toLowerCase() === 'exit' ||
            input.trim() === '\\exit' ||
            input.trim() === '\\quit'))
      ) {
        p.outro('Bye!')
        return
      }

      if (typeof input === 'string' && input.trim()) {
        messages.push({ role: 'user', content: input.trim() })
        await runStream(messages)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('quota_exceeded') || msg.includes('429')) {
        p.log.error(`Token limit reached. Check your status: ${color.cyan('kompo ai:status')}`)
        return
      }
      p.log.error(msg)
    }
  }
}

async function runStream(messages: Array<{ role: string; content: string }>) {
  const s = p.spinner()
  s.start('Thinking...')

  const res = await fetch(`${PROXY_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: KOMPO_MODEL,
      messages,
      stream: true,
    }),
  })

  if (!res.ok) {
    s.stop('Error')
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(body.error?.message ?? `Proxy error: ${res.status}`)
  }

  if (!res.body) {
    s.stop('Error')
    throw new Error('No response body from proxy')
  }

  s.stop('')

  let fullContent = ''
  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  await p.stream.step(
    (async function* () {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const chunk = JSON.parse(data)
            const content = chunk.choices?.[0]?.delta?.content
            if (content) {
              fullContent += content
              yield content
            }
          } catch {
            // skip malformed SSE
          }
        }
      }
    })()
  )

  messages.push({ role: 'assistant', content: fullContent })
}
