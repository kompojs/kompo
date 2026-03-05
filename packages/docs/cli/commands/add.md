---
title: kompo add
description: Add capabilities or domains to your project
---

# `kompo add`

The `kompo add` command is used to extend your project by adding business domains or infrastructure capabilities (adapters).

## Add a Domain

```bash
kompo add domain <domain-name>
```

This command launches an interactive flow to define:
1. The initial Use Case.
2. The necessary Ports.
3. The main Entity.

## Add a Capability (Infrastructure)

```bash
# Add persistence
kompo add orm

# Add Wallet connection
kompo add wallet

# Add caching system
kompo add cache
```

## Other subcommands

- `kompo add entity <Name> --domain <domain>`
- `kompo add use-case <name> --domain <domain>`
- `kompo add port <name> --domain <domain>`
