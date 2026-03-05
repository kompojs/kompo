---
title: Project Structure
description: Understand the file organization and architecture of a Kompo project.
icon: folder-tree
---

# Project Structure

A Kompo project is a **monorepo** managed by pnpm workspaces. It is designed to scale with your application, separating concerns between your applications, your business logic (domains), and your shared tooling.

## Directory Overview

Here is the typical structure of a Kompo project:

```text
my-project/
├── apps/                  # Deployable applications
│   └── web/               # Next.js / Vite frontend
├── packages/              # Shared internal packages
│   ├── config/            # Shared configuration (env vars, eslint, etc.)
│   ├── domains/           # Your business logic packages
|   |   └── [domain]/      # Each domain is a standalone package
│   ├── ui/                # Shared UI component library
│   └── utils/             # Shared utilities
├── kompo.catalog.json     # Single Source of Truth for dependency versions
├── pnpm-workspace.yaml    # Workspace configuration (auto-generated)
├── package.json           # Root scripts
└── tsconfig.json          # Base TypeScript config
```

## Detailed Breakdown

### 1. Apps (`apps/`)

This directory contains your deployable applications. These are the entry points of your system.

- **apps/web**: Typically a Next.js or Vite application. It consumes your domains and UI components to build the user interface.
- **apps/api**: (Optional) A separate backend API if needed.
- **apps/worker**: (Optional) Background workers.

### 2. Packages (`packages/`)

Code shared across applications lives here.

#### `packages/domains/`
This is the heart of your application. Each domain (e.g., `user`, `payment`, `order`) is a separate package.
- **Why packages?** It enforces strict boundaries. A domain cannot import another domain directly without an explicit dependency, preventing spaghetti code.
- **Structure**: Each domain follows the Hexagonal Architecture (Ports & Adapters).

#### `packages/config/`
Contains shared configuration.
- **env.ts**: Centralized environment variable schema and validation (using `@t3-oss/env-core` or similar). All apps import environment variables from here to ensure type safety.
- **eslint-config**: Shared linting rules.

#### `packages/ui/`
Your Design System.
- Contains reusable React components (Buttons, Inputs, etc.).
- Usually built with Tailwind CSS and libraries like Shadcn/ui.

### 3. Dependency Management

- **`kompo.catalog.json`**: This file defines the specific versions of dependencies used across your workspace. It ensures that `apps/web` and `packages/ui` use the exact same version of `react` or `viem`.
- **`pnpm-workspace.yaml`**: Defines the workspace topology.

## Key Files

### `.env`
Located at the root of the workspace. Contains secrets and configuration for **all** applications. Kompo automatically loads these into your apps during development.

### `kompo.config.json`
The configuration file for the Kompo CLI. It tracks installed plugins, domains, and project settings.
