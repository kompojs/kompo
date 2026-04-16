import { readFileSync, writeFileSync } from 'node:fs'
import { getFrameworkFamily } from '@kompojs/config/constants'
import { getKompoCatalogPath, readKompoConfig } from '@kompojs/kit'

export async function regenerateCatalog(rootDir: string, options: { silent?: boolean } = {}) {
  const catalogPath = getKompoCatalogPath(rootDir)

  // 1. Load kompo.config.json
  const config = readKompoConfig(rootDir)

  if (!config) {
    if (!options.silent) console.log('No kompo.config.json found. Generating empty catalog.')
    writeFileSync(catalogPath, JSON.stringify({ version: '1.0.0', packages: {} }, null, 2))
    return
  }

  // 2. Initialize empty workspace versions (no longer read from pnpm-workspace.yaml)
  const workspaceVersions: Record<string, string> = {}

  // 3. Identify Catalogs to Merge
  const { createBlueprintRegistry } = await import('@kompojs/blueprints')
  const catRegistry = createBlueprintRegistry(rootDir)
  const catalogsToMerge: Array<{ name: string; path: string }> = []

  // Process Apps (framework + design system catalogs)
  if (config.apps) {
    for (const [_appName, appConfig] of Object.entries(config.apps)) {
      const fw = appConfig.framework

      // Framework catalog
      const fwPath = catRegistry.getBlueprintCatalogPath(`apps/${fw}/framework`)
      if (fwPath) catalogsToMerge.push({ name: fw, path: fwPath })

      // App-level design system catalog (e.g. apps/nextjs/design-systems/tailwind/catalog.json)
      if (appConfig.designSystem) {
        const dsAppPath = catRegistry.getBlueprintCatalogPath(
          `apps/${fw}/design-systems/${appConfig.designSystem}`
        )
        if (dsAppPath) {
          catalogsToMerge.push({ name: `app-${fw}-${appConfig.designSystem}`, path: dsAppPath })
        }

        // Lib-level design system catalog (e.g. libs/ui/react/tailwind/catalog.json)
        try {
          const family = getFrameworkFamily(fw)
          const dsLibPath = catRegistry.getBlueprintCatalogPath(
            `libs/ui/${family}/${appConfig.designSystem}`
          )
          if (dsLibPath) {
            catalogsToMerge.push({ name: appConfig.designSystem, path: dsLibPath })
          }
        } catch {
          // Ignore if family lookup fails
        }
      }
    }
  }

  // Process Adapters
  if (config.adapters) {
    for (const adapterConfig of Object.values(config.adapters)) {
      const { port, engine } = adapterConfig
      const lookup = `${port}/providers/${engine}`
      const adapterBlueprintPath = `libs/adapters/${lookup}`
      const p = catRegistry.getBlueprintCatalogPath(adapterBlueprintPath)
      if (p) {
        catalogsToMerge.push({ name: `adapter-${port}-${engine}`, path: p })
      }
    }
  }

  // 4. Merge Logic with Preservation
  const newCatalog = { version: '1.0.0', packages: {} as Record<string, any> }

  for (const item of catalogsToMerge) {
    const blueprintCatalog = JSON.parse(readFileSync(item.path, 'utf-8'))
    const preservedCatalog = { ...blueprintCatalog }
    for (const [pkg, _version] of Object.entries(preservedCatalog)) {
      if (workspaceVersions[pkg]) {
        preservedCatalog[pkg] = workspaceVersions[pkg]
      }
    }
    newCatalog.packages[item.name] = {
      description: `Restored from ${item.name}`,
      dependencies: preservedCatalog,
      devDependencies: {},
    }
  }

  writeFileSync(catalogPath, JSON.stringify(newCatalog, null, 2))

  return {
    sourceCount: catalogsToMerge.length,
  }
}
