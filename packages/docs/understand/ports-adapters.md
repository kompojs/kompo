---
title: Ports & Adapters
description: Connecter votre domaine au monde extérieur
---


# Ports & Adapters - L'Infrastructure Branchée

Les Ports et Adapters sont la magie de l'architecture hexagonale : ils permettent à votre domaine de communiquer avec le monde extérieur sans jamais y être couplé.

## Le Contrat : Les Ports

Un Port est une interface TypeScript qui définit **ce dont votre domaine a besoin**, sans jamais dire **comment** cela sera implémenté.

```typescript
// domains/user-management/ports/UserRepositoryPort.ts
import type { User } from '../entities/User'
import type { UserId } from '../value-objects/UserId'

export type UserRepositoryPort = {
  // Opérations CRUD
  save(user: User): Promise<void>
  findById(id: UserId): Promise<User | null>
  findAll(): Promise<User[]>
  
  // Queries spécifiques au domaine
  findByEmail(email: string): Promise<User | null>
  findActiveUsers(): Promise<User[]>
  
  // Métadonnées
  count(): Promise<number>
  exists(id: UserId): Promise<boolean>
}
```

### Types de Ports courants

| Type | Description | Exemple de méthodes |
|------|-------------|-------------------|
| **Repository** | Persistance des données | `save()`, `findById()`, `delete()` |
| **Gateway** | Communication externe | `processPayment()`, `sendNotification()` |
| **Publisher** | Publication d'événements | `publish()`, `publishBatch()` |
| **Provider** | Service externe | `uploadFile()`, `generateToken()` |

## L'Implémentation : Les Adapters

Un Adapter réalise le contrat d'un Port avec une technologie spécifique. Il est **toujours en dehors du domaine**.

```typescript
// shared/adapters/orm/drizzleUserRepository.adapter.ts
import type { UserRepositoryPort } from '@/domains/user-management/ports/UserRepositoryPort'
import type { User } from '@/domains/user-management/entities/User'
import { users, type UserSchema } from '@/shared/adapters/orm/schema'
import { eq, and } from 'drizzle-orm'

export function createDrizzleUserRepositoryAdapter(db: DrizzleDB): UserRepositoryPort {
  return {
    async save(user: User): Promise<void> {
      // Mapping du domaine vers le schéma BDD
      const userRecord: UserSchema = {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: new Date()
      }
      
      await db.insert(users).values(userRecord)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userRecord.email,
            name: userRecord.name,
            isActive: userRecord.isActive,
            updatedAt: userRecord.updatedAt
          }
        })
    },
    
    async findById(id: UserId): Promise<User | null> {
      const records = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1)
      
      const record = records[0]
      if (!record) return null
      
      // Mapping du schéma BDD vers le domaine
      return {
        id: record.id,
        email: record.email,
        name: record.name,
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    },
    
    async findByEmail(email: string): Promise<User | null> {
      const records = await db
        .select()
        .from(users)
    },
    async findListed() {
      return await db.select().from(nfts).where(eq(nfts.isListed, true))
    }
  }
}
```

## Kompo Capabilities

A **capability** is a port + its available adapters. Kompo provides ready-to-use capabilities for common needs.

::: details orm
ORM Capability
    Persist your data with various databases:
    

      - Drizzle + PostgreSQL (recommended)

      - Drizzle + MySQL

      - Prisma + PostgreSQL

      - TypeORM + PostgreSQL

    

    ```ts
// Port
export type RepositoryPort&lt;T&gt; = {
  save(entity: T): Promise&lt;void&gt;
  findById(id: string): Promise&lt;T | null&gt;
  // ...
}

// Add with CLI
kompo add orm
```
:::
  
  
## Creating Custom Ports

Sometimes you need capabilities specific to your business. Here's how to create them:

### 1. Define the Port

```typescript
// domains/payment/ports/PaymentProcessorPort.ts
export type PaymentProcessorPort = {
  charge(params: {
    amount: bigint
    currency: string
    source: string
  }): Promise<{
    id: string
    status: 'succeeded' | 'failed'
    amount: bigint
  }>
  
  refund(paymentId: string): Promise<boolean>
  
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>
}
```

### 2. Create the Adapter

```typescript
// shared/adapters/stripe/stripePaymentProcessor.adapter.ts
import Stripe from 'stripe'
import type { PaymentProcessorPort } from '@domains/payment/ports/PaymentProcessorPort'

export function createStripePaymentProcessorAdapter(apiKey: string): PaymentProcessorPort {
  const stripe = new Stripe(apiKey)
  
  return {
    async charge(params) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(params.amount),
        currency: params.currency.toLowerCase(),
        payment_method: params.source,
        confirm: true
      })
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed',
        amount: BigInt(paymentIntent.amount)
      }
    },
    
    async refund(paymentId: string) {
      const refund = await stripe.refunds.create({
        payment_intent: paymentId
      })
      
      return refund.status === 'succeeded'
    },
    
    async getPaymentStatus(paymentId: string) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId)
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status as PaymentStatus,
        amount: BigInt(paymentIntent.amount)
      }
    }
  }
}
```

### 3. Use in Your Domain

```typescript
// domains/payment/use-cases/processPayment.ts
export async function processPayment(
  input: ProcessPaymentInput,
  ports: {
    paymentProcessor: PaymentProcessorPort
    orderRepository: OrderRepositoryPort
  }
): Promise<ProcessPaymentOutput> {
  const order = await ports.orderRepository.findById(input.orderId)
  if (!order) {
    throw new Error('Order not found')
  }
  
  // Process payment through the port
  const payment = await ports.paymentProcessor.charge({
    amount: order.total,
    currency: order.currency,
    source: input.paymentMethodId
  })
  
  if (payment.status !== 'succeeded') {
    throw new Error('Payment failed')
  }
  
  // Update order
  const updatedOrder = markOrderAsPaid(order, payment.id)
  await ports.orderRepository.save(updatedOrder)
  
  return {
    order: updatedOrder,
    paymentId: payment.id
  }
}
```

## Port Best Practices

- **Be Specific** — Ports should be specific to your domain needs, not generic CRUD interfaces.
- **Return Domain Types** — Always return domain types from ports, not raw database/API responses.
- **Async by Default** — All port methods should be async, even if some adapters are synchronous.
- **No Implementation Details** — Ports should never expose implementation details (like SQL queries or HTTP methods).

## Adapter Best Practices

::: tip ✅ Do:
- Handle all technical concerns (errors, retries, logging)

    - Map between technical and domain types

    - Follow the port contract exactly

    - Be testable in isolation
:::

::: warning ❌ Don't:
- Expose technical details to the domain

    - Add business logic in adapters

    - Modify the port interface

    - Throw framework-specific errors
:::

## Testing Ports and Adapters

### Testing with Mocks

```typescript
// tests/payment/processPayment.test.ts
describe('processPayment', () => {
  it('should process payment successfully', async () => {
    // Arrange
    const mockPaymentProcessor: PaymentProcessorPort = {
      charge: vi.fn().mockResolvedValue({
        id: 'pay_123',
        status: 'succeeded',
        amount: parseEther('1')
      }),
      refund: vi.fn(),
      getPaymentStatus: vi.fn()
    }
    
    const mockOrderRepository: OrderRepositoryPort = {
      findById: vi.fn().mockResolvedValue(mockOrder),
      save: vi.fn()
    }
    
    // Act
    const result = await processPayment(
      { orderId: 'order-123', paymentMethodId: 'pm_123' },
      { paymentProcessor: mockPaymentProcessor, orderRepository: mockOrderRepository }
    )
    
    // Assert
    expect(result.paymentId).toBe('pay_123')
    expect(mockPaymentProcessor.charge).toHaveBeenCalledWith({
      amount: parseEther('1'),
      currency: 'eth',
      source: 'pm_123'
    })
  })
})
```

### Integration Testing Adapters

```typescript
// tests/adapters/stripePaymentProcessor.integration.test.ts
describe('StripePaymentProcessorAdapter', () => {
  const adapter = createStripePaymentProcessorAdapter(process.env.STRIPE_TEST_KEY!)
  
  it('should charge a real payment in test mode', async () => {
    const result = await adapter.charge({
      amount: parseEther('0.01'),
      currency: 'USD',
      source: 'pm_card_visa'
    })
    
    expect(result.status).toBe('succeeded')
    expect(result.id).toBeDefined()
  })
})
```

## Port Naming Conventions

- **Repository ports**: `XxxRepositoryPort`
- **Service ports**: `XxxServicePort`
- **Gateway ports**: `XxxGatewayPort`
- **Publisher ports**: `XxxPublisherPort`
- **Processor ports**: `XxxProcessorPort`

## Advanced Patterns

### Multiple Adapters per Port

```typescript
// In composition root
const primaryDb = createDrizzleNftRepositoryAdapter(primaryDb)
const cacheDb = createDrizzleNftRepositoryAdapter(cacheDb)

// Chain adapters for caching
const cachedRepository = createCachedNftRepositoryAdapter(
  primaryDb,
  cacheDb
)
```

### Composite Ports

```typescript
// domains/notification/ports/NotificationPort.ts
export type NotificationPort = {
  sendEmail(params: EmailParams): Promise<void>
  sendPush(params: PushParams): Promise<void>
  sendSms(params: SmsParams): Promise<void>
}

// Adapter can implement multiple services
export function createMultiChannelNotificationAdapter(
  email: EmailService,
  push: PushService,
  sms: SmsService
): NotificationPort {
  return {
    async sendEmail(params) {
      await email.send(params)
    },
    async sendPush(params) {
      await push.send(params)
    },
    async sendSms(params) {
      await sms.send(params)
    }
  }
}
```

## Summary

Ports and adapters give you:
- ✅ Clean separation between business and infrastructure
- ✅ Ability to swap implementations without changing business logic
- ✅ Testable domains with simple mocks
- ✅ Clear contracts for external dependencies

::: tip
**Remember:** Ports live in your domain, adapters live outside. Never cross this boundary!
:::
