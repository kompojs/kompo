import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { confirm, isCancel, text } from '@clack/prompts'
import { detectPackageManager, findWorkspaceRoot, initKompoConfig } from '@kompojs/kit'
import { Command } from 'commander'
import color from 'picocolors'

export function createInitCommand(): Command {
  const cmd = new Command('init')
    .description('Initialize Kompo in an existing monorepo')
    .option('-n, --name <name>', 'Project name')
    .option('-o, --org <org>', 'Organisation / scope (e.g. @myorg)')
    .option('-y, --yes', 'Skip confirmations')
    .action(async (options) => {
      const cwd = process.cwd()

      // 1. Detect workspace root
      const workspace = findWorkspaceRoot(cwd)
      if (!workspace) {
        console.log(color.red('❌ No workspace root found.'))
        console.log(
          color.dim(
            'Kompo requires a monorepo with either pnpm-workspace.yaml or package.json#workspaces.'
          )
        )
        process.exit(1)
      }

      const repoRoot = workspace.root
      const pm = detectPackageManager(repoRoot)

      console.log(
        color.blue(`\n  Detected ${color.bold(workspace.type)} workspace at ${color.dim(repoRoot)}`)
      )
      console.log(color.blue(`  Package manager: ${color.bold(pm.name)}\n`))

      // 2. Check if already initialized
      const configPath = join(repoRoot, 'libs', 'config', 'kompo.config.json')
      if (existsSync(configPath)) {
        console.log(color.yellow('⚠️  Kompo is already initialized in this project.'))
        console.log(color.dim(`  Config found at: ${configPath}`))

        if (!options.yes) {
          const overwrite = await confirm({
            message: 'Re-initialize? This will overwrite the existing config.',
            initialValue: false,
          })
          if (isCancel(overwrite) || !overwrite) {
            console.log(color.dim('  Cancelled.'))
            process.exit(0)
          }
        }
      }

      // 3. Gather project info
      let projectName = options.name
      if (!projectName) {
        projectName = await text({
          message: 'Project name',
          placeholder: 'my-project',
          validate: (v) => {
            if (!v) return 'Project name is required'
            if (!/^[a-z][a-z0-9-]*$/.test(v)) return 'Must be lowercase kebab-case'
            return undefined
          },
        })
        if (isCancel(projectName)) {
          process.exit(0)
        }
      }

      let org = options.org
      if (!org) {
        org = await text({
          message: 'Organisation scope',
          placeholder: '@myorg',
          validate: (v) => {
            if (!v) return 'Organisation scope is required'
            if (!v.startsWith('@')) return 'Must start with @'
            return undefined
          },
        })
        if (isCancel(org)) {
          process.exit(0)
        }
      }

      // 4. Create directory structure
      console.log(color.blue('\n  Scaffolding Kompo structure...\n'))

      const dirs = [
        join(repoRoot, 'apps'),
        join(repoRoot, 'libs', 'config'),
        join(repoRoot, 'libs', 'domains'),
        join(repoRoot, 'libs', 'utils'),
      ]

      for (const dir of dirs) {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
          console.log(color.green(`  ✓ Created ${color.dim(dir.replace(repoRoot, '.'))}`))
        }
      }

      // 5. Initialize kompo.config.json
      initKompoConfig(repoRoot, projectName as string, (org as string).replace('@', ''))
      console.log(color.green(`  ✓ Created ${color.dim('libs/config/kompo.config.json')}`))

      // 6. Create kompo.catalog.json
      const catalogPath = join(repoRoot, 'libs', 'config', 'kompo.catalog.json')
      if (!existsSync(catalogPath)) {
        writeFileSync(catalogPath, JSON.stringify({ version: '1.0.0', packages: {} }, null, 2))
        console.log(color.green(`  ✓ Created ${color.dim('libs/config/kompo.catalog.json')}`))
      }

      // 7. Done
      console.log(color.green('\n  ✨ Kompo initialized!\n'))
      console.log(`  Next steps:`)
      console.log(`  ${color.cyan(`${pm.name} add -D @kompojs/core`)}  Install Kompo`)
      console.log(`  ${color.cyan('kompo add app')}                Add your first application`)
      console.log('')
    })

  return cmd
}
