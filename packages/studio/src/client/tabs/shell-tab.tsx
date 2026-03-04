import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'

// ── ANSI helpers ──
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgMagenta: '\x1b[45m',
}

// ── Strip ANSI for length calculations ──
const ESC = String.fromCharCode(0x1b)
const ANSI_RE = new RegExp(`${ESC}\\[[0-9;]*m`, 'g')
function stripAnsi(s: string) {
  return s.replace(ANSI_RE, '')
}

// ── Command definitions ──
interface SelectOption {
  label: string
  value: string
  hint?: string
}

interface CommandDef {
  description: string
  usage: string
  prompts?: PromptDef[]
}

interface PromptDef {
  flag: string
  message: string
  type: 'select' | 'text'
  options?: SelectOption[]
  defaultValue?: string
  required?: boolean
  validate?: (v: string) => string | null
}

const FRAMEWORKS: SelectOption[] = [
  { label: 'Next.js (App Router)', value: 'nextjs', hint: 'React - Fullstack' },
  { label: 'React + Vite', value: 'react', hint: 'React SPA' },
  { label: 'Nuxt', value: 'nuxt', hint: 'Vue - Fullstack' },
  { label: 'Vue + Vite', value: 'vue', hint: 'Vue SPA' },
  { label: 'Express', value: 'express', hint: 'Node.js API' },
]

const DESIGN_SYSTEMS: SelectOption[] = [
  { label: 'Shadcn/ui', value: 'shadcn', hint: 'Tailwind + Radix' },
  { label: 'Tailwind CSS', value: 'tailwind', hint: 'Utility-first' },
  { label: 'Vanilla', value: 'vanilla', hint: 'No framework' },
]

const COMMANDS: Record<string, CommandDef> = {
  'add app': {
    description: 'Add a new application to the project',
    usage: 'add app [name] [--framework <fw>] [--design <ds>]',
    prompts: [
      {
        flag: '--framework',
        message: 'Select a framework',
        type: 'select',
        options: FRAMEWORKS,
        required: true,
      },
      {
        flag: 'name',
        message: 'Application name',
        type: 'text',
        defaultValue: 'web',
        required: true,
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? null : 'Must be lowercase kebab-case'),
      },
      {
        flag: '--design',
        message: 'Select a design system',
        type: 'select',
        options: DESIGN_SYSTEMS,
      },
    ],
  },
  'add domain': {
    description: 'Create a new domain',
    usage: 'add domain <name>',
    prompts: [
      {
        flag: 'name',
        message: 'Domain name',
        type: 'text',
        required: true,
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? null : 'Must be lowercase kebab-case'),
      },
    ],
  },
  'add port': {
    description: 'Add a port to a domain',
    usage: 'add port <name> -d <domain>',
    prompts: [
      {
        flag: 'name',
        message: 'Port name',
        type: 'text',
        required: true,
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? null : 'Must be lowercase kebab-case'),
      },
    ],
  },
  'add entity': {
    description: 'Add an entity to a domain',
    usage: 'add entity <name> -d <domain>',
    prompts: [
      {
        flag: 'name',
        message: 'Entity name',
        type: 'text',
        required: true,
        validate: (v) => (/^[A-Z][a-zA-Z0-9]*$/.test(v) ? null : 'Must be PascalCase'),
      },
    ],
  },
  'add use-case': {
    description: 'Add a use case to a domain',
    usage: 'add use-case <name> -d <domain>',
    prompts: [
      {
        flag: 'name',
        message: 'Use case name',
        type: 'text',
        required: true,
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? null : 'Must be lowercase kebab-case'),
      },
    ],
  },
  'add adapter': {
    description: 'Add an adapter',
    usage: 'add adapter',
  },
  list: {
    description: 'List project resources',
    usage: 'list [domains|ports|adapters|starters]',
  },
  wire: {
    description: 'Wire adapters to ports',
    usage: 'wire',
  },
}

// ── Kompo Shell Engine (runs inside xterm.js) ──
class KompoShell {
  private term: Terminal
  private line = ''
  private cursorPos = 0
  private history: string[] = []
  private historyIndex = -1
  private busy = false
  private promptResolve: ((v: string) => void) | null = null

  constructor(term: Terminal) {
    this.term = term
  }

  start() {
    this.printWelcome()
    this.printPrompt()

    this.term.onData((data) => {
      if (this.promptResolve) {
        this.handlePromptInput(data)
        return
      }
      if (this.busy) return
      this.handleInput(data)
    })
  }

  // ── Welcome banner ──
  private printWelcome() {
    const t = this.term
    t.writeln('')
    t.writeln(`  ${C.bgMagenta}${C.white}${C.bold} ◆ Kompo Shell ${C.reset}`)
    t.writeln('')
    t.writeln(`  ${C.white}A browser-based shell with the Kompo CLI built-in.${C.reset}`)
    t.writeln(`  ${C.gray}All interactive prompts are handled in this shell.${C.reset}`)
    t.writeln('')
    t.writeln(`  ${C.dim}─ View commands:       ${C.cyan}help${C.reset}`)
    t.writeln(`  ${C.dim}─ Add an application:  ${C.cyan}add app${C.reset}`)
    t.writeln(`  ${C.dim}─ List resources:      ${C.cyan}list domains${C.reset}`)
    t.writeln('')
  }

  private printPrompt() {
    this.term.write(`${C.magenta}kompo${C.reset} ${C.green}❯${C.reset} `)
    this.line = ''
    this.cursorPos = 0
  }

  // ── Line editing ──
  private handleInput(data: string) {
    // Enter
    if (data === '\r') {
      this.term.writeln('')
      const cmd = this.line.trim()
      if (cmd) {
        this.history.unshift(cmd)
        this.historyIndex = -1
        this.processCommand(cmd)
      } else {
        this.printPrompt()
      }
      return
    }

    // Backspace
    if (data === '\x7f') {
      if (this.cursorPos > 0) {
        this.line = this.line.slice(0, this.cursorPos - 1) + this.line.slice(this.cursorPos)
        this.cursorPos--
        // Rewrite line from cursor
        this.term.write('\b')
        this.term.write(`${this.line.slice(this.cursorPos)} `)
        // Move cursor back
        const moveBack = this.line.length - this.cursorPos + 1
        if (moveBack > 0) this.term.write(`\x1b[${moveBack}D`)
      }
      return
    }

    // Arrow up
    if (data === '\x1b[A') {
      if (this.history.length > 0 && this.historyIndex < this.history.length - 1) {
        this.historyIndex++
        this.replaceLine(this.history[this.historyIndex])
      }
      return
    }

    // Arrow down
    if (data === '\x1b[B') {
      if (this.historyIndex > 0) {
        this.historyIndex--
        this.replaceLine(this.history[this.historyIndex])
      } else if (this.historyIndex === 0) {
        this.historyIndex = -1
        this.replaceLine('')
      }
      return
    }

    // Arrow left
    if (data === '\x1b[D') {
      if (this.cursorPos > 0) {
        this.cursorPos--
        this.term.write(data)
      }
      return
    }

    // Arrow right
    if (data === '\x1b[C') {
      if (this.cursorPos < this.line.length) {
        this.cursorPos++
        this.term.write(data)
      }
      return
    }

    // Tab completion
    if (data === '\t') {
      this.handleTabComplete()
      return
    }

    // Ctrl+C
    if (data === '\x03') {
      this.term.writeln('^C')
      this.printPrompt()
      return
    }

    // Ctrl+L (clear)
    if (data === '\x0c') {
      this.term.clear()
      this.printPrompt()
      return
    }

    // Regular character
    if (data >= ' ') {
      this.line = this.line.slice(0, this.cursorPos) + data + this.line.slice(this.cursorPos)
      this.cursorPos += data.length
      // Write from cursor position to end
      this.term.write(data + this.line.slice(this.cursorPos))
      const moveBack = this.line.length - this.cursorPos
      if (moveBack > 0) this.term.write(`\x1b[${moveBack}D`)
    }
  }

  private replaceLine(newLine: string) {
    // Clear current line
    if (this.cursorPos > 0) this.term.write(`\x1b[${this.cursorPos}D`)
    this.term.write('\x1b[K')
    this.line = newLine
    this.cursorPos = newLine.length
    this.term.write(newLine)
  }

  private handleTabComplete() {
    const input = this.line.trimStart()
    const cmdKeys = Object.keys(COMMANDS)
    const matches = cmdKeys.filter((k) => k.startsWith(input) && k !== input)
    if (matches.length === 1) {
      const completion = `${matches[0].slice(input.length)} `
      this.line += completion
      this.cursorPos += completion.length
      this.term.write(completion)
    } else if (matches.length > 1) {
      this.term.writeln('')
      matches.forEach((m) => {
        this.term.writeln(`  ${C.cyan}${m}${C.reset}`)
      })
      this.printPrompt()
      this.term.write(this.line)
      this.cursorPos = this.line.length
    }
  }

  // ── Command processing ──
  private async processCommand(input: string) {
    this.busy = true

    if (input === 'clear') {
      this.term.clear()
      this.busy = false
      this.printPrompt()
      return
    }

    if (input === 'help') {
      this.printHelp()
      this.busy = false
      this.printPrompt()
      return
    }

    // Match command
    const cmdKey = this.findCommand(input)
    if (!cmdKey) {
      this.term.writeln(`${C.red}Unknown command: ${C.white}${input}${C.reset}`)
      this.term.writeln(`${C.gray}Type ${C.cyan}help${C.gray} for available commands.${C.reset}`)
      this.busy = false
      this.printPrompt()
      return
    }

    const cmdDef = COMMANDS[cmdKey]
    const parsed = this.parseArgs(input, cmdKey)

    // Collect missing required prompts interactively
    if (cmdDef.prompts) {
      for (const prompt of cmdDef.prompts) {
        const flagKey = prompt.flag.replace(/^--/, '')
        if (parsed[flagKey]) continue

        if (prompt.type === 'select' && prompt.options) {
          const value = await this.showSelect(prompt.message, prompt.options)
          if (value === null) {
            this.term.writeln(`${C.gray}Cancelled.${C.reset}`)
            this.busy = false
            this.printPrompt()
            return
          }
          parsed[flagKey] = value
        } else if (prompt.type === 'text') {
          const value = await this.showTextInput(
            prompt.message,
            prompt.defaultValue,
            prompt.validate
          )
          if (value === null) {
            this.term.writeln(`${C.gray}Cancelled.${C.reset}`)
            this.busy = false
            this.printPrompt()
            return
          }
          parsed[flagKey] = value
        }
      }
    }

    // Build the final command string with all flags resolved
    const finalCmd = this.buildCommand(cmdKey, parsed)
    this.term.writeln(`${C.gray}$ pnpm kompo ${finalCmd} --yes${C.reset}`)
    this.term.writeln('')

    // Execute via backend
    await this.execCommand(finalCmd)

    this.busy = false
    this.printPrompt()
  }

  private findCommand(input: string): string | null {
    const sorted = Object.keys(COMMANDS).sort((a, b) => b.length - a.length)
    for (const key of sorted) {
      if (input === key || input.startsWith(`${key} `)) return key
    }
    return null
  }

  private parseArgs(input: string, cmdKey: string): Record<string, string> {
    const rest = input.slice(cmdKey.length).trim()
    const tokens = rest.split(/\s+/).filter(Boolean)
    const result: Record<string, string> = {}

    let i = 0
    let positionalIndex = 0
    const positionals = COMMANDS[cmdKey].prompts?.filter((p) => !p.flag.startsWith('--')) || []

    while (i < tokens.length) {
      if (tokens[i].startsWith('--') || tokens[i].startsWith('-')) {
        const flag = tokens[i].replace(/^-+/, '')
        if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
          result[flag] = tokens[i + 1]
          i += 2
        } else {
          result[flag] = 'true'
          i++
        }
      } else {
        if (positionalIndex < positionals.length) {
          result[positionals[positionalIndex].flag] = tokens[i]
          positionalIndex++
        }
        i++
      }
    }
    return result
  }

  private buildCommand(cmdKey: string, args: Record<string, string>): string {
    let cmd = cmdKey
    const cmdDef = COMMANDS[cmdKey]
    const positionals = cmdDef.prompts?.filter((p) => !p.flag.startsWith('--')) || []
    const flags = cmdDef.prompts?.filter((p) => p.flag.startsWith('--')) || []

    for (const p of positionals) {
      if (args[p.flag]) cmd += ` ${args[p.flag]}`
    }
    for (const p of flags) {
      const key = p.flag.replace(/^--/, '')
      if (args[key]) cmd += ` ${p.flag} ${args[key]}`
    }
    // Pass through any extra flags
    for (const [k, v] of Object.entries(args)) {
      const isKnown = cmdDef.prompts?.some((p) => p.flag === k || p.flag === `--${k}`)
      if (!isKnown) {
        cmd += v === 'true' ? ` --${k}` : ` --${k} ${v}`
      }
    }
    return cmd
  }

  // ── Interactive select (rendered in xterm.js) ──
  private async showSelect(message: string, options: SelectOption[]): Promise<string | null> {
    return new Promise((resolve) => {
      let selected = 0
      const render = () => {
        // Move up to clear previous render
        if (selected >= 0) {
          this.term.write(`\x1b[${options.length + 1}A\r\x1b[J`)
        }
        this.term.writeln(`${C.magenta}◆${C.reset} ${C.bold}${message}${C.reset}`)
        options.forEach((opt, i) => {
          const cursor = i === selected ? `${C.green}●${C.reset}` : `${C.dim}○${C.reset}`
          const label =
            i === selected ? `${C.white}${opt.label}${C.reset}` : `${C.dim}${opt.label}${C.reset}`
          const hint = opt.hint ? ` ${C.gray}${opt.hint}${C.reset}` : ''
          this.term.writeln(`  ${cursor} ${label}${hint}`)
        })
      }

      // Initial render
      this.term.writeln(`${C.magenta}◆${C.reset} ${C.bold}${message}${C.reset}`)
      options.forEach((opt, i) => {
        const cursor = i === selected ? `${C.green}●${C.reset}` : `${C.dim}○${C.reset}`
        const label =
          i === selected ? `${C.white}${opt.label}${C.reset}` : `${C.dim}${opt.label}${C.reset}`
        const hint = opt.hint ? ` ${C.gray}${opt.hint}${C.reset}` : ''
        this.term.writeln(`  ${cursor} ${label}${hint}`)
      })

      this.promptResolve = (data: string) => {
        if (data === '\x1b[A') {
          // Up
          selected = Math.max(0, selected - 1)
          render()
        } else if (data === '\x1b[B') {
          // Down
          selected = Math.min(options.length - 1, selected + 1)
          render()
        } else if (data === '\r') {
          // Enter
          // Replace menu with selection
          this.term.write(`\x1b[${options.length + 1}A\r\x1b[J`)
          this.term.writeln(
            `${C.magenta}◆${C.reset} ${message} ${C.cyan}${options[selected].label}${C.reset}`
          )
          this.promptResolve = null
          resolve(options[selected].value)
        } else if (data === '\x03') {
          // Ctrl+C
          this.term.write(`\x1b[${options.length + 1}A\r\x1b[J`)
          this.term.writeln(`${C.magenta}◆${C.reset} ${message} ${C.gray}(cancelled)${C.reset}`)
          this.promptResolve = null
          resolve(null)
        }
      }
    })
  }

  // ── Interactive text input ──
  private async showTextInput(
    message: string,
    defaultValue?: string,
    validate?: (v: string) => string | null
  ): Promise<string | null> {
    return new Promise((resolve) => {
      let value = ''
      const defaultHint = defaultValue ? ` ${C.gray}(${defaultValue})${C.reset}` : ''
      this.term.write(`${C.magenta}◆${C.reset} ${message}${defaultHint}${C.gray}: ${C.reset}`)

      this.promptResolve = (data: string) => {
        if (data === '\r') {
          const final = value || defaultValue || ''
          if (validate) {
            const err = validate(final)
            if (err) {
              this.term.writeln('')
              this.term.writeln(`  ${C.red}✗ ${err}${C.reset}`)
              this.term.write(
                `${C.magenta}◆${C.reset} ${message}${defaultHint}${C.gray}: ${C.reset}`
              )
              value = ''
              return
            }
          }
          this.term.writeln('')
          this.promptResolve = null
          resolve(final)
        } else if (data === '\x03') {
          this.term.writeln('')
          this.promptResolve = null
          resolve(null)
        } else if (data === '\x7f') {
          if (value.length > 0) {
            value = value.slice(0, -1)
            this.term.write('\b \b')
          }
        } else if (data >= ' ') {
          value += data
          this.term.write(data)
        }
      }
    })
  }

  private handlePromptInput(data: string) {
    if (this.promptResolve) this.promptResolve(data)
  }

  // ── Execute command via backend ──
  private async execCommand(command: string) {
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    let frame = 0
    const interval = setInterval(() => {
      this.term.write(
        `\r${C.magenta}${spinner[frame % spinner.length]}${C.reset} ${C.gray}Running...${C.reset}\x1b[K`
      )
      frame++
    }, 80)

    try {
      const res = await fetch('/@kompo-studio/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })
      clearInterval(interval)
      this.term.write('\r\x1b[K')

      const data = await res.json()

      if (data.error) {
        this.term.writeln(`${C.red}Error: ${data.error}${C.reset}`)
        return
      }

      // Show stdout
      const stdout = (data.stdout || '').trim()
      if (stdout) {
        const cleaned = this.cleanOutput(stdout)
        cleaned.split('\n').forEach((line: string) => {
          this.term.writeln(`  ${C.white}${line}${C.reset}`)
        })
      }

      // Show stderr (filtered)
      const stderr = (data.stderr || '')
        .split('\n')
        .filter((l: string) => !l.match(/^(ELIFECYCLE|ERR!|\s*$|> .+@|WARN)/))
        .join('\n')
        .trim()
      if (stderr) {
        stderr.split('\n').forEach((line: string) => {
          this.term.writeln(`  ${C.dim}${line}${C.reset}`)
        })
      }

      if (data.exitCode !== 0 && !stdout && !stderr) {
        this.term.writeln(`${C.red}Command exited with code ${data.exitCode}${C.reset}`)
      } else if (data.exitCode === 0) {
        this.term.writeln(`${C.green}✓${C.reset} ${C.gray}Done${C.reset}`)
      }
    } catch {
      clearInterval(interval)
      this.term.write('\r\x1b[K')
      this.term.writeln(`${C.red}Failed to connect to Kompo Studio server.${C.reset}`)
    }
    this.term.writeln('')
  }

  private cleanOutput(text: string): string {
    // Strip ANSI codes from CLI output (ESC and CSI)
    const ctrl = `[${String.fromCharCode(0x1b)}${String.fromCharCode(0x9b)}]`
    const re = new RegExp(
      `${ctrl}\\[[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]`,
      'g'
    )
    return text.replace(re, '')
  }

  // ── Help ──
  private printHelp() {
    this.term.writeln('')
    this.term.writeln(`${C.bold}Available commands:${C.reset}`)
    this.term.writeln('')
    const maxLen = Math.max(...Object.values(COMMANDS).map((c) => stripAnsi(c.usage).length)) + 2
    for (const [, cmd] of Object.entries(COMMANDS)) {
      const padded = cmd.usage.padEnd(maxLen)
      this.term.writeln(`  ${C.cyan}${padded}${C.reset} ${C.dim}${cmd.description}${C.reset}`)
    }
    this.term.writeln('')
    this.term.writeln(`${C.bold}Shell commands:${C.reset}`)
    this.term.writeln('')
    this.term.writeln(
      `  ${C.cyan}${'help'.padEnd(maxLen)}${C.reset} ${C.dim}Show this help${C.reset}`
    )
    this.term.writeln(
      `  ${C.cyan}${'clear'.padEnd(maxLen)}${C.reset} ${C.dim}Clear the terminal${C.reset}`
    )
    this.term.writeln('')
    this.term.writeln(`${C.gray}Tip: Use Tab for autocompletion, ↑/↓ for history${C.reset}`)
    this.term.writeln('')
  }
}

// ── React component ──
export function ShellTab() {
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
      theme: {
        background: '#0a0a10',
        foreground: '#e2e8f0',
        cursor: '#7c3aed',
        selectionBackground: '#7c3aed40',
        black: '#0a0a10',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#7c3aed',
        cyan: '#06b6d4',
        white: '#e2e8f0',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#a78bfa',
        brightCyan: '#22d3ee',
        brightWhite: '#f8fafc',
      },
      allowProposedApi: true,
      convertEol: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    const shell = new KompoShell(term)
    shell.start()

    const resizeObserver = new ResizeObserver(() => fitAddon.fit())
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      term.dispose()
      initializedRef.current = false
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a10',
        padding: '4px',
      }}
    />
  )
}
