#!/usr/bin/env node

/**
 * Kompo Development Setup Script
 * 
 * This script switches between development and production modes:
 * - Development mode: Uses local file references for blueprint packages
 * - Production mode: Uses published versions for blueprint packages
 * 
 * Usage:
 *   node scripts/dev-setup.js dev    # Switch to development mode
 *   node scripts/dev-setup.js prod   # Switch to production mode
 *   node scripts/dev-setup.js status # Show current mode
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')

// Blueprint packages that need switching
const BLUEPRINT_PACKAGES = [
  '@kompojs/blueprints',
  '@kompojs/blueprints-nextjs',
  '@kompojs/blueprints-react',
  '@kompojs/blueprints-nuxt',
  '@kompojs/blueprints-vue',
  '@kompojs/blueprints-express'
]

const AI_PACKAGE = '@kompojs/ai'
const AI_PROD_VERSION = '0.0.1-beta.1'

const CORE_PACKAGE_JSON = join(repoRoot, 'packages/core/package.json')
const CLI_PACKAGE_JSON = join(repoRoot, 'packages/cli/package.json')

// Development mode file references
const DEV_REFERENCES = {
  '@kompojs/blueprints': 'file:../../../blueprints/packages/blueprints',
  '@kompojs/blueprints-nextjs': 'file:../../../blueprints/packages/blueprints-nextjs',
  '@kompojs/blueprints-react': 'file:../../../blueprints/packages/blueprints-react',
  '@kompojs/blueprints-nuxt': 'file:../../../blueprints/packages/blueprints-nuxt',
  '@kompojs/blueprints-vue': 'file:../../../blueprints/packages/blueprints-vue',
  '@kompojs/blueprints-express': 'file:../../../blueprints/packages/blueprints-express'
}

const AI_DEV_REFERENCE = 'file:../../../agents/packages/ai'

// Get production versions by reading from blueprint package.json files
function getProdReferences() {
  const blueprintsRoot = join(repoRoot, '..', 'blueprints', 'packages')
  const references = {}
  
  for (const packageName of BLUEPRINT_PACKAGES) {
    const packageDir = packageName.replace('@kompojs/', '')
    const packageJsonPath = join(blueprintsRoot, packageDir, 'package.json')
    
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        references[packageName] = pkg.version
      } catch (error) {
        console.error(`❌ Failed to read version from ${packageJsonPath}:`, error.message)
        process.exit(1)
      }
    } else {
      console.error(`❌ Blueprint package not found: ${packageJsonPath}`)
      process.exit(1)
    }
  }
  
  return references
}

function getCurrentMode() {
  const coreExists = existsSync(CORE_PACKAGE_JSON)
  const cliExists = existsSync(CLI_PACKAGE_JSON)
  
  if (!coreExists) {
    console.error('❌ packages/core/package.json not found')
    process.exit(1)
  }
  
  if (!cliExists) {
    console.error('❌ packages/cli/package.json not found')
    process.exit(1)
  }

  const corePkg = JSON.parse(readFileSync(CORE_PACKAGE_JSON, 'utf-8'))
  const cliPkg = JSON.parse(readFileSync(CLI_PACKAGE_JSON, 'utf-8'))
  const coreDeps = corePkg.dependencies || {}
  const cliDeps = cliPkg.dependencies || {}
  
  // Check if any blueprint package uses file: reference in either package
  const coreHasFileRef = BLUEPRINT_PACKAGES.some(pkg => 
    coreDeps[pkg]?.startsWith('file:')
  )
  const cliHasFileRef = cliDeps['@kompojs/blueprints']?.startsWith('file:')
  
  return (coreHasFileRef || cliHasFileRef) ? 'development' : 'production'
}

function switchToMode(mode) {
  console.log(`🔄 Switching to ${mode} mode...`)
  
  const coreExists = existsSync(CORE_PACKAGE_JSON)
  const cliExists = existsSync(CLI_PACKAGE_JSON)
  
  if (!coreExists) {
    console.error('❌ packages/core/package.json not found')
    process.exit(1)
  }
  
  if (!cliExists) {
    console.error('❌ packages/cli/package.json not found')
    process.exit(1)
  }

  const references = mode === 'development' ? DEV_REFERENCES : getProdReferences()
  
  // Update core package.json
  const corePkg = JSON.parse(readFileSync(CORE_PACKAGE_JSON, 'utf-8'))
  const coreDeps = corePkg.dependencies || {}
  
  for (const [packageName, version] of Object.entries(references)) {
    if (coreDeps[packageName]) {
      coreDeps[packageName] = version
    }
  }
  
  writeFileSync(CORE_PACKAGE_JSON, JSON.stringify(corePkg, null, '\t') + '\n')
  
  // Update cli package.json (only @kompojs/blueprints)
  const cliPkg = JSON.parse(readFileSync(CLI_PACKAGE_JSON, 'utf-8'))
  const cliDeps = cliPkg.dependencies || {}
  
  if (cliDeps['@kompojs/blueprints']) {
    cliDeps['@kompojs/blueprints'] = references['@kompojs/blueprints']
  }

  // Handle @kompojs/ai (separate repo, not part of BLUEPRINT_PACKAGES)
  if (cliDeps[AI_PACKAGE]) {
    cliDeps[AI_PACKAGE] = mode === 'development' ? AI_DEV_REFERENCE : AI_PROD_VERSION
  }

  writeFileSync(CLI_PACKAGE_JSON, JSON.stringify(cliPkg, null, '\t') + '\n')
  
  console.log(`✅ Switched to ${mode} mode`)
  console.log('\n📦 Updated dependencies:')
  
  console.log('   Core package:')
  for (const pkg of BLUEPRINT_PACKAGES) {
    if (coreDeps[pkg]) {
      console.log(`     ${pkg}: ${coreDeps[pkg]}`)
    }
  }
  
  console.log('   CLI package:')
  if (cliDeps['@kompojs/blueprints']) {
    console.log(`     @kompojs/blueprints: ${cliDeps['@kompojs/blueprints']}`)
  }
}

function checkRepos() {
  const parentDir = join(repoRoot, '..')
  const requiredRepos = [
    'kompo',
    'blueprints',
    'create-kompo',
    'workbench',
    'docs',
    'platform'
  ]
  
  console.log('🔍 Checking repository structure...')
  
  for (const repo of requiredRepos) {
    const repoPath = join(parentDir, repo)
    if (existsSync(repoPath)) {
      console.log(`   ✅ ${repo}`)
    } else {
      console.log(`   ❌ ${repo} (not found)`)
    }
  }
}

async function runInstall() {
  console.log('\n📦 Running pnpm install...')
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  try {
    await execAsync('pnpm install', { cwd: repoRoot, stdio: 'inherit' })
    console.log('✅ Dependencies installed')
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message)
    process.exit(1)
  }
}

function showStatus() {
  const mode = getCurrentMode()
  console.log(`📊 Current mode: ${mode}`)
  
  const coreExists = existsSync(CORE_PACKAGE_JSON)
  const cliExists = existsSync(CLI_PACKAGE_JSON)
  
  if (!coreExists) {
    console.error('❌ packages/core/package.json not found')
    return
  }
  
  if (!cliExists) {
    console.error('❌ packages/cli/package.json not found')
    return
  }

  const corePkg = JSON.parse(readFileSync(CORE_PACKAGE_JSON, 'utf-8'))
  const cliPkg = JSON.parse(readFileSync(CLI_PACKAGE_JSON, 'utf-8'))
  const coreDeps = corePkg.dependencies || {}
  const cliDeps = cliPkg.dependencies || {}
  
  console.log('\n📦 Blueprint dependencies:')
  
  console.log('   Core package:')
  for (const pkgName of BLUEPRINT_PACKAGES) {
    if (coreDeps[pkgName]) {
      const type = coreDeps[pkgName].startsWith('file:') ? '🔧 dev' : '🚀 prod'
      console.log(`     ${type} ${pkgName}: ${coreDeps[pkgName]}`)
    }
  }
  
  console.log('   CLI package:')
  if (cliDeps['@kompojs/blueprints']) {
    const type = cliDeps['@kompojs/blueprints'].startsWith('file:') ? '🔧 dev' : '🚀 prod'
    console.log(`     ${type} @kompojs/blueprints: ${cliDeps['@kompojs/blueprints']}`)
  }
}

async function main() {
  const command = process.argv[2]
  
  console.log('🔧 Kompo Development Setup')
  console.log('========================\n')
  
  switch (command) {
    case 'dev':
    case 'development':
      switchToMode('development')
      checkRepos()
      await runInstall()
      break
      
    case 'prod':
    case 'production':
      switchToMode('production')
      await runInstall()
      break
      
    case 'status':
      showStatus()
      break
      
    default:
      console.log('Usage:')
      console.log('  node scripts/dev-setup.js dev     - Switch to development mode')
      console.log('  node scripts/dev-setup.js prod    - Switch to production mode')
      console.log('  node scripts/dev-setup.js status  - Show current mode')
      console.log('\nDevelopment mode uses local file references for blueprint packages')
      console.log('Production mode uses published versions from npm')
      process.exit(1)
  }
}

main().catch(console.error)
