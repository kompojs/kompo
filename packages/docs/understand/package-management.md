---
title: Package Management
description: Understanding how dependencies are managed in Kompo
icon: package
---

# Package Management

Kompo uses a strict package management strategy to ensure consistency across the monorepo while keeping tooling and user applications decoupled.

## Core Concepts

### 1. Single Source of Truth (`kompo.catalog.json`)

The `kompo.catalog.json` file at the root of your workspace is the **Single Source of Truth (SSOT)** for package versions.
It defines "groups" of dependencies that work well together.

```json
// kompo.catalog.json
{
  "catalog": {
    "web3": {
      "wagmi": "^2.5.7",
      "viem": "^2.7.1"
    },
    "react": {
      "react": "^18.2.0"
    }
  }
}
```

### 2. The Workspace Catalog (`pnpm-workspace.yaml`)

The `pnpm-workspace.yaml` file acts as a **bridge**. It is automatically populated by the Kompo CLI based on the features your project uses.

**You should not manually edit the versions in this file.**
Let `kompo` manage it.

### 3. Application Dependencies (`package.json`)

Your applications consume dependencies using the `catalog:` protocol. This tells pnpm to "look up the version in the workspace catalog".

```json
// apps/web/package.json
{
  "dependencies": {
    "wagmi": "catalog:",  // <--- Resolves to version in pnpm-workspace.yaml
    "react": "catalog:",
    "axios": "^1.6.0"     // <--- Specific version allowed for app-specific tools
  }
}
```

## Catalog vs Dependencies

| Feature | Catalog (`catalog:`) | Explicit Version (`^1.0.0`) |
| :--- | :--- | :--- |
| **Use case** | Shared infrastructure (React, Web3, ORM) | Specific tools (date-fns, lodash) |
| **Governance** | Centralized in `kompo.catalog.json` | Local to the package |
| **Updates** | Update once, propagates to all apps | Update per app |
| **Consistency** | Guaranteed across monorepo | Not guaranteed |

## Workflow

### Adding a new feature

When you use `kompo add app` or `kompo add feature`, the CLI:
1. Reads `kompo.catalog.json`.
2. Identifies required packages for the feature (e.g., `web3`).
3. Updates `pnpm-workspace.yaml` with those specific versions.
4. Updates your app's `package.json` to use `catalog:`.

### Git Conflict Resolution

If a conflict occurs during a merge:

1.  **Conflict on `kompo.catalog.json`**:
    *   **Action**: Resolve manually. Decide which version standard to adopt.
    *   **Significance**: This is a governance decision.

2.  **Conflict on `pnpm-workspace.yaml`**:
    *   **Action**: This file is derived. You can often accept one side, or revert it.
    *   **Fix**: Run `kompo doctor` (or `kompo sync` coming soon) to regenerate it from the source of truth.

## Separation of Concerns

Kompo enforces a strict separation:

*   **Tooling (`packages/*`)**: Does **NOT** use the catalog. Uses fixed versions to ensure the CLI and tools are stable and independent of your app's stack.
*   **User Stack (`apps/*`, `shared/*`)**: Uses the **Catalog**. Ensures all your apps share the same coherent dependency set defined by your organization.
