import nodeFs from 'node:fs'
import path from 'node:path'
import { intro, log, note } from '@clack/prompts'
import { starterManifestSchema as blueprintValidationSchema, type Step } from '@kompo/blueprints'
import type { StarterManifest } from '@kompo/blueprints/types'
import { DESIGN_SYSTEMS, FRAMEWORKS } from '@kompo/config/constants'
import { extractPluginsFromSteps, type ProjectStructure } from '@kompo/kit'
import color from 'picocolors'
import { createFsEngine } from '../engine/fs-engine'

export interface LoadedStarter {
  starter: StarterManifest
  config: ProjectStructure
  steps: Step[]
}

export async function loadStarterFromTemplateArg(
  template: string
): Promise<{ starter: StarterManifest; steps: Step[]; config: ProjectStructure }> {
  const fs = createFsEngine()

  let selectedStarter: StarterManifest | null = null

  let isJsonOpts = false

  // Check if valid file path or assume json
  let manifestPath = template
  if (await fs.fileExists(manifestPath)) {
    isJsonOpts = true
  } else if (await fs.fileExists(`${manifestPath}.json`)) {
    isJsonOpts = true
    manifestPath = `${manifestPath}.json`
  } else if (manifestPath.endsWith('.json')) {
    // Explicit .json extension but file not found -> will error inside isJsonOpts block
    isJsonOpts = true
  }

  if (isJsonOpts) {
    // Load from manifest file
    if (!(await fs.fileExists(manifestPath))) {
      log.error(color.red(`Blueprint manifest not found at ${manifestPath}`))
      process.exit(1)
    }
    intro(`🚀 Creating new Kompo project from manifest: ${manifestPath}`)

    const manifest = await fs.readJson<Record<string, any>>(manifestPath)

    // Treat the local JSON as a starter manifest
    selectedStarter = {
      id: manifest.id || path.basename(manifestPath, '.json'),
      name: manifest.name || path.basename(manifestPath, '.json'),
      description: manifest.description || `Starter from ${manifestPath}`,
      steps: manifest.steps || [],
      ...manifest,
    } as StarterManifest
  } else {
    // Load from registry (Starters)
    const { validateBlueprintName } = await import('../validations/naming.validation')
    const validationError = validateBlueprintName(template)
    if (validationError) {
      log.error(validationError)
      process.exit(1)
    }

    const { getStarter, listStarters } = await import('@kompo/blueprints')
    const starter = getStarter(template)

    if (!starter) {
      log.error(`Starter "${template}" not found.`)

      // Show available starters to help the user
      const starters = listStarters()

      if (starters.length > 0) {
        log.message('')
        log.message('Available starters:')
        for (const s of starters.slice(0, 8)) {
          const desc = s.description ? color.dim(` - ${s.description}`) : ''
          log.message(`  ${color.green(s.id)}${desc}`)
        }
        if (starters.length > 8) {
          log.message(color.dim(`  ... and ${starters.length - 8} more`))
        }
      }

      log.message('')
      log.message(`Run ${color.cyan('kompo list starters')} for the full list`)
      log.message(`Or run ${color.cyan('kompo add app')} for interactive mode`)
      process.exit(1)
    }

    // Security Check (same as interactive)
    if (starter.path) {
      const forbiddenLibsPath = path.join(starter.path, 'files', 'libs')
      if (nodeFs.existsSync(forbiddenLibsPath)) {
        log.error('⛔️  SECURITY VIOLATION: Invalid Starter Structure')
        log.message(
          `The starter "${starter.name}" contains a "files/libs" directory, which is strictly forbidden.`
        )
        process.exit(1)
      }
    }

    selectedStarter = starter

    intro(`🚀 Creating new Kompo project from starter: ${color.blueBright(starter.name)}`)
    if (starter.description) {
      note(starter.description)
    }
  }

  const { config, steps } = summarizeStarter(selectedStarter || ({} as StarterManifest))

  return { starter: selectedStarter || ({} as StarterManifest), config, steps }
}

/**
 * Summarize a starter into a project structure
 */
export function summarizeStarter(starter: StarterManifest): {
  config: ProjectStructure
  steps: Step[]
} {
  // Validate steps if present
  const parseResult = blueprintValidationSchema.safeParse(starter)
  const validBlueprint = parseResult.success ? parseResult.data : starter
  const steps = (validBlueprint.steps || []) as Step[]

  // Extract from steps
  const extracted = extractPluginsFromSteps(steps)

  // Fallback for fields that might be at the root for flat starters
  const flat = starter as Record<string, any>
  const config: ProjectStructure = {
    framework: extracted.framework || flat.framework || FRAMEWORKS.NEXTJS,
    designSystem: extracted.designSystem || flat.designSystem || DESIGN_SYSTEMS.TAILWIND,
    ports: extracted.ports?.length ? extracted.ports : flat.ports || [],
    adapters: { ...(flat.adapters || {}), ...(extracted.adapters || {}) },
    drivers: { ...(flat.drivers || {}), ...(extracted.drivers || {}) },
    chains: Array.from(new Set([...(flat.chains || []), ...(extracted.chains || [])])),
    domains: Array.from(new Set([...(flat.domains || []), ...(extracted.domains || [])])),
    features: Array.from(
      new Set([
        ...(flat.features || []).map((f: string | { name: string }) =>
          typeof f === 'string' ? f : f.name
        ),
        ...(extracted.features || []),
      ])
    ),
    wirings: [...(flat.wirings || []), ...(extracted.wirings || [])],
    domainPorts: { ...(flat.domainPorts || {}), ...extracted.domainPorts },
  }

  return { config, steps }
}
