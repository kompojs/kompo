---
title: Quick Start
description: Start building your Web3 application in 5 minutes with Kompo.
---

## Introduction

Kompo is designed to be flexible: start fast with a **template** or build incrementally from scratch using the **CLI**.

## 1. Add your app

From the root of a Kompo monorepo, add a new application:

::: code-group

```bash [pnpm]
kompo add app my-app
cd apps/my-app   # or the path chosen by the CLI
```

```bash [git clone]
git clone https://github.com/kompo-dev/kompo.git my-monorepo
cd my-monorepo
pnpm install
kompo add app my-app
cd apps/my-app
```

:::

## 2. Choose your Path

### Option A: Use a template (Recommended)

Launch a complete, production-ready dApp with best practices built-in.

```bash
kompo add app my-marketplace --template nft-marketplace
```

**What you get:**
- Full React/Vite application
- NFT Domain (Repository, Use Cases, Entities)
- Pre-wired Adapters (Web3 + Local DB)
- **Composition Root** handling the wiring

### Option B: Build from Scratch

**1. Add an empty app**

```bash
kompo add app my-app
```

**2. Add a Domain**

```bash
kompo add domain nft
```

**3. Add an Adapter**

```bash
kompo add adapter
```

**4. Wire it all up**

```bash
kompo wire nft
```

## 3. Launch

```bash
pnpm dev
```

Visit `http://localhost:5173` to see your app in action!

## Next Steps

- [Understand the Architecture](/understand/architecture)
- [Master the CLI](/cli/overview)
- [Explore Templates](/templates/overview)
