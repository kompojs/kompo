---
title: Configuration
description: Détails du fichier kompo.config.json
---

# Kompo CLI Commands

Kompo CLI provides a clear separation between architectural elements and pre-built templates.

## Architecture Commands (`kompo add`)

These commands add individual elements to your hexagonal architecture:

### Domain

```bash
kompo add domain use
```

Creates a new domain with the basic structure:

- `domains/user/ports.ts`
- `domains/user/index.ts`

### Use Case

```bash
kompo add use-case login-with-wallet --domain user
```

Adds a use case to an existing domain.

### Port

```bash
kompo add port user-repository --domain user
```

Defines a port interface for your domain.

### Adapter

```bash
kompo add adapter drizzle --port user-repository
```

Implements a port with a specific technology.

### Entity

```bash
kompo add entity user --domain user
```

Adds a domain entity with schema.

### Feature (Custom)

```bash
kompo add feature ./my-feature.json
```

Installs a custom feature defined by a JSON manifest. This generates boilerplate code without business logic.

## Template Commands (`kompo install`)

These commands install complete, pre-built templates with business logic:

### Web3 Templates

```bash
# ERC20 Token Operations
kompo install erc20-allowance
kompo install erc20-balance

# Network Operations
kompo install network-reader
```

Each template includes:

- ✅ Domain ports and use cases
- ✅ Adapters (viem/wagmi)
- ✅ React hooks
- ✅ TypeScript types
- ✅ Dependencies installed automatically

### Future Templates (Planned)

```bash
# DeFi Templates
kompo install defi-swap
kompo install liquidity-pool

# NFT Templates
kompo install nft-marketplace
kompo install nft-minter

# DAO Templates
kompo install dao-governance
kompo install voting-contract

# External Templates (NPM)
kompo install @myorg/custom-template
```

## Command Philosophy

### `kompo add` = Building Blocks

- Adds individual architectural elements
- For custom development
- You write the business logic
- Follows hexagonal architecture principles

### `kompo install` = Complete Solutions

- Installs pre-built templates
- Includes business logic
- Ready to use out of the box
- Perfect for common Web3 patterns

## Examples

### Create a custom authentication system

```bash
# 1. Create the domain
kompo add domain auth

# 2. Add ports
kompo add port auth-service --domain auth
kompo add port wallet-connector --domain auth

# 3. Add use cases
kompo add use-case connect-wallet --domain auth
kompo add use-case sign-message --domain auth

# 4. Add adapters
kompo add adapter wagmi --port wallet-connector
```

### Add Web3 functionality quickly

```bash
# One command for a complete feature
kompo install erc20-allowance

# This creates:
# - domains/token-allowance/
# - shared/adapters/web3/viem-token-allowance-adapter.ts
# - apps/web/src/hooks/useTokenAllowance.ts
# - Installs viem dependency
```

## Migration from `kompo add web3`

The old command:

```bash
# Before (deprecated)
kompo add web3 erc20-allowance
```

Is now:

```bash
# After
kompo install erc20-allowance
```

The new syntax is cleaner and more consistent with the template-focused approach.
