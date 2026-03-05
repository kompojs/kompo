---
title: Terminology
description: Common terms and definitions used in the Kompo ecosystem
icon: quote
---

# Terminology

### Blueprint
A **Blueprint** is a high-level definition file (usually JSON) that describes a project or a feature. It tells the CLI which templates to use, what dependencies to install, and how to configure the result. It is the "recipe" for generation.

### Template
A **Template** is the actual source code file used for generation, typically written in **Eta** syntax (`.eta` extension). Templates contain the code structure with placeholders (e.g., `<%= it.name %>`) that are replaced with actual values during generation.

### Feature
A **Feature** is a distinct unit of functionality that can be added to an application. In Kompo, a feature often bundles:
-   **Domains**: Business logic (Entities, Use Cases).
-   **Adapters**: Technical implementations (DB, API clients).
-   **UI Components**: React components to interact with the feature.
-   **Config**: Environment variables and settings.

Example: An `auth` feature might include a User entity, a Repository port, a Privy adapter, and a Login button.

### Plugin CLI
A **Plugin CLI** is an extension to the core Kompo CLI. Since Kompo is modular, specific capabilities (like generating a particular database adapter or interacting with a specific cloud provider) are implemented as plugins. This keeps the core CLI lightweight while allowing infinite extensibility.

### Adapter
In Hexagonal Architecture, an **Adapter** is a piece of code that connects your application to the outside world (Database, UI, 3rd party API) by implementing a **Port**.

### Port
A **Port** is an interface (TypeScript `interface` or `type`) defined in the Domain. It specifies the contract that an Adapter must fulfill. It allows the Domain to remain independent of infrastructure.
