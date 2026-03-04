/**
 * Unified Blueprint Loader for Kompo CLI
 */

import { type Dirent, existsSync, readdirSync, readFileSync } from 'node:fs'

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Blueprint, FeatureManifest, StarterManifest } from './types'

export * from './schemas/blueprint.schema'
export * from './schemas/feature.schema'
export * from './schemas/starter.schema'
export * from './schemas/step.schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function getTemplatesDir(): string {
  // src/index.ts is 1 level deep from root
  return resolve(__dirname, '../elements')
}

// Blueprint directories
const BLUEPRINTS_ROOT = join(__dirname, '..')
const STARTERS_ROOT = join(BLUEPRINTS_ROOT, 'starters')
const FEATURES_ROOT = join(BLUEPRINTS_ROOT, 'features')

function loadStartersFrom(dir: string, maxDepth = 1): StarterManifest[] {
  if (!existsSync(dir)) return []
  const starters: StarterManifest[] = []

  function scan(currentDir: string, currentDepth: number) {
    if (currentDepth > maxDepth) return
    const entries = readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = join(currentDir, entry.name)
        const textPath = join(fullPath, 'starter.json')
        if (existsSync(textPath)) {
          try {
            const content = readFileSync(textPath, 'utf-8')
            const manifest = JSON.parse(content) as StarterManifest
            manifest.path = fullPath
            starters.push(manifest)
          } catch {}
        }
        scan(fullPath, currentDepth + 1)
      }
    }
  }
  scan(dir, 1)
  return starters
}

function loadFeaturesFrom(dir: string, maxDepth = 1): FeatureManifest[] {
  if (!existsSync(dir)) return []
  const features: FeatureManifest[] = []

  function scan(currentDir: string, currentDepth: number) {
    if (currentDepth > maxDepth) return
    const entries = readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = join(currentDir, entry.name)
        const textPath = join(fullPath, 'features.json')
        if (existsSync(textPath)) {
          try {
            const content = readFileSync(textPath, 'utf-8')
            const manifest = JSON.parse(content) as FeatureManifest
            manifest.path = fullPath
            if (manifest.type !== 'feature') manifest.type = 'feature'
            features.push(manifest)
          } catch {}
        }
        scan(fullPath, currentDepth + 1)
      }
    }
  }
  scan(dir, 1)
  return features
}

function loadBlueprintsFrom(dir: string, maxDepth = 1): Blueprint[] {
  if (!existsSync(dir)) return []
  const blueprints: Blueprint[] = []

  function scan(currentDir: string, currentDepth: number) {
    if (currentDepth > maxDepth) return
    const entries = readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = join(currentDir, entry.name)
        const textPath = join(fullPath, 'blueprint.json')
        if (existsSync(textPath)) {
          try {
            const content = readFileSync(textPath, 'utf-8')
            const manifest = JSON.parse(content) as Blueprint
            manifest.path = fullPath
            blueprints.push(manifest)
          } catch {}
        }
        scan(fullPath, currentDepth + 1)
      }
    }
  }
  scan(dir, 1)
  return blueprints
}

export function listBlueprints(): Blueprint[] {
  const blueprints: Blueprint[] = []
  const elementsDir = getTemplatesDir()
  const libsDir = join(elementsDir, 'libs')

  if (existsSync(libsDir)) {
    blueprints.push(...loadBlueprintsFrom(libsDir, 4))
  }

  return blueprints
}

export function listFeatures(): FeatureManifest[] {
  const features: FeatureManifest[] = []
  features.push(...loadFeaturesFrom(FEATURES_ROOT))
  return features
}

export function listStarters(): StarterManifest[] {
  const starters: StarterManifest[] = []

  starters.push(...loadStartersFrom(STARTERS_ROOT, 4))

  // Filter to only return real starters (those with steps), not intermediate metadata
  return starters.filter((s) => s.steps && s.steps.length > 0)
}

export function getFeature(name: string): FeatureManifest | null {
  const p = join(FEATURES_ROOT, name, 'features.json')
  if (existsSync(p)) {
    try {
      const content = readFileSync(p, 'utf-8')
      const manifest = JSON.parse(content) as FeatureManifest
      manifest.path = dirname(p)
      manifest.type = 'feature'
      return manifest
    } catch {}
  }

  return null
}

export function loadStarterFromPath(fullDir: string): StarterManifest | null {
  const p = join(fullDir, 'starter.json')
  if (existsSync(p)) {
    try {
      const content = readFileSync(p, 'utf-8')
      const manifest = JSON.parse(content) as StarterManifest
      manifest.path = dirname(p)
      return manifest
    } catch {
      return null
    }
  }
  return null
}

export function getStarter(name: string): StarterManifest | null {
  const relativePath = name.split('.').join('/')

  const starter = loadStarterFromPath(join(STARTERS_ROOT, relativePath))
  if (starter) return starter

  if (existsSync(join(name, 'starter.json'))) {
    return loadStarterFromPath(name)
  }

  return null
}

export function getBlueprint(name: string): Blueprint | null {
  const elementsDir = getTemplatesDir()
  const candidates = [
    join(elementsDir, 'libs', 'adapters', name),
    join(elementsDir, 'libs', 'drivers', name),
    join(elementsDir, 'libs', name),
  ]

  for (const dir of candidates) {
    const p = join(dir, 'blueprint.json')
    if (existsSync(p)) {
      try {
        const content = readFileSync(p, 'utf-8')
        const bp = JSON.parse(content) as Blueprint
        bp.path = dir
        return bp
      } catch {}
    }
  }

  return null
}

export function getBlueprintsByCategory(category: string): Blueprint[] {
  return listBlueprints().filter((b) => 'category' in b && b.category === category)
}

export function searchBlueprints(query: string): Blueprint[] {
  const lowerQuery = query.toLowerCase()
  return listBlueprints().filter(
    (b) =>
      b.name.toLowerCase().includes(lowerQuery) ||
      b.description?.toLowerCase().includes(lowerQuery) ||
      b.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

export function getBlueprintsByType(type: 'feature' | 'adapter' | 'app' | 'driver'): Blueprint[] {
  return listBlueprints().filter((b) => b.type === type)
}

export function getBlueprintDependencies(templatePath: string): string[] {
  const fullPath = join(getTemplatesDir(), templatePath, 'catalog.json')
  if (existsSync(fullPath)) {
    try {
      const content = readFileSync(fullPath, 'utf-8')
      const catalog = JSON.parse(content)
      return Object.keys(catalog)
    } catch {
      return []
    }
  }
  return []
}

export function hasBlueprintSnippet(templatePath: string, snippetName: string): boolean {
  const fullPath = join(getTemplatesDir(), templatePath, 'snippets', `${snippetName}.eta`)
  return existsSync(fullPath)
}

export function getFrameworkCompositionTemplates(framework: string): string[] {
  const frameworkMap: Record<string, string> = {
    nextjs: 'apps/nextjs/framework',
    react: 'apps/react/framework',
    vue: 'apps/vue/framework',
    nuxt: 'apps/nuxt/framework',
    express: 'apps/express/framework',
  }

  const base = frameworkMap[framework.toLowerCase()]
  if (!base) return []

  // Vue/Nuxt use .vue.eta extensions for SFC composition templates
  if (framework === 'vue' || framework === 'nuxt') {
    return [
      `${base}/src/composition/ClientComposition.vue.eta`,
      `${base}/src/composition/ServerComposition.ts.eta`,
    ]
  }

  return [
    `${base}/src/composition/ClientComposition.tsx.eta`,
    `${base}/src/composition/ServerComposition.tsx.eta`,
  ]
}

export function listDesignSystems(family?: string): string[] {
  const baseUiDir = join(getTemplatesDir(), 'libs', 'ui')
  const uiDir = family ? join(baseUiDir, family) : baseUiDir
  if (!existsSync(uiDir)) return []

  return readdirSync(uiDir, { withFileTypes: true })
    .filter((dirent: Dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map((dirent: Dirent) => dirent.name)
}

export function getBlueprintCatalogPath(blueprintPath: string): string | null {
  const templatesDir = getTemplatesDir()
  const candidatePath = join(templatesDir, blueprintPath, 'catalog.json')
  return existsSync(candidatePath) ? candidatePath : null
}
