---
title: Project Structure
description: Understanding the Kompo monorepo organization
icon: folder-tree
---

# Project Structure

Kompo is organized as a monorepo with clear separation between community and enterprise code.

## Repository Structure

```text
kompo/
├── core/                    # Public community repository
│   ├── packages/
│   │   ├── blueprints/      # Community blueprints
│   │   ├── cli/             # CLI tool (renamed from cli-core)
│   │   ├── cli-kit/         # Shared CLI types and utilities
│   │   ├── tsconfig/        # TypeScript configurations
│   │   └── utils/           # Shared utilities
│   └── docs/                # Documentation (being migrated)
├── enterprise/              # Private enterprise repository
│   ├── cli/src/templates/   # Enterprise templates
│   ├── blueprints/          # Enterprise blueprints
│   ├── backend/             # Backend extensions
│   ├── drivers/             # Enterprise drivers
│   └── ...
└── websites/                # Documentation website
    └── content/docs/        # Unified documentation
```

## Package Organization

### Core Packages (Community)

- **@kompo/cli**: The main CLI tool for creating and managing Kompo projects
- **@kompo/cli-kit**: Shared types and utilities for CLI extensions
- **@kompo/blueprints**: Blueprint discovery and management
- **@kompo/tsconfig**: Shared TypeScript configuration
- **@kompo/utils**: Shared utility functions

### Enterprise Extensions

- **Backend Extensions**: NestJS, tRPC, Fastify integrations
- **CLI Extensions**: Additional commands for enterprise features
- **Enterprise Blueprints**: Advanced application templates
- **Enterprise Drivers**: High-performance infrastructure adapters

## Blueprint System

Blueprints are organized in two categories:

1. **Applications**: Complete application templates
   - `nextjs-fullstack.json` - Next.js with API routes
   - `react-vite.json` - React SPA with Vite
   - `defi-swap.json` - DeFi exchange application

2. **Features**: Installable features for existing apps
   - `erc20-token.json` - ERC20 token functionality
   - And more...

## Development Workflow

1. **Community Development**: Work in the `core/` repository
2. **Enterprise Development**: Work in the `enterprise/` repository
3. **Local Testing**: Use symbolic link from `core/packages/enterprise` to `../enterprise`
4. **Documentation**: All documentation lives in `websites/content/docs/`

## Naming Conventions

- Packages use kebab-case: `@kompo/cli-kit`
- Blueprints use kebab-case: `nextjs-fullstack.json`
- Templates use `.eta` extension for Eta templates
- All TypeScript files use `.ts` extension

## Contributing

When contributing to Kompo:

1. Community contributions go in `core/`
2. Enterprise features go in `enterprise/`
3. Always update documentation in `websites/content/docs/`
4. Follow the established naming conventions
5. Ensure TypeScript types are properly exported
