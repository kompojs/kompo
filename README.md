<div align="center">
  <img src="./packages/assets/kompo.svg" alt="Kompo Logo" width="120" />
  <h1>@kompojs/core</h1>
  <p><strong>The core monorepo for the Kompo CLI and runtime packages.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@kompojs/core"><img src="https://img.shields.io/npm/v/@kompojs/core?style=flat-square&color=blue" alt="Version" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" /></a>
    <a href="https://discord.gg/RcXGwnyEgZ"><img src="https://img.shields.io/badge/discord-join-7289DA?style=flat-square" alt="Discord" /></a>
  </p>
</div>

---

## What is this repo?

This is the **core monorepo** for [Kompo](https://kompo.dev) — a code orchestration framework for TypeScript, built on Hexagonal Architecture (Ports & Adapters).

This repo contains the CLI, configuration, and runtime packages. Blueprints, the workbench, and the scaffolder live in their own repositories:

| Repository | Description |
|:--|:--|
| **[kompojs/kompo](https://github.com/kompojs/kompo)** (this repo) | CLI, kit, config, core runtime |
| [kompojs/blueprints](https://github.com/kompojs/blueprints) | Blueprint packages (starters, adapters, framework templates) |
| [kompojs/create-kompo](https://github.com/kompojs/create-kompo) | `create-kompo` scaffolder |
| [kompojs/workbench](https://github.com/kompojs/workbench) | Visual architecture explorer |

---

## Packages

| Package | npm | Description |
|:--|:--|:--|
| `@kompojs/cli` | [![npm](https://img.shields.io/npm/v/@kompojs/cli?style=flat-square)](https://www.npmjs.com/package/@kompojs/cli) | Command-line interface |
| `@kompojs/kit` | [![npm](https://img.shields.io/npm/v/@kompojs/kit?style=flat-square)](https://www.npmjs.com/package/@kompojs/kit) | Shared utilities and interfaces |
| `@kompojs/config` | [![npm](https://img.shields.io/npm/v/@kompojs/config?style=flat-square)](https://www.npmjs.com/package/@kompojs/config) | Configuration and constants |
| `@kompojs/core` | [![npm](https://img.shields.io/npm/v/@kompojs/core?style=flat-square)](https://www.npmjs.com/package/@kompojs/core) | Meta-package (installs CLI + deps) |

---

## Quick Start

### New project

```bash
pnpm create kompo@latest my-app
```

### Existing monorepo

```bash
# Install
pnpm add -D @kompojs/core

# Initialize
pnpm kompo init

# Add your first app
pnpm kompo add app
```

### Key commands

```bash
kompo init                    # Initialize Kompo in an existing monorepo
kompo add app                 # Add a new application
kompo add domain <name>       # Add a business domain
kompo add adapter             # Add an adapter (interactive)
kompo wire <domain>           # Wire a domain to an app
kompo doctor                  # Check project health
kompo list starters           # List available starters
kompo list blueprints         # List installed blueprint packages
```

---

## Development

```bash
# Clone
git clone https://github.com/kompojs/kompo.git
cd kompo

# Install
pnpm install

# Build all packages
pnpm build

# Run CLI in dev mode
pnpm --filter @kompojs/cli kompo <command>

# Typecheck
pnpm --filter @kompojs/cli typecheck

# Run tests
pnpm test
```

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Submit a pull request

### Community

- [Documentation](https://kompo.dev/docs)
- [Discord](https://discord.gg/RcXGwnyEgZ)
- [Twitter/X](https://x.com/kompojs)
- [GitHub Discussions](https://github.com/orgs/kompojs/discussions)

---

## License

**MIT © 2026 SmarttDev and Kompo contributors**
