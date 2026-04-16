import * as p from '@clack/prompts'
import {
  checkQuota,
  createInitialQuota,
  KOMPO_PROXY_PORT,
  PLANS,
  readLicence,
  readQuota,
  saveQuota,
} from '@kompojs/ai'
import { Command } from 'commander'
import color from 'picocolors'

export function createAiStatusCommand(): Command {
  return new Command('ai:status')
    .description('Show Kompo AI quota and plan status')
    .action(async () => {
      p.intro(color.bgCyan(color.black(' kompo ai:status ')))

      const licence = readLicence()
      if (!licence) {
        p.log.error(`No licence found. Run ${color.cyan('kompo ai:setup')} first.`)
        p.outro('')
        return
      }

      const plan = PLANS[licence.plan]
      let quota = readQuota(licence.licenceKey)

      if (!quota) {
        const initial = createInitialQuota(licence.plan)
        saveQuota(initial, licence.licenceKey)
        quota = { ...initial, hmac: '' }
      }

      const check = checkQuota(quota)

      // Plan info
      p.log.message(color.bold('Plan'))
      p.log.message(`  Name:     ${color.cyan(plan.displayName)}`)
      p.log.message(
        `  Price:    ${plan.priceCents === 0 ? color.green('Free') : `$${(plan.priceCents / 100).toFixed(0)}/mo`}`
      )
      p.log.message('')

      // Monthly quota
      const monthlyBar = progressBar(check.monthlyPercent)
      p.log.message(color.bold('Monthly Tokens'))
      p.log.message(`  ${monthlyBar} ${check.monthlyPercent}%`)
      p.log.message(
        `  ${check.monthlyUsed.toLocaleString()} / ${check.monthlyLimit.toLocaleString()}`
      )
      if (quota.overageBlocksPurchased > 0) {
        p.log.message(`  ${color.dim(`+ ${quota.overageBlocksPurchased} overage block(s)`)}`)
      }
      p.log.message('')

      // Daily quota
      const dailyBar = progressBar(check.dailyPercent)
      p.log.message(color.bold('Daily Tokens'))
      p.log.message(`  ${dailyBar} ${check.dailyPercent}%`)
      p.log.message(`  ${check.dailyUsed.toLocaleString()} / ${check.dailyLimit.toLocaleString()}`)
      p.log.message('')

      // Features
      p.log.message(color.bold('Features'))
      p.log.message(
        `  Skills:              ${plan.maxSkills === 0 ? color.dim('none') : plan.maxSkills === Infinity ? color.green('unlimited') : String(plan.maxSkills)}`
      )
      p.log.message(
        `  Local indexing:      ${plan.localIndexing ? color.green('yes') : color.dim('no')}`
      )
      p.log.message(
        `  Conversation history: ${plan.conversationHistory ? color.green('yes') : color.dim('no')}`
      )
      p.log.message('')

      // Warnings
      if (check.warning) {
        p.log.warn(check.warning)
      }

      if (!check.allowed) {
        if (check.reason === 'daily_limit') {
          p.log.error('Daily token limit reached. Resets at midnight UTC.')
        } else if (check.reason === 'monthly_limit') {
          if (licence.plan === 'starter') {
            p.log.error(`Monthly quota reached. Upgrade → ${color.cyan('kompo workbench')}`)
          } else {
            p.log.error(`Monthly quota reached. Buy overage → ${color.cyan('kompo workbench')}`)
          }
        }
      }

      // Proxy status
      try {
        const res = await fetch(`http://localhost:${KOMPO_PROXY_PORT}/health`)
        if (res.ok) {
          p.log.message(`${color.bold('Proxy')}  ${color.green('running')} on :${KOMPO_PROXY_PORT}`)
        } else {
          p.log.message(`${color.bold('Proxy')}  ${color.dim('not running')}`)
        }
      } catch {
        p.log.message(
          `${color.bold('Proxy')}  ${color.dim('not running')} — start with ${color.cyan('kompo ai:serve')}`
        )
      }

      p.outro('')
    })
}

function progressBar(percent: number, width: number = 20): string {
  const clamped = Math.min(100, Math.max(0, percent))
  const filled = Math.round((clamped / 100) * width)
  const empty = width - filled

  let bar: string
  if (clamped >= 90) {
    bar = color.red('█'.repeat(filled) + '░'.repeat(empty))
  } else if (clamped >= 70) {
    bar = color.yellow('█'.repeat(filled) + '░'.repeat(empty))
  } else {
    bar = color.green('█'.repeat(filled)) + color.dim('░'.repeat(empty))
  }

  return `[${bar}]`
}
