/**
 * Kompo CLI Kit - Shared interfaces and utilities
 */

// Semver utilities for version comparison
export { clean, gt } from 'semver'
export type { MockFsEngine, MockTemplateEngine } from './__tests__/test-utils'
// Test utilities (for plugin testing)
export {
  createMockContext,
  createMockFs,
  createMockTemplates,
  dockerComposeHasService,
  parseEnvFile,
  setupTestFixtures,
} from './__tests__/test-utils'
export {
  type ApplyConfig,
  extractPluginsFromSteps,
  getPluginsToMerge,
  type ProjectStructure,
} from './apply-config'
export type { CatalogEntry, KompoCatalog, PackageGroup, WorkspaceConfig } from './catalog'
// Catalog utilities
export {
  ensureKompoCatalog,
  getAllCatalogVersions,
  getCatalogEntriesForFeatures,
  getKompoCatalogPath,
  getRequiredFeatures,
  mergeBlueprintCatalog,
  mergeCatalogs,
  readKompoCatalog,
  readPluginCatalog,
  resolveCatalogReferences,
  resolveWorkspaceReferences,
  updateCatalogFromFeatures,
} from './catalog'
export type { FsEngine, KompoContext, TemplateEngine } from './context'
// Helper functions
export { defineKompoPlugin } from './define-plugin'

// Port Definitions
export {
  KOMPO_RECOMMENDED_SUFFIXES,
  PORT_DEFINITIONS,
  type PortTypeDefinition,
} from './definitions/port.definitions'
export type { DemoMeta, ProviderMeta } from './demos'
// Demo and Provider utilities
export {
  detectFramework,
  getFrameworkPaths,
  regenerateAllIndexes,
  regenerateDemosIndex,
  regenerateProvidersIndex,
  registerDemo,
  registerProvider,
} from './demos'
export type { AppConfig, KompoConfig, StepEntry } from './kompo-config'
// Kompo Config utilities
export {
  addStep,
  ensureConfigDir,
  generateProfileId,
  getConfigPath,
  getStepsForReplay,
  initKompoConfig,
  LIBS_DIR,
  readKompoConfig,
  updateCatalogSources,
  upsertApp,
  writeKompoConfig,
} from './kompo-config'
// Package manager detection
export type { PackageManager, PackageManagerName } from './package-manager'
export { detectPackageManager } from './package-manager'
export type { Pipeline, PipelineBuilder } from './pipeline'
// Core interfaces
export type { KompoPlugin, PluginRegistry } from './plugin'
export type { PortDependency, ProviderDescriptor } from './port-dependencies'
// Port dependencies utilities
export {
  getInstalledPorts,
  getMissingDependencies,
  getOptionalDependencies,
  getRequiredDependencies,
  isPortInstalled,
  providerSatisfiesPort,
} from './port-dependencies'
export type { Question, Step, TemplateDefinition } from './step'

// Workspace detection
export type { WorkspaceInfo, WorkspaceType } from './workspace'
export { findWorkspaceRoot } from './workspace'
