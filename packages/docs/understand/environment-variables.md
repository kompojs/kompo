---
title: Environment Variables
description: Managing environment variables and secrets in Kompo
icon: key
---

# Environment Variables

Kompo uses a centralized approach to environment variables to ensure type safety and consistency across your monorepo.

## The Strategy

1.  **Single `.env` File**: All secrets and config values live in the root `.env` file.
2.  **Shared Config Package**: A dedicated package `packages/config` defines the schema and validation.
3.  **Type-Safe Access**: Applications import variables from the config package, not directly from `process.env`.

## 1. The Root `.env`

Create a `.env` file at the root of your workspace:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db"

# API Keys
NEXT_PUBLIC_API_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
```

## 2. The Config Package (`packages/config`)

Instead of repeating validation logic in every app, we define it once in `packages/config/src/env.ts`.

Kompo typically uses libraries like `@t3-oss/env-core` or `zod` for this.

```typescript
// packages/config/src/env.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().min(1),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
```

## 3. Usage in Apps

In your applications (e.g., `apps/web`), you simply import `env`.

```typescript
// apps/web/src/lib/api.ts
import { env } from "@my-org/config"; // Imports from packages/config

export const apiClient = new Client({
  baseUrl: env.NEXT_PUBLIC_API_URL, // Typed as string
});
```

### Why this is better?

-   **Validation at Build/Run Time**: If `DATABASE_URL` is missing, the app crashes immediately with a helpful error message.
-   **Type Safety**: TypeScript knows that `env.DATABASE_URL` is a string.
-   **Centralized Control**: You manage your schema in one place.

## Adding a New Variable

1.  Add the value to your root `.env`.
2.  Update `packages/config/src/env.ts` to include the variable in the `server` or `client` schema.
3.  Use it in your code!
