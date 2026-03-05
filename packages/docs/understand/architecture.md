---
title: Architecture
description: Understanding hexagonal architecture and Kompo concepts
---


# Understanding Kompo Architecture

Kompo is based on **Hexagonal Architecture** (also called Ports & Adapters). This approach ensures your business logic remains independent from any technical infrastructure.

## Why Hexagonal Architecture?

::: warning
**Classic problem:** In traditional architecture, your business logic is often coupled to your database, framework, or external API. Changing one element forces a complete refactor.
:::

::: tip
**Kompo solution:** Your domain is pure and isolated. It communicates through "ports" (contracts). Infrastructure plugs in through "adapters" (implementations).
:::

## The 5 Pillars of Kompo

### 1. Domain - The Business Core

The domain contains your PURE logic, without any external dependencies. It lives in `packages/domains/[domain-name]`.

### 2. Entity - Business Identity

Entities are the core objects of your domain with an identity.

```typescript
// packages/domains/nft-collection/src/entities/Nft.ts
export type Nft = {
  id: string
  name: string
  description: string
  status: 'DRAFT' | 'PUBLISHED'
}

export function createNft(data: Omit<Nft, 'id' | 'status'>): Nft {
  return {
    id: crypto.randomUUID(),
    ...data,
    status: 'DRAFT'
  }
}
```

### 3. Value Object - Immutable Values

Value Objects define characteristics without identity. They are immutable and interchangeable.

```typescript
// packages/domains/nft-collection/src/value-objects/Price.ts
export type Price = {
  amount: bigint
  currency: 'ETH' | 'USDC'
}

export function createPrice(amount: bigint, currency: 'ETH' | 'USDC'): Price {
  if (amount < 0n) throw new Error("Price cannot be negative")
  return { amount, currency }
}
```

### 4. Port - The Contract

The port defines what your domain NEEDS, without saying HOW.

```typescript
// packages/domains/nft-collection/src/ports/NftRepositoryPort.ts
export type NftRepositoryPort = {
  save(nft: Nft): Promise<void>
  findById(id: string): Promise<Nft | null>
}
```

### 5. Use Case - Business Actions

Use cases orchestrate your entities to accomplish business actions.

```typescript
// packages/domains/nft-collection/src/use-cases/createNft.ts
export async function createNft(
  input: CreateNftInput,
  ports: { nftRepository: NftRepositoryPort }
): Promise<Nft> {
  // Business logic
  const nft = createNft(input)
  
  // Persistence through the port
  await ports.nftRepository.save(nft)
  
  return nft
}
```

## The Adapters - Plugging in the World

Adapters live outside your domain, typically in `apps/web/src/adapters` or shared packages. They fulfill the port's contract.

```typescript
// apps/web/src/adapters/orm/drizzleNftRepository.adapter.ts
export function createDrizzleNftRepositoryAdapter(db: DrizzleDB): NftRepositoryPort {
  return {
    async save(nft: Nft) {
      await db.insert(nfts).values(nft)
    },
    async findById(id: string) {
      /* implementation */
    }
  }
}
```

## The Composition Root

The "Composition Root" is where everything connects, usually in your application.

```typescript
// apps/web/src/composition.ts
const repository = createDrizzleNftRepositoryAdapter(db)

export const handleCreateNft = async (input) => {
  return createNft(input, { nftRepository: repository })
}
```

## Summary

-   **Domain**: Where logic lives. `packages/domains/`.
-   **Ports**: What the domain needs. (Interfaces).
-   **Adapters**: How the needs are met. (Implementation).
-   **Use Cases**: The actions your system can perform.
-   **Entities**: The things your system manipulates.
-   **Value Objects**: The attributes of your things.

::: tip
**The golden rule of Kompo:** Your domain must NEVER import code outside of `packages/domains/`. Never.
:::
