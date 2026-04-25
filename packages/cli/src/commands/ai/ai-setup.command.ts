import * as p from '@clack/prompts'
import type { LicenceData, ModelTier } from '@kompojs/ai'
import {
  checkModel,
  checkRunning,
  createModel,
  ensureKompoDir,
  getModelfile,
  KOMPO_DIR,
  KOMPO_MODEL,
  MODEL_TIERS,
  pullModel,
  saveLicence,
  validateWithBackend,
} from '@kompojs/ai'
import { Command } from 'commander'
import color from 'picocolors'

export function createAiSetupCommand(): Command {
  return new Command('ai:setup')
    .description('Setup Kompo AI — install model, configure licence')
    .action(async () => {
      p.intro(color.bgCyan(color.black(' kompo ai:setup ')))

      // Step 1: Check Ollama
      const s = p.spinner()
      s.start('Checking Ollama...')
      const running = await checkRunning()
      if (!running) {
        s.stop(color.red('Ollama is not running'))
        p.log.error('Ollama must be running. Install it from https://ollama.ai then start it.')
        p.log.message(`  ${color.cyan('ollama serve')}`)
        p.outro('Setup aborted.')
        return
      }
      s.stop(color.green('Ollama is running'))

      // Step 2: Select model tier
      const tier = await p.select({
        message: 'Select your model tier (based on available VRAM):',
        options: [
          {
            value: 'light' as ModelTier,
            label: `Light — ${MODEL_TIERS.light.base}`,
            hint: `${MODEL_TIERS.light.vram} — ${MODEL_TIERS.light.description}`,
          },
          {
            value: 'default' as ModelTier,
            label: `Default — ${MODEL_TIERS.default.base}`,
            hint: `${MODEL_TIERS.default.vram} — ${MODEL_TIERS.default.description}`,
          },
          {
            value: 'heavy' as ModelTier,
            label: `Heavy — ${MODEL_TIERS.heavy.base}`,
            hint: `${MODEL_TIERS.heavy.vram} — ${MODEL_TIERS.heavy.description}`,
          },
        ],
      })

      if (p.isCancel(tier)) {
        p.outro('Setup cancelled.')
        return
      }

      const selectedTier = tier as ModelTier
      const tierInfo = MODEL_TIERS[selectedTier]

      // VRAM warning for heavy tier
      if (selectedTier === 'heavy') {
        p.log.warn(
          `${color.yellow('⚠ Warning:')} The heavy tier (${tierInfo.base}) requires ${color.bold('~20 GB VRAM')}.\n` +
            `  If your machine has less than 24 GB RAM, this model may run very slowly or fail to load.\n` +
            `  Consider using the "default" tier for a better quality/performance balance.`
        )
        const confirm = await p.confirm({ message: 'Continue with heavy tier?' })
        if (p.isCancel(confirm) || !confirm) {
          p.outro('Setup cancelled.')
          return
        }
      }

      // Step 3: Check if model already exists
      const modelExists = await checkModel(KOMPO_MODEL)
      if (modelExists) {
        const overwrite = await p.confirm({
          message: `Model "${KOMPO_MODEL}" already exists. Recreate it with ${tierInfo.base}?`,
        })
        if (p.isCancel(overwrite) || !overwrite) {
          p.log.info('Keeping existing model.')
        } else {
          await installModel(selectedTier)
        }
      } else {
        await installModel(selectedTier)
      }

      // Step 4: Licence setup
      const hasLicence = await p.confirm({
        message: 'Do you have a Kompo AI licence key?',
        initialValue: false,
      })

      if (p.isCancel(hasLicence)) {
        p.outro('Setup cancelled.')
        return
      }

      if (hasLicence) {
        const email = await p.text({
          message: 'Your email:',
          validate: (v) => {
            if (!v?.includes('@')) return 'Please enter a valid email'
          },
        })
        if (p.isCancel(email)) {
          p.outro('Setup cancelled.')
          return
        }

        const licenceKey = await p.text({
          message: 'Your licence key:',
          validate: (v) => {
            if (!v || v.length < 10) return 'Invalid licence key'
          },
        })
        if (p.isCancel(licenceKey)) {
          p.outro('Setup cancelled.')
          return
        }

        const vs = p.spinner()
        vs.start('Validating licence...')
        const validation = await validateWithBackend(licenceKey as string)
        if (validation.valid) {
          vs.stop(color.green(`Licence valid — ${validation.plan} plan`))
          const licence: LicenceData = {
            licenceKey: licenceKey as string,
            email: email as string,
            plan: validation.plan,
            createdAt: new Date().toISOString(),
            expiresAt: validation.expiresAt,
            signature: '',
          }
          saveLicence(licence)
        } else {
          vs.stop(color.red('Licence validation failed'))
          p.log.error(validation.error ?? 'Could not validate your licence. Using Starter plan.')
          saveStarterLicence()
        }
      } else {
        p.log.info('No licence key. Using the free Starter plan (100K tokens/month).')
        p.log.message(
          `  Upgrade anytime → ${color.cyan('kompo ai:status')} or ${color.cyan('kompo workbench')}`
        )
        saveStarterLicence()
      }

      // Summary
      p.note(
        `Model:   ${KOMPO_MODEL} (${tierInfo.base})\n` +
          `Config:  ${KOMPO_DIR}\n` +
          `Proxy:   kompo ai:serve → http://localhost:11435\n` +
          `REPL:    kompo ai`,
        'Setup complete'
      )

      p.outro(color.green('Kompo AI is ready!'))
    })
}

async function installModel(tier: ModelTier): Promise<void> {
  const tierInfo = MODEL_TIERS[tier]

  // Pull base model
  const s = p.spinner()
  s.start(`Pulling ${tierInfo.base}...`)
  try {
    await pullModel(
      tierInfo.base,
      (progress: { status?: string; total?: number; completed?: number }) => {
        if (progress.total && progress.completed) {
          const pct = Math.round((progress.completed / progress.total) * 100)
          s.message(`Pulling ${tierInfo.base}... ${pct}%`)
        } else if (progress.status) {
          s.message(`${progress.status}`)
        }
      }
    )
    s.stop(color.green(`${tierInfo.base} pulled`))
  } catch (err) {
    s.stop(color.red('Failed to pull model'))
    throw err
  }

  // Create custom model
  const cs = p.spinner()
  cs.start(`Creating ${KOMPO_MODEL} from ${tierInfo.base}...`)
  const modelfile = getModelfile(tier)
  await createModel(KOMPO_MODEL, modelfile)
  cs.stop(color.green(`${KOMPO_MODEL} created`))
}

function saveStarterLicence(): void {
  ensureKompoDir()
  const licence: LicenceData = {
    licenceKey: `starter-${Date.now().toString(36)}`,
    email: '',
    plan: 'starter',
    createdAt: new Date().toISOString(),
    expiresAt: '',
    signature: '',
  }
  saveLicence(licence)
}
