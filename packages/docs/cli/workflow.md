---
title: Circular Workflow
description: Learn how to generate code starting from any building block
icon: loop
---

# The Circular Workflow

One of Kompo's most powerful features is its **Circular Workflow**. Unlike rigid code generators that force a specific order of operations, Kompo allows you to start building from whichever concept is clearest to you at the moment.

Whether you prefer thinking about **Data** (Entities), **Behavior** (Use Cases), or **Contracts** (Ports), the CLI adapts and helps you fill in the gaps.

## Start Anywhere

### 1. Behavior First (Use Case)
*Scenario: You know what the system needs to DO.*

```bash
kompo add use-case register-user --domain auth
```

The CLI will ask: "Does this use case need to persist data?".
If you say **Yes**, it will offer to:
1.  Create the `User` **Entity**.
2.  Create the `UserRepository` **Port**.
3.  Add the `UserRepository` as a dependency to your Use Case.

### 2. Data First (Entity)
*Scenario: You know the shape of your data.*

```bash
kompo add entity Product --domain inventory
```

The CLI will generate the Entity. It might then ask: "Do you want to create CRUD operations for this entity?"
If **Yes**, it will generate:
1.  A `ProductRepository` **Port**.
2.  **Use Cases** for Create, Read, Update, Delete.

### 3. Contract First (Port)
*Scenario: You are defining an integration with an external system.*

```bash
kompo add port payment-gateway --domain payment
```

The CLI detects you created a Port. It asks: "Do you want to implement this port now?"
If **Yes**, it triggers the **Adapter** selection flow (e.g., Stripe, Paypal, or Mock).

### 4. Implementation First (Adapter)
*Scenario: You need to install a specific tool.*

```bash
kompo add adapter --file path/to/port
```
*(Coming soon: intuitive adapter addition)*

## Automatic Inference

Kompo connects the dots. If you create a Use Case that requires a Port that doesn't exist, Kompo suggests creating it. If you create a Port that needs a data model, it suggests creating the Entity.

This **Circular Engine** ensures that you never hit a dead end. You can enter the loop at any point, and Kompo will guide you until the feature is complete.
