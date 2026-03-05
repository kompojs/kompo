---
title: Composition Root
description: Assembling your application with Kompo
---


# Composition Root - Assembling Your Application

The Composition Root is where everything comes together. It's the place where you connect your pure domains to their adapters, creating a fully functional application.

## What is the Composition Root?

The Composition Root is a specific location in your application where you:
1. Create adapters
2. Connect them to ports
3. Export composed services for your UI/framework to use

::: tip
**Key principle:** The Composition Root is the ONLY place where you should know about concrete implementations. Your domains and UI remain pure.
:::

## Basic Composition Structure

```typescript
// apps/web/src/composition/nft-marketplace.composition.ts
import { createNft } from '@domains/nft-marketplace/use-cases/createNft'
import { listNft } from '@domains/nft-marketplace/use-cases/listNft'
import { buyNft } from '@domains/nft-marketplace/use-cases/buyNft'
import { createDrizzleNftRepositoryAdapter } from '@/adapters/orm/drizzleNftRepository.adapter'
import { createIpfsStorageAdapter } from '@/adapters/ipfs/ipfsStorage.adapter'
import { createWagmiWalletAdapter } from '@/adapters/wallet/wagmiWallet.adapter'
import { db } from '@/lib/db'

// 1. Create adapters
const nftRepository = createDrizzleNftRepositoryAdapter(db)
const metadataStorage = createIpfsStorageAdapter()
const wallet = createWagmiWalletAdapter()

// 2. Compose services
export const nftMarketplaceService = {
  createNft: (input: CreateNftInput) => 
    createNft(input, { nftRepository, metadataStorage, wallet }),
    
  listNft: (input: ListNftInput) => 
    listNft(input, { nftRepository }),
    
  buyNft: (input: BuyNftInput) => 
    buyNft(input, { nftRepository, wallet })
}
```

## Using the Composition in Your App

### Next.js Example

```tsx
// apps/web/src/app/page.tsx
'use client'

import { nftMarketplaceService } from '@/composition/nft-marketplace.composition'

export default function HomePage() {
  const handleCreateNft = async () => {
    try {
      const result = await nftMarketplaceService.createNft({
        name: 'My NFT',
        description: 'Created with Kompo!',
        image: fileInput.files[0]
      })
      console.log('NFT created:', result)
    } catch (error) {
      console.error('Failed to create NFT:', error)
    }
  }
  
  return (
    <div>
      <h1>NFT Marketplace</h1>
      <button onClick={handleCreateNft}>Create NFT</button>
    </div>
  )
}
```

## Advanced Composition Patterns

### 1. Factory Pattern for Adapters

```typescript
// shared/adapters/factory.ts
export class AdapterFactory {
  private static cache = new Map<string, any>()
  
  static createOrmAdapter(type: 'drizzle' | 'prisma', config: any) {
    const key = `orm-${type}`
    
    if (!this.cache.has(key)) {
      switch (type) {
        case 'drizzle':
          this.cache.set(key, createDrizzleAdapter(config))
          break
        case 'prisma':
          this.cache.set(key, createPrismaAdapter(config))
          break
        default:
          throw new Error(`Unknown ORM type: ${type}`)
      }
    }
    
    return this.cache.get(key)
  }
  
  static createWalletAdapter(type: 'wagmi' | 'privy', config: any) {
    // Similar factory pattern
  }
}

// In composition
const nftRepository = AdapterFactory.createOrmAdapter('drizzle', { db })
const wallet = AdapterFactory.createWalletAdapter('wagmi', {})
```

### 2. Lazy Loading

```typescript
// apps/web/src/composition/lazy.composition.ts
const getNftMarketplaceService = () => {
  if (!cachedService) {
    cachedService = createNftMarketplaceService()
  }
  return cachedService
}

let cachedService: NftMarketplaceService | null = null

function createNftMarketplaceService() {
  // Create adapters only when needed
  const nftRepository = createDrizzleNftRepositoryAdapter(db)
  const metadataStorage = createIpfsStorageAdapter()
  const wallet = createWagmiWalletAdapter()
  
  return {
    createNft: (input: CreateNftInput) => 
      createNft(input, { nftRepository, metadataStorage, wallet }),
    // ...
  }
}

export { getNftMarketplaceService }
```

### 3. Scoped Composition

```typescript
// apps/web/src/composition/scoped.composition.ts
export function createScopedComposition(userId: string) {
  // Create user-specific adapters
  const userDb = db.withUserScope(userId)
  const nftRepository = createDrizzleNftRepositoryAdapter(userDb)
  const wallet = createUserWalletAdapter(userId)
  
  return {
    nftService: {
      createNft: (input: CreateNftInput) => 
        createNft(input, { nftRepository, wallet }),
      getUserNfts: () => 
        nftRepository.findByOwner(userId)
    }
  }
}

// Usage in component
export default function UserProfile({ userId }: { userId: string }) {
  const composition = useMemo(() => 
    createScopedComposition(userId), [userId]
  )
  
  // ...
}
```

## Testing with Composition

### Unit Tests

```typescript
// tests/composition/nftMarketplace.composition.test.ts
describe('NFT Marketplace Composition', () => {
  it('should compose service correctly', () => {
    // Arrange
    const mockDb = createMockDb()
    const mockStorage = createMockStorage()
    const mockWallet = createMockWallet()
    
    // Act
    const service = createNftMarketplaceService({
      db: mockDb,
      storage: mockStorage,
      wallet: mockWallet
    })
    
    // Assert
    expect(service.createNft).toBeDefined()
    expect(service.listNft).toBeDefined()
  })
})
```

### Integration Tests

```typescript
// tests/integration/fullFlow.test.ts
describe('Full NFT Flow', () => {
  it('should create and list NFT end-to-end', async () => {
    // Use real composition but test database
    const testDb = createTestDb()
    const service = createNftMarketplaceService({ db: testDb })
    
    const nft = await service.createNft({
      name: 'Test NFT',
      description: 'Test',
      image: testImageFile
    })
    
    const listed = await service.listNft({
      nftId: nft.id,
      price: parseEther('1')
    })
    
    expect(listed.isListed).toBe(true)
  })
})
```

## Composition Best Practices

- **Single Responsibility** — Each composition file should handle one domain or feature area.
- **Dependency Injection** — Pass dependencies as parameters, not imported directly.
- **Environment Aware** — Use different compositions for different environments.
- **Testable Design** — Make it easy to inject mocks for testing.

## Common Pitfalls

::: warning ❌ Avoid:
- Creating adapters inside use cases or entities

    - Importing concrete implementations in your UI

    - Putting business logic in the composition

    - Making the composition too complex
:::

::: tip ✅ Do:
- Keep composition simple and declarative

    - Use factories for complex adapter creation

    - Group related compositions together

    - Document your composition structure
:::

## Summary

The Composition Root is your application's assembly line:
- ✅ Clean separation between pure code and infrastructure
- ✅ Central place for wiring dependencies
- ✅ Easy to test and maintain
- ✅ Flexible for different environments

::: tip
**Remember:** Keep your composition thin. It should only wire things together, not contain business logic.
:::
