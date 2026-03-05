---
title: CLI Usage
description: Complete guide to using the Kompo CLI
icon: terminal
---

# CLI Usage

## Installation

### Prerequisites

- Node.js 18+
- pnpm

### Community Installation

```bash
# Clone the Community repo
git clone https://github.com/kompo-dev/kompo.git
cd kompo

# Install dependencies
pnpm install

# The CLI is now available as pnpm kompo
pnpm kompo --help
```

## Commands Overview

### `kompo add app` - Add Applications

```bash
# List available blueprints
pnpm kompo blueprints

# Add an app from a blueprint
pnpm kompo add app my-app --blueprint nextjs-fullstack

# Add with organization
pnpm kompo add app my-app --blueprint react-vite --org @mycompany

# Add a basic app (interactive)
pnpm kompo add app my-app
```

### `kompo add` - Add Features

```bash
# Add a domain
pnpm kompo add domain user-management

# Add an entity
pnpm kompo add entity User --domain user-management

# Add a use case
pnpm kompo add use-case CreateUser --domain user-management

# Add a port
pnpm kompo add port orm --adapter drizzle-postgres

# Add infrastructure
pnpm kompo add wallet
pnpm kompo add orm
pnpm kompo add auth
```

### `kompo install` - Install Blueprints

```bash
# Install a feature blueprint
pnpm kompo install erc20-token --app my-app

# List available blueprints
pnpm kompo blueprints
```

### `kompo wire` - Generate Composition

```bash
# Generate composition for a domain
pnpm kompo wire user-management --app my-app
```

### Other Commands

```bash
# Check system health
pnpm kompo doctor

# List all commands
pnpm kompo --help

# Enable debug output
pnpm kompo --debug add app my-app
```

## Blueprint System

### Blueprint Types

1. **Applications** - Complete application templates
   - Create a full project structure
   - Include framework, database, and design system
   - Example: `nextjs-fullstack`, `react-vite`

2. **Features** - Installable components
   - Add functionality to existing apps
   - Example: `erc20-token`, `wallet-connection`

### Using Blueprints

```bash
# Add app from application blueprint
pnpm kompo add app my-dex --blueprint defi-swap

# Install feature blueprint
pnpm kompo install erc20-token --app my-dex
```

## Development Workflow

### 1. Add your app

```bash
pnpm kompo add app my-web3-app --blueprint nextjs-fullstack
cd apps/my-web3-app
```

### 2. Add Domains

```bash
pnpm kompo add domain nft-collection
pnpm kompo add entity NFT --domain nft-collection
pnpm kompo add use-case CreateNFT --domain nft-collection
```

### 3. Add Infrastructure

```bash
pnpm kompo add wallet
pnpm kompo add orm --adapter drizzle-postgres
pnpm kompo add ipfs
```

### 4. Generate Composition

```bash
pnpm kompo wire nft-collection
```

### 5. Run Development

```bash
pnpm dev
```

## Enterprise Features

When enterprise extensions are available:

```bash
# Create with NestJS backend
pnpm kompo new my-api --blueprint nestjs-api

# Add enterprise backends
pnpm kompo add backend --adapter nestjs
pnpm kompo add backend --adapter trpc
```

## Configuration

### Environment Variables

```bash
# Copy example env
cp .env.example .env

# Edit with your values
# DATABASE_URL, REDIS_URL, etc.
```

### Project Configuration

The CLI manages `.kompo/kompo.config.json` automatically:

```json
{
  "version": 1,
  "project": { "name": "my-app", "org": "@mycompany" },
  "apps": {
    "apps/web": {
      "frontend": "nextjs",
      "backend": "none",
      "designSystem": "shadcn"
    }
  },
  "history": [
    { "action": "new", "plugin": "framework-nextjs" },
    { "action": "add", "plugin": "design-shadcn" }
  ]
}
```

## Troubleshooting

### Common Issues

**"Blueprint not found"**
```bash
# List available blueprints
pnpm kompo blueprints

# Check enterprise is available
ls packages/enterprise
```

**"Domain already exists"**
```bash
# Check existing domains
ls shared/domains

# Use a different name
pnpm kompo add domain user-profiles
```

**TypeScript errors after adding features**
```bash
# Restart TypeScript server
pnpm type-check

# Clean and rebuild
pnpm clean
pnpm build
```

### Debug Mode

```bash
# Enable detailed logs
pnpm kompo --debug add entity User

# Environment variable
DEBUG=kompo:* pnpm kompo add app my-app
```

## Best Practices

1. **Use descriptive names** for domains and entities
2. **Follow naming conventions**: PascalCase for entities, kebab-case for domains
3. **Commit after each major change** to track history
4. **Use `kompo doctor`** to verify setup
5. **Keep dependencies updated** with `pnpm update`

## Advanced Usage

### Custom Templates

Create custom blueprints in `packages/blueprints/`:

```json
{
  "name": "my-custom-app",
  "description": "My custom application",
  "type": "app",
  "history": [
    { "action": "new", "plugin": "framework-nextjs" },
    { "action": "add", "plugin": "design-tailwind" }
  ]
}
```

### Scripting

Use the CLI in scripts:

```bash
#!/bin/bash
# setup-project.sh
pnpm kompo add app $1 --blueprint nextjs-fullstack
pnpm kompo add domain core
pnpm kompo add wallet
pnpm kompo add orm
echo "Project $1 ready!"
```

## Resources

- [Architecture Guide](/understand/architecture)
- [Quick Start](/quick-start)
- [Project Structure](/project-structure)
- [GitHub Repository](https://github.com/kompo-dev/kompo)
