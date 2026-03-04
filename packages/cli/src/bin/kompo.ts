#!/usr/bin/env node

import { Command } from 'commander'

import color from 'picocolors'
import { createAddCommand } from '../commands/add.command'
import { aiCommand } from '../commands/ai/ai.command'
import { createCatalogCommand } from '../commands/catalog.command'
import { createDoctorCommand } from '../commands/doctor.command'
import { createListCommand } from '../commands/list.command'
import { createRemoveCommand } from '../commands/remove.command'
import { createWireCommand } from '../commands/wire.command'
import { createPluginRegistry } from '../registries/plugin.registry'
import { applyHelpTheme, showHeader } from '../styles'
import { getVersion } from '../utils'

async function main() {
  const program = new Command()
  // outputError is configured recursively later
  const registry = createPluginRegistry()

  // Setup commands
  program
    .name('kompo')
    .description('Modular fullstack project scaffolding CLI')
    .version(getVersion())
    .option('-D, --debug', 'Show debug output')
    .showHelpAfterError(true)
    .addHelpText('beforeAll', showHeader())

  program.addCommand(createAddCommand(registry))
  program.addCommand(createRemoveCommand(registry))
  program.addCommand(createListCommand(registry))
  program.addCommand(createDoctorCommand(registry))
  program.addCommand(createWireCommand(registry))
  program.addCommand(createCatalogCommand())
  program.addCommand(aiCommand)

  // Apply help theme to all commands
  applyHelpTheme(program)

  // Recursively apply error styling to all commands
  applyStyleRecursively(program)

  // Parse and run
  await program.parseAsync(process.argv)
}

function applyStyleRecursively(cmd: Command) {
  cmd.configureOutput({
    outputError: (str, write) => {
      const red = (s: string) => color.red(s)
      write(red(str))
    },
  })
  cmd.commands.forEach((subCmd) => {
    applyStyleRecursively(subCmd)
  })
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
