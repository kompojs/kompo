---
title: Introduction
description: Kompo - Build Web3 Faster with Code Orchestration Framework
---

## Overview

Kompo is a **Web3 Code Orchestration Framework** based on Hexagonal Architecture (Ports & Adapters). It enables you to build decentralized applications rapidly with perfect separation between your business logic and infrastructure.

## Why Kompo?

::: warning The problem with traditional DApps
- Business logic mixed with blockchain code
- Impossible to test without network
- Changing provider = complete refactor
- No separation of concerns
:::

::: tip The Kompo solution to ship Web3 apps 10x faster
- Pre-built, production-ready blueprints
- Pure domain logic (unit testable)
- No more copy-pasting or reinventing the wheel
- Scalable hexagonal architecture
- Change providers without touching business logic
- Off-the-shelf Web3 features
:::

## The 4 Pillars of Kompo

- [**Code as a Service**](/understand/architecture) — Pre-built Web3 capabilities (wallet, NFT, DAO) composed via CLI.
- [**Hexagonal Architecture**](/understand/architecture) — Pure domain at the center, infrastructure as interchangeable adapters.
- [**Production-Ready Blueprints**](/cli/overview) — Ship complete dApps from templates (NFT Marketplace, DAO, DeFi).
- [**Zero Vendor Lock-in**](/templates/overview) — Change providers (DB, wallet, indexer) without touching business logic.

## Quick Start - 5 minutes flat

### 1. Add your app

From a Kompo monorepo, add a new application:

```bash
kompo add app my-web3-app
cd apps/my-web3-app   # or the path chosen by the CLI
```

### 2. Add Web3 capabilities

```bash
# Wallet connection
kompo add wallet

# Database persistence  
kompo add orm

# File storage
kompo add ipfs
```

### 3. Create your business domain

```bash
kompo add domain nft-collection
# → Use case: create-nft
# → Port: nft-repository  
# → Entity: Nft
```

### 4. Launch the app

```bash
pnpm dev
```

**Result**: A complete Web3 app with wallet connection (MetaMask, WalletConnect), configured PostgreSQL, IPFS storage, and clean architecture.

## Kompo Architecture in 30 seconds

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Your App      │───▶│ Composition  │───▶│   Pure Domain   │
│   (Next.js)     │    │     Root     │    │ (business only) │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                │                   │
                                ▼                   ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │   Adapters   │◀───│     Ports       │
                       │ (Drizzle,    │    │   (contracts)   │
                       │  Wagmi, etc) │    └─────────────────┘
                       └──────────────┘
```

**Your domain depends on nothing. Everything depends on your domain.**

## What you can build

### NFT Marketplace

```typescript
// Your business logic, pure and simple
export async function createAndListNft(input, ports) {
  const nft = createNft(input)
  const metadata = await ports.storage.upload(input.image)
  const token = await ports.wallet.mint(metadata)
  const listed = listNft(nft, input.price)
  await ports.nftRepository.save(listed)
  return listed
}
```

Kompo handles the rest: Wallet (Wagmi), IPFS, Viem, Drizzle.

### DAO Governance

Kompo provides Governor contracts, vote tracking (The Graph), notifications, and treasury management.

## The Kompo Promise

::: tip 🚀 Time-to-market
Off-the-shelf Web3 capabilities save you weeks of development.
:::

::: tip 🔧 No Vendor Lock-in
Change providers (DB, wallet, storage) without modifying your business logic.
:::

::: tip 🧪 Testability
Your domains are 100% unit testable. No mocks, no blockchain.
:::

::: tip 📈 Scalability
Proven hexagonal architecture used by major enterprises.
:::

## Get Started Now

- [**Quick Start**](/quick-start) — Create your first app in 5 minutes.
- [**Understand**](/understand/architecture) — Hexagonal architecture and concepts.
- [**Build**](/build/overview) — Complete Web3 application step by step.
- [**CLI**](/cli/overview) — Master all Kompo commands.

## Join the Community

- [Documentation](https://docs.kompo.dev)
- [Discord](https://discord.gg/kompo)
- [Twitter/X](https://twitter.com/kompo_js)
- [GitHub](https://github.com/kompo-dev/kompo)

---

**Kompo** — Build Web3. Faster. Cleaner. Better.
