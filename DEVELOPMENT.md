# Kompo Development Setup

This document explains how to set up the Kompo monorepo for development.

## Repository Structure

For local development, you should clone all Kompo repositories in the same parent directory:

```
kompojs/
├── kompo/           # Core monorepo (cli, kit, config, core, assets, tsconfig, workbench)
├── blueprints/      # Blueprints monorepo (core + 5 framework packages)
├── create-kompo/    # Create-kompo monorepo (scaffolder + npm wrappers)
├── workbench/       # @kompojs/workbench (standalone)
├── docs/            # Documentation (VitePress)
└── platform/        # Platform (Next.js)
```

## Development Modes

The Kompo monorepo supports two modes:

### Production Mode (Default)
- Uses published versions of blueprint packages from npm
- Suitable for testing the published release
- Default mode after cloning

### Development Mode
- Uses local file references to blueprint packages
- Allows testing changes across multiple repositories
- Required for active development of blueprint packages

## Setup Commands

### Switch to Development Mode
```bash
pnpm dev:setup
```
This will:
- Update `packages/core/package.json` to use local file references
- Check that all required repositories are present
- Run `pnpm install` to link everything

### Switch to Production Mode
```bash
pnpm prod:setup
```
This will:
- Update `packages/core/package.json` to use published versions
- Run `pnpm install` to fetch packages from npm

### Check Current Mode
```bash
pnpm dev:status
```
Shows which mode is currently active and the dependency versions.

## Development Workflow

### For Core Development (kompo/ repo)
1. Clone all repositories in the same parent directory
2. Run `pnpm dev:setup` to enable development mode
3. Make changes to any package in the kompo/ monorepo
4. Test with `pnpm kompo` or build packages

### For Blueprint Development (blueprints/ repo)
1. Ensure you're in development mode (`pnpm dev:setup`)
2. Make changes to blueprint packages
3. The changes will be immediately available in the kompo/ repo

### For Release Preparation
1. Switch to production mode: `pnpm prod:setup`
2. Test that everything works with published versions
3. Run the full test suite
4. Create changesets and publish

## Repository Detection

The development setup script checks for these repositories in the parent directory:
- `kompo` - Core monorepo
- `blueprints` - Blueprint packages
- `create-kompo` - CLI scaffolder
- `workbench` - DevTools workbench
- `docs` - Documentation
- `platform` - Platform demo

## File References

In development mode, these file references are used:
- `@kompojs/blueprints` → `file:../../../blueprints/packages/blueprints`
- `@kompojs/blueprints-nextjs` → `file:../../../blueprints/packages/blueprints-nextjs`
- `@kompojs/blueprints-react` → `file:../../../blueprints/packages/blueprints-react`
- `@kompojs/blueprints-nuxt` → `file:../../../blueprints/packages/blueprints-nuxt`
- `@kompojs/blueprints-vue` → `file:../../../blueprints/packages/blueprints-vue`
- `@kompojs/blueprints-express` → `file:../../../blueprints/packages/blueprints-express`

## Troubleshooting

### "Repository not found" warnings
Make sure all repositories are cloned in the same parent directory. Missing repositories are just warnings - the setup will still work.

### Module resolution errors
After switching modes, always run `pnpm install` to ensure dependencies are properly linked.

### Build failures
- Ensure you're in the correct mode for your development needs
- Check that all repositories are present
- Try `pnpm clean:all` then `pnpm install`

## Package Manager

All Kompo repositories use pnpm as the package manager. Ensure you have pnpm installed:
```bash
npm install -g pnpm
```
