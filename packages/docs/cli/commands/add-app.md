---
title: kompo add app
description: Add a new application to your Kompo monorepo
---

# `kompo add app`

The `kompo add app` command is the main entrypoint to add a new application to your Kompo monorepo. It scaffolds a new app based on hexagonal architecture.

## Usage

```bash
kompo add app <app-name> [options]
```

## Options

- `--template <name>` : Use a pre-defined template (e.g. `nft-marketplace`, `dao-governance`).
- `--org <name>` : Specify the organization name for packages (default: your username).

## Examples

```bash
# Add a standard Web3 app
kompo add app my-web3-app

# Add an app from the NFT Marketplace template
kompo add app awesome-nfts --template nft-marketplace
```

The CLI will then guide you to choose your stack (Next.js, Tailwind, etc.).
