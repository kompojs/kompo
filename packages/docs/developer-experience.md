---
title: Developer Experience
description: Learn the Kompo development workflow and patterns
icon: code
---

# Developer Experience

The Kompo DX (Developer Experience) is designed around hexagonal architecture principles. This guide shows you how to build Web3 applications the Kompo way.

## Core Concepts

### Hexagonal Architecture

```
┌─────────────────────────────────────┐
│           Application Layer          │
│  (Use Cases, Application Services)  │
├─────────────────────────────────────┤
│            Domain Layer             │
│     (Entities, Value Objects)       │
├─────────────────────────────────────┤
│         Infrastructure Layer         │
│  (Adapters, External Dependencies)  │
└─────────────────────────────────────┘
```

- **Domain**: Pure business logic, no external dependencies
- **Ports**: Interfaces defining contracts
- **Adapters**: Concrete implementations of ports
- **Use Cases**: Application-specific business rules

## Workflow Example: Building a Web3 Auth System

Let's build a complete authentication system step by step.

### 1. Create the Domain

```bash
# Create the auth domain
pnpm kompo add domain auth
```

### 2. Define Entities

```bash
# Add User entity to auth domain
pnpm kompo add entity User --domain auth
```

**Generated: `domains/auth/entities/User.ts`**
```typescript
import { UserId, createUserId } from '../value-objects/UserId'

export type User = {
  id: UserId
  walletAddress: string
  email?: string
  nonce: string
}

export function createUser(walletAddress: string, email?: string): User {
  return {
    id: createUserId(),
    walletAddress: walletAddress.toLowerCase(),
    email,
    nonce: generateNonce()
  }
}
```

### 3. Define Ports

```bash
# Add repository port
pnpm kompo add port UserRepositoryPort --domain auth

# Add crypto service port
pnpm kompo add port CryptoServicePort --domain auth
```

**Generated: `domains/auth/ports/UserRepositoryPort.ts`**
```typescript
import { User, UserId } from '../entities/User'

export interface UserRepositoryPort {
  save(user: User): Promise<void>
  findById(id: UserId): Promise<User | null>
  findByWalletAddress(address: string): Promise<User | null>
  update(user: User): Promise<void>
}

export interface CryptoServicePort {
  verifySignature(message: string, signature: string, address: string): boolean
  generateNonce(): string
}
```

### 4. Implement Use Cases

```bash
# Add sign in use case
pnpm kompo add use-case SignInWithWallet --domain auth

# Add register use case
pnpm kompo add use-case RegisterWithWallet --domain auth
```

**Generated: `domains/auth/use-cases/SignInWithWallet.ts`**
```typescript
import { User } from '../entities/User'
import { UserRepositoryPort, CryptoServicePort } from '../ports'

export interface SignInWithWalletInput {
  message: string
  signature: string
  walletAddress: string
}

export interface SignInWithWalletOutput {
  user: User
  token: string
}

export async function signInWithWallet(
  input: SignInWithWalletInput,
  { userRepository, cryptoService }: {
    userRepository: UserRepositoryPort
    cryptoService: CryptoServicePort
  }
): Promise<SignInWithWalletOutput> {
  // Verify signature
  const isValid = cryptoService.verifySignature(
    input.message,
    input.signature,
    input.walletAddress
  )
  
  if (!isValid) {
    throw new Error('Invalid signature')
  }
  
  // Find or create user
  let user = await userRepository.findByWalletAddress(input.walletAddress)
  
  if (!user) {
    user = createUser(input.walletAddress)
    await userRepository.save(user)
  }
  
  // Generate JWT token
  const token = generateJWT(user)
  
  return { user, token }
}
```

### 5. Create Adapters

```bash
# Add database adapter
pnpm kompo add adapter UserRepositoryAdapter --port UserRepositoryPort

# Add crypto adapter
pnpm kompo add adapter CryptoServiceAdapter --port CryptoServicePort
```

**Generated: `adapters/UserRepositoryAdapter.ts`**
```typescript
import { UserRepositoryPort } from '../../domains/auth/ports/UserRepositoryPort'
import { User, UserId } from '../../domains/auth/entities/User'
import { db } from '../database'

export class UserRepositoryAdapter implements UserRepositoryPort {
  async save(user: User): Promise<void> {
    await db.insertInto('users').values(user).execute()
  }
  
  async findById(id: UserId): Promise<User | null> {
    return await db
      .selectFrom('users')
      .where('id', '=', id)
      .executeTakeFirst()
  }
  
  async findByWalletAddress(address: string): Promise<User | null> {
    return await db
      .selectFrom('users')
      .where('walletAddress', '=', address.toLowerCase())
      .executeTakeFirst()
  }
  
  async update(user: User): Promise<void> {
    await db
      .updateTable('users')
      .set(user)
      .where('id', '=', user.id)
      .execute()
  }
}
```

### 6. Wire Everything Together

```bash
# Generate composition root
pnpm kompo wire auth --app apps/web
```

**Generated: `apps/web/src/composition/auth.ts`**
```typescript
import { UserRepositoryAdapter } from '../../../adapters/UserRepositoryAdapter'
import { CryptoServiceAdapter } from '../../../adapters/CryptoServiceAdapter'
import { signInWithWallet, registerWithWallet } from '../../../domains/auth/use-cases'

// Create adapter instances
const userRepository = new UserRepositoryAdapter()
const cryptoService = new CryptoServiceAdapter()

// Export composed functions
export const auth = {
  signIn: (input: SignInWithWalletInput) => 
    signInWithWallet(input, { userRepository, cryptoService }),
    
  register: (input: RegisterWithWalletInput) => 
    registerWithWallet(input, { userRepository, cryptoService })
}
```

## Testing the Domain

One of the key benefits of hexagonal architecture is testability:

```typescript
// tests/domains/auth/signInWithWallet.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { signInWithWallet } from '../../../domains/auth/use-cases/SignInWithWallet'
import { mockUserRepository, mockCryptoService } from './mocks'

describe('signInWithWallet', () => {
  beforeEach(() => {
    mockUserRepository.clear()
    mockCryptoService.clear()
  })
  
  it('should sign in user with valid signature', async () => {
    // Arrange
    mockCryptoService.verifySignature.mockReturnValue(true)
    mockUserRepository.findByWalletAddress.mockResolvedValue(null)
    
    // Act
    const result = await signInWithWallet(
      {
        message: 'Sign in to Kompo',
        signature: '0x123...',
        walletAddress: '0xabc...'
      },
      { userRepository: mockUserRepository, cryptoService: mockCryptoService }
    )
    
    // Assert
    expect(result.user.walletAddress).toBe('0xabc...')
    expect(result.token).toBeDefined()
    expect(mockUserRepository.save).toHaveBeenCalled()
  })
  
  it('should reject invalid signature', async () => {
    // Arrange
    mockCryptoService.verifySignature.mockReturnValue(false)
    
    // Act & Assert
    await expect(
      signInWithWallet(
        {
          message: 'Sign in to Kompo',
          signature: '0xinvalid',
          walletAddress: '0xabc...'
        },
        { userRepository: mockUserRepository, cryptoService: mockCryptoService }
      )
    ).rejects.toThrow('Invalid signature')
  })
})
```

## Best Practices

### 1. Keep Domains Pure

```typescript
// ✅ Good - Pure domain logic
export function transferToken(from: Wallet, to: Wallet, amount: bigint): TransferResult {
  if (from.balance < amount) {
    return { success: false, error: 'Insufficient balance' }
  }
  
  from.balance -= amount
  to.balance += amount
  
  return { success: true, from, to }
}

// ❌ Bad - Domain depends on external infrastructure
export async function transferToken(
  from: string, 
  to: string, 
  amount: bigint
): Promise<TransferResult> {
  const fromWallet = await blockchain.getWallet(from)
  // ... mixing concerns
}
```

### 2. Use Specific Port Types

```typescript
// ✅ Good - Specific, typed ports
export interface TokenRepositoryPort {
  save(token: Token): Promise<void>
  findByAddress(address: string): Promise<Token | null>
}

export interface BlockchainPort {
  getBalance(address: string): Promise<bigint>
  transfer(from: string, to: string, amount: bigint): Promise<string>
}

// ❌ Bad - Generic repository
export interface Repository<T> {
  save(entity: T): Promise<void>
  findById(id: string): Promise<T | null>
}
```

### 3. Handle Errors at Use Case Level

```typescript
export async function executeTransfer(
  input: TransferInput,
  { tokenRepo, blockchain }: Ports
): Promise<TransferResult> {
  try {
    // Business logic
    const result = transferToken(input.from, input.to, input.amount)
    
    // Infrastructure calls
    await blockchain.transfer(input.from.address, input.to.address, input.amount)
    await tokenRepo.save(result.from)
    await tokenRepo.save(result.to)
    
    return { success: true, transactionHash: result.hash }
  } catch (error) {
    // Handle specific errors
    if (error instanceof InsufficientBalanceError) {
      return { success: false, error: 'Insufficient balance' }
    }
    throw error
  }
}
```

## Common Patterns

### 1. Domain Events

```typescript
// domains/trading/entities/Trade.ts
export type Trade = {
  id: TradeId
  maker: string
  taker: string
  token: string
  amount: bigint
  price: bigint
  status: 'pending' | 'executed' | 'cancelled'
  events: TradeEvent[]
}

export type TradeEvent = 
  | { type: 'TradeCreated'; trade: Trade }
  | { type: 'TradeExecuted'; trade: Trade; hash: string }
  | { type: 'TradeCancelled'; trade: Trade; reason: string }

export function executeTrade(trade: Trade): Trade {
  trade.events.push({ type: 'TradeCreated', trade })
  // ... execute logic
  trade.events.push({ type: 'TradeExecuted', trade, hash: '0x123' })
  return trade
}
```

### 2. Value Objects with Validation

```typescript
// domains/shared/value-objects/EmailAddress.ts
export class EmailAddress {
  private constructor(private readonly value: string) {}
  
  static create(email: string): EmailAddress {
    if (!this.isValid(email)) {
      throw new Error('Invalid email address')
    }
    return new EmailAddress(email.toLowerCase())
  }
  
  get value(): string {
    return this.value
  }
  
  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
}
```

### 3. Factory Functions

```typescript
// domains/nft/entities/NFT.ts
export function createNFT(input: {
  name: string
  description: string
  imageUrl: string
  creator: string
}): NFT {
  return {
    id: generateNFTId(),
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl,
    creator: input.creator.toLowerCase(),
    owner: input.creator.toLowerCase(),
    createdAt: new Date(),
    status: 'minted'
  }
}
```

## Next Steps

- [Build Your First App](/your-first-domain)
- [Understanding Ports & Adapters](/understand/ports-adapters)
- [Testing Strategies](/testing)
- [API Reference](/api)
