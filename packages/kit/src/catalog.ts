/**
 * Catalog utilities for managing Kompo dependency versions.
 * Uses kompo.catalog.json as the sole source of truth for ALL package managers.
 *
 * Package manager agnostic: Never touches workspace files (pnpm-workspace.yaml).
 * Kompo manages its own catalog independently of the package manager.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gt, clean as semverClean } from 'semver'
import { parse } from 'yaml'

export interface CatalogEntry {
  [key: string]: string
}

export interface WorkspaceConfig {
  packages: string[]
  catalog?: CatalogEntry
  onlyBuiltDependencies?: string[]
}

export interface PackageGroup {
  description?: string
  extends?: string[]
  dependencies: CatalogEntry
  devDependencies: CatalogEntry
}

export interface KompoCatalog {
  version: string
  description?: string
  lastUpdated?: string
  packages: Record<string, PackageGroup>
}

/**
 * Read catalog.yaml from a plugin directory
 */
export function readPluginCatalog(pluginDir: string): CatalogEntry {
  const catalogPath = join(pluginDir, 'catalog.yaml')
  if (!existsSync(catalogPath)) {
    return {}
  }

  const content = readFileSync(catalogPath, 'utf-8')
  const parsed = parse(content) as CatalogEntry | null
  return parsed || {}
}

/**
 * Resolve version conflicts between two versions using semver comparison
 * Returns the winning version and tracks conflicts if newer version wins
 */
function resolveVersionConflict(
  pkg: string,
  oldVersion: string,
  newVersion: string,
  conflicts: Array<{ pkg: string; oldVersion: string; newVersion: string }>
): string {
  const oldClean = semverClean(oldVersion.replace(/^[\^~]/, ''))
  const newClean = semverClean(newVersion.replace(/^[\^~]/, ''))

  if (oldClean && newClean) {
    if (gt(newClean, oldClean)) {
      conflicts.push({ pkg, oldVersion, newVersion })
      return newVersion
    }
    // If old version is newer, keep it (no warning needed)
    return oldVersion
  } else {
    // Fallback to simple override if semver parsing fails
    return newVersion
  }
}

/**
 * Merge multiple catalogs into one with semver-aware conflict resolution
 * Always picks the latest semver version for conflicts
 */
export function mergeCatalogs(...catalogs: CatalogEntry[]): CatalogEntry {
  const merged: CatalogEntry = {}
  const conflicts: Array<{ pkg: string; oldVersion: string; newVersion: string }> = []

  for (const catalog of catalogs) {
    for (const [pkg, version] of Object.entries(catalog)) {
      if (merged[pkg]) {
        merged[pkg] = resolveVersionConflict(pkg, merged[pkg], version, conflicts)
      } else {
        merged[pkg] = version
      }
    }
  }

  // Log conflicts if any
  if (conflicts.length > 0) {
    console.warn('\n⚠️  Version conflicts resolved:')
    for (const { pkg, oldVersion, newVersion } of conflicts) {
      console.warn(`   ${pkg}: ${oldVersion} → ${newVersion} (latest semver)`)
    }
    console.warn('')
  }

  return merged
}

/**
 * Get plugin directory path from plugin name
 */
export function getPluginDir(rootDir: string, pluginName: string): string {
  // Convert plugin name to directory name
  // e.g., 'framework-nextjs' -> 'cli-framework-nextjs'
  if (pluginName.startsWith('framework-')) {
    return join(rootDir, 'packages', `cli-${pluginName}`)
  }
  if (pluginName.startsWith('backend-')) {
    return join(rootDir, 'packages', `cli-${pluginName}`)
  }
  if (pluginName.startsWith('port-')) {
    return join(rootDir, 'packages', `cli-${pluginName}`)
  }
  if (pluginName.startsWith('design-')) {
    return join(rootDir, 'packages', `cli-${pluginName}`)
  }
  return join(rootDir, 'packages', `cli-${pluginName}`)
}

/**
 * Merge a blueprint's catalog.json into kompo.catalog.json
 */
/**
 * Resolve the path to kompo.catalog.json
 * Priority: libs/config/kompo.catalog.json > kompo.catalog.json
 */
export function getKompoCatalogPath(rootDir: string): string {
  const configPath = join(rootDir, 'libs', 'config', 'kompo.catalog.json')
  if (existsSync(configPath)) return configPath
  return join(rootDir, 'kompo.catalog.json')
}

/**
 * Merge a blueprint's catalog.json into kompo.catalog.json
 */
export function mergeBlueprintCatalog(
  rootDir: string,
  blueprintName: string,
  catalogPath: string
): void {
  if (!existsSync(catalogPath)) return

  const blueprintCatalog = JSON.parse(readFileSync(catalogPath, 'utf-8')) as CatalogEntry
  let kompoCatalog: KompoCatalog
  const kompoCatalogPath = getKompoCatalogPath(rootDir)

  if (existsSync(kompoCatalogPath)) {
    kompoCatalog = readKompoCatalog(rootDir)
  } else {
    kompoCatalog = { version: '1.0.0', packages: {} }
  }

  if (!kompoCatalog.packages) {
    kompoCatalog.packages = {}
  }

  kompoCatalog.packages[blueprintName] = {
    description: `Imported from ${blueprintName}`,
    dependencies: blueprintCatalog,
    devDependencies: {},
  }
  writeFileSync(kompoCatalogPath, JSON.stringify(kompoCatalog, null, 2))
}

/**
 * Read kompo.catalog.json from the root directory or libs/config
 */
export function readKompoCatalog(rootDir: string): KompoCatalog {
  const catalogPath = getKompoCatalogPath(rootDir)
  if (!existsSync(catalogPath)) {
    throw new Error(`kompo.catalog.json not found at ${catalogPath}`)
  }
  const content = readFileSync(catalogPath, 'utf-8')
  return JSON.parse(content) as KompoCatalog
}

/**
 * Ensure kompo.catalog.json exists, creating it if necessary
 * Prefer creating in libs/config if the directory exists
 */
export function ensureKompoCatalog(rootDir: string): void {
  let catalogPath = getKompoCatalogPath(rootDir)

  // If it doesn't exist anywhere, decide where to create it
  if (!existsSync(catalogPath)) {
    const libsConfigDir = join(rootDir, 'libs', 'config')
    if (existsSync(libsConfigDir)) {
      catalogPath = join(libsConfigDir, 'kompo.catalog.json')
    }
  }

  if (!existsSync(catalogPath)) {
    const initialCatalog: KompoCatalog = { version: '1.0.0', packages: {} }
    writeFileSync(catalogPath, JSON.stringify(initialCatalog, null, 2))
  }
}

/**
 * Resolve a package group including its extensions (inheritance)
 */
function resolvePackageGroup(
  catalog: KompoCatalog,
  groupName: string,
  resolved = new Set<string>()
): { dependencies: CatalogEntry; devDependencies: CatalogEntry } {
  if (resolved.has(groupName)) {
    return { dependencies: {}, devDependencies: {} }
  }
  resolved.add(groupName)

  const group = catalog.packages[groupName]
  if (!group) {
    return { dependencies: {}, devDependencies: {} }
  }

  // Start with extended groups
  let dependencies: CatalogEntry = {}
  let devDependencies: CatalogEntry = {}

  if (group.extends) {
    for (const extendName of group.extends) {
      const extended = resolvePackageGroup(catalog, extendName, resolved)
      dependencies = { ...dependencies, ...extended.dependencies }
      devDependencies = { ...devDependencies, ...extended.devDependencies }
    }
  }

  // Add this group's dependencies (override extended)
  dependencies = { ...dependencies, ...group.dependencies }
  devDependencies = { ...devDependencies, ...group.devDependencies }

  return { dependencies, devDependencies }
}

/**
 * Get all catalog entries for a set of features with semver-aware conflict resolution
 */
export function getCatalogEntriesForFeatures(rootDir: string, features: string[]): CatalogEntry {
  const catalog = readKompoCatalog(rootDir)
  const allDeps: CatalogEntry = {}
  const conflicts: Array<{ pkg: string; oldVersion: string; newVersion: string }> = []

  for (const feature of features) {
    const resolved = resolvePackageGroup(catalog, feature)
    const combined = { ...resolved.dependencies, ...resolved.devDependencies }

    // Merge with semver-aware conflict resolution
    for (const [pkg, version] of Object.entries(combined)) {
      if (allDeps[pkg]) {
        // Version conflict detected
        const oldClean = semverClean(allDeps[pkg].replace(/^[\^~]/, ''))
        const newClean = semverClean(version.replace(/^[\^~]/, ''))

        if (oldClean && newClean) {
          if (gt(newClean, oldClean)) {
            conflicts.push({ pkg, oldVersion: allDeps[pkg], newVersion: version })
            allDeps[pkg] = version
          }
          // If old version is newer, keep it (no warning needed)
        } else {
          // Fallback to simple override if semver parsing fails
          allDeps[pkg] = version
        }
      } else {
        allDeps[pkg] = version
      }
    }
  }

  // Log conflicts if any
  if (conflicts.length > 0) {
    console.warn('\n⚠️  Version conflicts resolved:')
    for (const { pkg, oldVersion, newVersion } of conflicts) {
      console.warn(`   ${pkg}: ${oldVersion} → ${newVersion} (latest semver)`)
    }
    console.warn('')
  }

  return allDeps
}

/**
 * Update kompo.catalog.json with dependencies for selected features.
 * This is the sole source of truth for ALL package managers.
 */
export function updateCatalogFromFeatures(rootDir: string, features: string[]): void {
  const _newEntries = getCatalogEntriesForFeatures(rootDir, features)

  // Read existing kompo catalog
  const catalogPath = getKompoCatalogPath(rootDir)
  let catalog: KompoCatalog

  try {
    catalog = readKompoCatalog(rootDir)
  } catch {
    // Create if doesn't exist
    catalog = { version: '1.0.0', packages: {} }
  }

  // Update the catalog with new entries
  // Note: We don't update individual packages here, just ensure dependencies are available
  // The actual package versions are managed by the package manager during install

  // For now, this function mainly ensures the catalog exists and is valid
  // The dependency resolution happens at install time via the package manager

  // Write back the catalog
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2))
}

/**
 * Get the list of features needed for a frontend + design system combination
 */
export function getRequiredFeatures(framework: string, designSystem?: string): string[] {
  const features: string[] = ['core', framework]

  // Design system
  if (designSystem) {
    features.push(designSystem)
  }

  return features
}

/**
 * Get a flat map of all package versions from kompo.catalog.json.
 * Merges all package groups into a single { packageName: version } map.
 * Later groups override earlier ones (last-write-wins with semver awareness).
 */
export function getAllCatalogVersions(rootDir: string): CatalogEntry {
  const catalogPath = getKompoCatalogPath(rootDir)
  if (!existsSync(catalogPath)) return {}

  const catalog = readKompoCatalog(rootDir)
  if (!catalog.packages) return {}

  const allVersions: CatalogEntry = {}
  const conflicts: Array<{ pkg: string; oldVersion: string; newVersion: string }> = []

  for (const groupName of Object.keys(catalog.packages)) {
    const resolved = resolvePackageGroup(catalog, groupName)
    const combined = { ...resolved.dependencies, ...resolved.devDependencies }

    for (const [pkg, version] of Object.entries(combined)) {
      if (allVersions[pkg]) {
        allVersions[pkg] = resolveVersionConflict(pkg, allVersions[pkg], version, conflicts)
      } else {
        allVersions[pkg] = version
      }
    }
  }

  return allVersions
}

/**
 * Resolve all "workspace:*" references in package.json files.
 * For npm, converts to "*" since npm doesn't support workspace protocol.
 * For other PMs, keeps "workspace:*" as is.
 */
export async function resolveWorkspaceReferences(
  rootDir: string,
  packageJsonPath: string
): Promise<void> {
  if (!existsSync(packageJsonPath)) return

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const { detectPackageManager } = await import('./package-manager')
  const pm = detectPackageManager(rootDir)
  let changed = false

  // Only convert for npm
  if (pm.name === 'npm') {
    for (const key of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ]) {
      const deps = pkg[key]
      if (!deps) continue

      for (const [name, version] of Object.entries(deps)) {
        if (version === 'workspace:*') {
          deps[name] = '*'
          changed = true
        }
      }
    }
  }

  if (changed) {
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, '\t'))
  }
}

/**
 * Resolve all "catalog:" references in a package.json file with actual versions
 * from kompo.catalog.json. This makes the output PM-agnostic.
 */
export function resolveCatalogReferences(rootDir: string, packageJsonPath: string): void {
  if (!existsSync(packageJsonPath)) return

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const versions = getAllCatalogVersions(rootDir)
  let changed = false

  for (const key of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    const deps = pkg[key]
    if (!deps) continue

    for (const [name, version] of Object.entries(deps)) {
      if (version === 'catalog:' || version === 'catalog:default') {
        if (versions[name]) {
          deps[name] = versions[name]
          changed = true
        }
      }
    }
  }

  if (changed) {
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, '\t'))
  }
}
