---
title: Domain
description: The heart of your business logic in Kompo
---


# Domain - The Heart of Your Business Logic

The domain is where your business logic lives. It's pure, isolated, and completely independent of any infrastructure.

## What is a Domain?

A domain represents a bounded context of your business. Examples:
- `user-management`: Authentication, profiles, permissions
- `nft-marketplace`: NFT creation, trading, collections
- `payment-processing`: Transactions, refunds, subscriptions
- `dao-governance`: Proposals, voting, treasury

::: tip
**Key principle:** A domain should NEVER import anything outside of `domains/`. No DB, no HTTP, no blockchain.
:::

## Domain Structure

```
domains/<domain-name>/
├── entities/           # Business objects
├── value-objects/      # Immutable concepts
├── use-cases/         # Business actions
├── ports/             # Interface contracts
└── index.ts           # Public exports
```

## 1. Entities - The Core Objects

Entities are the core objects of your domain with an identity.

```typescript
// domains/nft-marketplace/entities/Nft.ts
import type { NftId, CollectionId } from '../value-objects'
import type { EthAddress } from '../value-objects/EthAddress'

export type Nft = {
  readonly id: NftId
  readonly collectionId: CollectionId
  readonly tokenId: bigint
  readonly name: string
  readonly description: string
  readonly imageUrl: string
  readonly metadataUrl: string
  readonly creator: EthAddress
  readonly owner: EthAddress
  readonly price: bigint
  readonly isListed: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

// Factory function - ALWAYS use factories!
export function createNft(data: {
  collectionId: CollectionId
  tokenId: bigint
  name: string
  description: string
  imageUrl: string
  metadataUrl: string
  creator: EthAddress
}): Nft {
  return {
    id: createNftId(),
    ...data,
    owner: data.creator,
    price: 0n,
    isListed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Business logic methods
export function listNft(nft: Nft, price: bigint): Nft {
  if (price <= 0n) {
    throw new Error('Price must be positive')
  }
  
  return {
    ...nft,
    price,
    isListed: true,
    updatedAt: new Date()
  }
}

export function transferNft(nft: Nft, newOwner: EthAddress): Nft {
  if (nft.owner === newOwner) {
    throw new Error('Cannot transfer to same owner')
  }
  
  return {
    ...nft,
    owner: newOwner,
    isListed: false,
    price: 0n,
    updatedAt: new Date()
  }
}
```

### Entity Best Practices

::: tip ✅ Do:
- Use readonly properties (immutable)

    - Create factory functions

    - Put business logic in methods

    - Validate business rules
:::

::: warning ❌ Don't:
- Export constructors

    - Modify properties directly

    - Put infrastructure code

    - Use external dependencies
:::

## 2. Value Objects - Immutable Concepts

Value objects are immutable concepts defined by their values.

```typescript
// domains/nft-marketplace/value-objects/NftId.ts
export type NftId = string & { readonly _brand: unique symbol }

export function createNftId(id?: string): NftId {
  return (id ?? crypto.randomUUID()) as NftId
}

export function isValidNftId(id: string): id is NftId {
  return typeof id === 'string' && id.length > 0
}

// domains/nft-marketplace/value-objects/EthAddress.ts
export type EthAddress = string & { readonly _brand: unique symbol }

export function createEthAddress(address: string): EthAddress {
  if (!isValidEthAddress(address)) {
    throw new Error('Invalid Ethereum address')
  }
  return address as EthAddress
}

export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
```

## 3. Use Cases - Business Actions

Use cases orchestrate entities to accomplish business goals.

```typescript
// domains/nft-marketplace/use-cases/createAndListNft.ts
import type { Nft } from '../entities/Nft'
import type { NftRepositoryPort } from '../ports/NftRepositoryPort'
import type { MetadataStoragePort } from '../ports/MetadataStoragePort'
import type { WalletPort } from '../ports/WalletPort'
import { createNft, listNft } from '../entities/Nft'

export type CreateAndListNftInput = {
  collectionId: string
  name: string
  description: string
  image: File
  price: bigint
}

export type CreateAndListNftOutput = {
  nft: Nft
  transactionHash: string
}

export async function createAndListNft(
  input: CreateAndListNftInput,
  ports: {
    nftRepository: NftRepositoryPort
    metadataStorage: MetadataStoragePort
    wallet: WalletPort
  }
): Promise<CreateAndListNftOutput> {
  // 1. Business validation
  if (!input.name || input.name.length < 3) {
    throw new Error('NFT name must be at least 3 characters')
  }
  
  if (input.price <= 0n) {
    throw new Error('Price must be positive')
  }
  
  // 2. Upload metadata (through port)
  const imageUrl = await ports.metadataStorage.uploadFile(input.image)
  
  const metadata = {
    name: input.name,
    description: input.description,
    image: imageUrl,
    attributes: []
  }
  
  const metadataUrl = await ports.metadataStorage.uploadJson(metadata)
  
  // 3. Mint on-chain (through port)
  const { tokenId, transactionHash } = await ports.wallet.mintNft({
    collectionAddress: input.collectionId,
    metadataUrl,
    to: await ports.wallet.getAddress()
  })
  
  // 4. Create entity
  const nft = createNft({
    collectionId: input.collectionId as CollectionId,
    tokenId,
    name: input.name,
    description: input.description,
    imageUrl,
    metadataUrl,
    creator: await ports.wallet.getAddress()
  })
  
  // 5. Apply business logic
  const listedNft = listNft(nft, input.price)
  
  // 6. Persist (through port)
  await ports.nftRepository.save(listedNft)
  
  return {
    nft: listedNft,
    transactionHash
  }
}
```

### Use Case Best Practices

::: details structure
```ts
// Always follow this structure:
export async function useCaseName(
  input: InputType,
  ports: PortDependencies
): Promise {
  // 1. Business validation
  // 2. Port interactions
  // 3. Entity operations
  // 4. Persistence through ports
  return result
}
```
:::

## 4. Ports - Interface Contracts

Ports define what your domain needs from the outside world.

```typescript
// domains/nft-marketplace/ports/NftRepositoryPort.ts
import type { Nft } from '../entities/Nft'
import type { NftId, CollectionId } from '../value-objects'
import type { EthAddress } from '../value-objects/EthAddress'

export type NftRepositoryPort = {
  // CRUD operations
  save(nft: Nft): Promise<void>
  findById(id: NftId): Promise<Nft | null>
  
  // Business queries
  findByCollection(collectionId: CollectionId): Promise<Nft[]>
  findByOwner(owner: EthAddress): Promise<Nft[]>
  findListed(): Promise<Nft[]>
  
  // Market operations
  findActiveListings(): Promise<Nft[]>
  updateOwner(nftId: NftId, newOwner: EthAddress): Promise<void>
  delistNft(nftId: NftId): Promise<void>
}

// domains/nft-marketplace/ports/MetadataStoragePort.ts
export type MetadataStoragePort = {
  uploadFile(file: File | Buffer): Promise<string>
  uploadJson(data: any): Promise<string>
  getFile(cid: string): Promise<Buffer>
}

// domains/nft-marketplace/ports/WalletPort.ts
export type WalletPort = {
  getAddress(): Promise<EthAddress>
  mintNft(params: {
    collectionAddress: string
    metadataUrl: string
    to: EthAddress
  }): Promise<{ tokenId: bigint; transactionHash: string }>
  transferNft(params: {
    collectionAddress: string
    tokenId: bigint
    to: EthAddress
  }): Promise<{ transactionHash: string }>
  signMessage(message: string): Promise<string>
}
```

## Testing Your Domain

Since your domain is pure, testing is simple and fast.

```typescript
// tests/nft-marketplace/createAndListNft.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createAndListNft } from '@domains/nft-marketplace/use-cases/createAndListNft'
import { createMockNftRepository } from '@tests/mocks/NftRepository.mock'
import { createMockMetadataStorage } from '@tests/mocks/MetadataStorage.mock'
import { createMockWallet } from '@tests/mocks/Wallet.mock'

describe('createAndListNft', () => {
  const mockPorts = {
    nftRepository: createMockNftRepository(),
    metadataStorage: createMockMetadataStorage(),
    wallet: createMockWallet()
  }
  
  it('should create and list an NFT with valid input', async () => {
    const input = {
      collectionId: '0x123...',
      name: 'Test NFT',
      description: 'A test NFT',
      image: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      price: parseEther('1')
    }
    
    const result = await createAndListNft(input, mockPorts)
    
    expect(result.nft.name).toBe('Test NFT')
    expect(result.nft.isListed).toBe(true)
    expect(result.nft.price).toBe(parseEther('1'))
    expect(mockPorts.nftRepository.save).toHaveBeenCalledWith(result.nft)
  })
  
  it('should throw error with invalid name', async () => {
    const input = {
      collectionId: '0x123...',
      name: 'AB', // Too short
      description: 'A test NFT',
      image: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      price: parseEther('1')
    }
    
    await expect(createAndListNft(input, mockPorts))
      .rejects.toThrow('NFT name must be at least 3 characters')
  })
})
```

::: tip
**Testing benefits:** No DB to setup, no blockchain to mock, no HTTP servers. Just pure, fast unit tests.
:::

## Domain Dependencies

Sometimes domains need to interact with each other. Here's how to do it cleanly:

```typescript
// domains/nft-marketplace/use-cases/buyNft.ts
export async function buyNft(
  input: BuyNftInput,
  ports: {
    nftRepository: NftRepositoryPort
    wallet: WalletPort
    // Use case dependency - not port!
    userService: {
      getUserBalance(userId: string): Promise<bigint>
    }
  }
): Promise<BuyNftOutput> {
  const nft = await ports.nftRepository.findById(input.nftId)
  if (!nft || !nft.isListed) {
    throw new Error('NFT not available for sale')
  }
  
  const userBalance = await ports.userService.getUserBalance(input.buyerId)
  if (userBalance < nft.price) {
    throw new Error('Insufficient balance')
  }
  
  // ... rest of the logic
}
```

::: warning
**Important:** Depend on use cases, not on other domains directly. This maintains clean boundaries.
:::

## Common Patterns

- **Factory Pattern** — Always use factory functions to create entities. Never export constructors.
- **Immutable Updates** — Always return new instances. Never modify existing objects.
- **Validation First** — Validate all input at the beginning of use cases.
- **Port Abstraction** — Never assume how a port works. Trust the contract.

## Summary

The domain is where your business shines:
- ✅ Pure logic without infrastructure
- ✅ Easy and fast to test
- ✅ Reusable across different implementations
- ✅ Clear business intent

::: tip
**Remember:** If your domain imports anything outside of `domains/`, you're breaking the architecture.
:::
