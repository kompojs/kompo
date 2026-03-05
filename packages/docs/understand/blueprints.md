---
title: Blueprints
description: Understand how Kompo generates code using Blueprints
icon: drawing-pin
---

# Blueprints

Blueprints are the DNA of Kompo's code generation. They define **what** to generate (files, dependencies, configurations) and **how** to generate it.

## What is a Blueprint?

A Blueprint is a JSON definition that describes a set of capabilities, domains, or an entire application. When you run `kompo add app` or `kompo add`, you are essentially executing a Blueprint.

Blueprints live in `packages/blueprints`.

## Structure of a Blueprint

A blueprint typically consists of:

1.  **Metadata**: Name, version, description.
2.  **Generators**: Instructions on which templates to render.
3.  **Dependencies**: Packages to install.
4.  **Prompts**: Questions to ask the user during generation.

```json
{
  "name": "nextjs-fullstack",
  "type": "app",
  "generators": [
    {
      "type": "scaffold",
      "template": "apps/nextjs"
    },
    {
      "type": "domain",
      "name": "auth"
    }
  ]
}
```

## Types of Blueprints

### 1. App Blueprints
Used by `kompo add app`. These define the skeleton of a new application.
*   Examples: `nextjs-fullstack`, `react-vite`, `web3-dapp`.

### 2. Feature Blueprints
Used by `kompo add`. These inject specific functionality into an existing project.
*   Examples: `auth-privy`, `payment-stripe`, `orm-drizzle`.

## Creating a Blueprint

To create a custom blueprint:

1.  **Define the Schema**: Create a JSON file in `packages/blueprints`.
2.  **Create Templates**: Add `.eta` templates in `packages/cli/src/templates`.
3.  **Register**: Available in your CLI.

*(Detailed guide on creating custom blueprints coming soon)*
