---
title: Build Overview
description: Complete guide to building your Web3 application with Kompo
---


# Build - Construct Your Web3 Application

Now you understand the concepts. Let's get practical! This guide will show you how to build a complete Web3 application with Kompo.

## The Development Journey

At Kompo, we adopt a **Use Case First** approach:

<Steps>
  <Step>Domain - Define the business scope</Step>
  <Step>Use Cases - Define the actions</Step>
  <Step>Ports - Declare the needs</Step>
  <Step>Entities - Model the objects</Step>
  <Step>Adapters - Plug the infrastructure</Step>
  <Step>Composition - Assemble everything</Step>
</Steps>

## Practical Project: NFT Marketplace

We will build a complete NFT marketplace with:
- NFT creation
- Listing for sale
- NFT purchasing
- Collection management

### Step 1: Create the Domain

```bash
kompo add domain nft-marketplace
```

The CLI will guide you:
- **Use Case**: `create-nft`
- **Port**: `nft-repository`
- **Entity**: `Nft`

### Step 2: Define the Use Cases

```bash
kompo add use-case list-nft --domain nft-marketplace
kompo add use-case buy-nft --domain nft-marketplace
kompo add use-case create-collection --domain nft-marketplace
```

### Step 3: Add Necessary Ports

```bash
kompo add port nft-collection-repository --domain nft-marketplace
kompo add port payment-processor --domain nft-marketplace
kompo add port metadata-storage --domain nft-marketplace
```

### Step 4: Model the Entities

```bash
kompo add entity Nft --domain nft-marketplace
kompo add entity NftCollection --domain nft-marketplace
kompo add entity MarketListing --domain nft-marketplace
```

### Step 5: Plug the Capabilities

```bash
kompo add orm          # For persistence
kompo add wallet       # For Web3 transactions
kompo add ipfs         # For metadata
kompo add payment      # For payments
```

## The Resulting Code

### Domain Entities

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

export function listNft(nft: Nft, price: bigint): Nft {
  return {
    ...nft,
    price,
    isListed: true,
    updatedAt: new Date()
  }
}

export function transferNft(nft: Nft, newOwner: EthAddress): Nft {
  return {
    ...nft,
    owner: newOwner,
    isListed: false,
    price: 0n,
    updatedAt: new Date()
  }
}
```

### Use Cases

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
  // 1. Upload image to IPFS
  const imageUrl = await ports.metadataStorage.uploadFile(input.image)
  
  // 2. Create metadata
  const metadata = {
    name: input.name,
    description: input.description,
    image: imageUrl,
    attributes: []
  }
  
  const metadataUrl = await ports.metadataStorage.uploadJson(metadata)
  
  // 3. Mint NFT on-chain
  const { tokenId, transactionHash } = await ports.wallet.mintNft({
    collectionAddress: input.collectionId,
    metadataUrl,
    to: await ports.wallet.getAddress()
  })
  
  // 4. Create NFT entity
  const nft = createNft({
    collectionId: input.collectionId as CollectionId,
    tokenId,
    name: input.name,
    description: input.description,
    imageUrl,
    metadataUrl,
    creator: await ports.wallet.getAddress()
  })
  
  // 5. List for sale
  const listedNft = listNft(nft, input.price)
  
  // 6. Persist
  await ports.nftRepository.save(listedNft)
  
  return {
    nft: listedNft,
    transactionHash
  }
}
```

### Ports

```typescript
// domains/nft-marketplace/ports/NftRepositoryPort.ts
import type { Nft } from '../entities/Nft'
import type { NftId, CollectionId } from '../value-objects'
import type { EthAddress } from '../value-objects/EthAddress'

export type NftRepositoryPort = {
  // CRUD
  save(nft: Nft): Promise<void>
  findById(id: NftId): Promise<Nft | null>
  
  // Queries
  findByCollection(collectionId: CollectionId): Promise<Nft[]>
  findByOwner(owner: EthAddress): Promise<Nft[]>
  findListed(): Promise<Nft[]>
  findListedByCollection(collectionId: CollectionId): Promise<Nft[]>
  
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

## Application Integration

### Composition

```typescript
// apps/web/src/composition/nft-marketplace.composition.ts
import { createAndListNft, buyNft, getUserNfts } from '@domains/nft-marketplace/use-cases'
import { createDrizzleNftRepositoryAdapter } from '@/shared/adapters/orm/drizzleNftRepository.adapter'
import { createPinataMetadataAdapter } from '@/shared/adapters/ipfs/pinataMetadata.adapter'
import { createWagmiWalletAdapter } from '@/shared/adapters/wallet/wagmiWallet.adapter'
import { db } from '@/shared/adapters/orm/db'

// Adapters
const nftRepository = createDrizzleNftRepositoryAdapter(db)
const metadataStorage = createPinataMetadataAdapter({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!
})
const wallet = createWagmiWalletAdapter()

// Services
export const nftMarketplaceService = {
  createAndList: (input: CreateAndListNftInput) =>
    createAndListNft(input, {
      nftRepository,
      metadataStorage,
      wallet
    }),
    
  buy: (input: BuyNftInput) =>
    buyNft(input, { nftRepository, wallet }),
    
  getUserNfts: (owner: EthAddress) =>
    getUserNfts(owner, { nftRepository })
}
```

### React Component

```typescript
// apps/web/src/components/CreateNftForm.tsx
'use client'

import { useState } from 'react'
import { useComposition } from '@/app/providers'
import { useWaitForTransaction } from 'wagmi'

export function CreateNftForm() {
  const { nftMarketplaceService } = useComposition()
  const [isCreating, setIsCreating] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreating(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const result = await nftMarketplaceService.createAndList({
        collectionId: formData.get('collectionId') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        image: formData.get('image') as File,
        price: BigInt(formData.get('price') as string)
      })
      
      // Wait for transaction confirmation
      await waitForTransaction({ hash: result.transactionHash as `0x${string}` })
      
      // Page refresh or redirect
      window.location.reload()
    } catch (error) {
      console.error('Failed to create NFT:', error)
    } finally {
      setIsCreating(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="NFT Name" required />
      <textarea name="description" placeholder="Description" required />
      <input type="file" name="image" accept="image/*" required />
      <input 
        type="number" 
        name="price" 
        placeholder="Price in ETH" 
        step="0.001"
        required 
      />
      <button type="submit" disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create & List NFT'}
      </button>
    </form>
  )
}
```

## Advanced Patterns

### Validation with Zod

```typescript
// domains/nft-marketplace/schemas/CreateNftSchema.ts
import { z } from 'zod'
import type { EthAddress } from '../value-objects/EthAddress'

export const CreateNftSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  image: z.instanceof(File).refine(
    file => file.size <= 10 * 1024 * 1024, // 10MB
    'Image must be less than 10MB'
  ),
  price: z.bigint().positive(),
  collectionId: z.string().refine(
    val => isValidEthAddress(val),
    'Invalid collection address'
  )
})

export type CreateNftInput = z.infer<typeof CreateNftSchema>

// In the use case:
export async function createAndListNft(
  input: CreateNftInput, // Automatically typed!
  ports: {
    nftRepository: NftRepositoryPort
    metadataStorage: MetadataStoragePort
    wallet: WalletPort
  }
): Promise<CreateAndListNftOutput> {
  // Zod already validated input!
  // ...
}
```

### Error Handling

```typescript
// shared/errors/index.ts
export class NftError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'NftError'
  }
}

export class InsufficientFundsError extends NftError {
  constructor(balance: bigint, price: bigint) {
    super(
      `Insufficient funds: ${balance} < ${price}`,
      'INSUFFICIENT_FUNDS',
      { balance, price }
    )
  }
}

// In the use case:
export async function buyNft(input: BuyNftInput, ports: Ports): Promise<BuyNftOutput> {
  const nft = await ports.nftRepository.findById(input.nftId)
  if (!nft) {
    throw new NftError('NFT not found', 'NFT_NOT_FOUND')
  }
  
  const balance = await ports.wallet.getBalance()
  if (balance < nft.price) {
    throw new InsufficientFundsError(balance, nft.price)
  }
  
  // ...
}
```

### Event Sourcing

```typescript
// domains/nft-marketplace/events/NftEvents.ts
export type NftEvent = 
  | { type: 'NftCreated'; data: { nft: Nft } }
  | { type: 'NftListed'; data: { nftId: NftId; price: bigint } }
  | { type: 'NftSold'; data: { nftId: NftId; from: EthAddress; to: EthAddress; price: bigint } }

// In the use case:
export async function buyNft(input: BuyNftInput, ports: Ports): Promise<BuyNftOutput> {
  // ... business logic ...
  
  // Emit event
  await ports.eventPublisher.publish({
    type: 'NftSold',
    data: {
      nftId: input.nftId,
      from: nft.owner,
      to: input.buyer,
      price: nft.price
    }
  })
}
```

## Complete Testing

```typescript
// tests/integration/nft-marketplace.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { createTestComposition } from '../composition/test-composition'

describe('NFT Marketplace Flow', () => {
  const composition = createTestComposition()
  
  it('should create, list, and buy NFT', async () => {
    // 1. Create NFT
    const { nft } = await composition.services.nftMarketplace.createAndList({
      collectionId: '0x123...',
      name: 'Test NFT',
      description: 'A test NFT',
      image: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      price: parseEther('1')
    })
    
    expect(nft.isListed).toBe(true)
    expect(nft.price).toBe(parseEther('1'))
    
    // 2. Buy NFT
    const result = await composition.services.nftMarketplace.buy({
      nftId: nft.id,
      buyer: '0x456...'
    })
    
    expect(result.transactionHash).toBeDefined()
    
    // 3. Verify final state
    const updatedNft = await composition.services.nftMarketplace.getNft(nft.id)
    expect(updatedNft.owner).toBe('0x456...')
    expect(updatedNft.isListed).toBe(false)
  })
})
```

## Best Practices

::: tip ✅ Build Guidelines:
- Always start with use cases, not technology

    - Use Zod for input validation

    - Handle business errors explicitly

    - Test your use cases without infrastructure

    - Use events to decouple side-effects
:::

## Next Steps

- [CLI Reference](/cli/overview) - Master all commands
- [Templates](/templates/overview) - Explore pre-built templates
- [Deploy](/deploy/overview) - Put your app in production
