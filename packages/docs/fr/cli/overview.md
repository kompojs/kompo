---
title: CLI - Vue d'ensemble
description: Maîtrisez toutes les commandes Kompo
---

# Kompo CLI - Votre Super-Pouvoir

La CLI Kompo est votre assistant pour générer, assembler et maintenir votre architecture hexagonale. Elle transforme des heures de plomberie en quelques secondes.

## Installation

```bash
# Depuis votre monorepo Kompo
pnpm install @kompo/cli

# La commande est disponible comme :
pnpm kompo [command]

# Ou avec npm :
npx kompo [command]
```

::: tip
**Important :** La CLI Kompo s'exécute uniquement à la racine d'un monorepo Kompo. Elle n'est pas conçue pour être installée globalement.
:::

## Commandes Essentielles

### `kompo add app` - Ajouter une application

```bash
kompo add app <app-name> [options]
```

**Options :**
- `--template <name>` : Utiliser un template pré-défini
- `--org <name>` : Organisation pour les packages (default: user)

**Exemples :**
```bash
# Application basique
kompo add app my-web3-app

# Avec template NFT Marketplace
kompo add app my-nft-project --template nft-marketplace

# Pour une organisation
kompo add app enterprise-app --org mycompany
```

La CLI vous guidera pour choisir :
- Frontend : Next.js ou Vite+React
- Backend : API Routes, NestJS, Express, ou None
- Design : Tailwind CSS ou Shadcn/ui

### `kompo add domain` - Créer un domaine

```bash
kompo add domain <domain-name> [options]
```

**Flow interactif :**
1. Choix du use case (ou custom)
2. Sélection du port automatiquement suggéré
3. Confirmation de l'entité

**Exemples :**
```bash
# Flow interactif complet
kompo add domain user-management

# Skip la création d'entité
kompo add domain analytics --skip-entity
```

**Structure générée :**
```
domains/<domain>/
├── entities/
├── value-objects/
├── ports/
├── use-cases/
└── index.ts
```

### `kompo add entity` - Ajouter une entité

```bash
kompo add entity <EntityName> --domain <domain>
```

**Exemple :**
```bash
kompo add entity User --domain user-management
kompo add entity Order --domain e-commerce
```

### `kompo add use-case` - Ajouter un use case

```bash
kompo add use-case <use-case-name> --domain <domain>
```

### `kompo add port` - Définir un port

```bash
kompo add port  --domain <domain> --type <type>
```

## Capabilities - Brancher l'Infrastructure

### `kompo add orm` - Persistance des données

```bash
kompo add orm
```

### `kompo add wallet` - Connexion Web3

```bash
kompo add wallet
```

### `kompo add cache` - Mise en cache

```bash
kompo add cache
```

## Commandes de Gestion

### `kompo wire` - Générer la composition

```bash
kompo wire <domain> --app <app-name>
```

### `kompo generate` - Régénérer les fichiers

```bash
kompo generate [type]
```

### `kompo doctor` - Vérifier la configuration

```bash
kompo doctor
```

### `kompo doctor --fix` - Réparer automatiquement

```bash
kompo doctor --fix
```

## Templates

### `kompo add app --list-templates`

| Template | Description | Stack |
|----------|-------------|-------|
| `nft-marketplace` | Marketplace NFT complète | Next.js + Drizzle + Wagmi |
| `dao` | Plateforme de gouvernance | Next.js + Drizzle + Wallet |
| `token-detection` | Détection de tokens | Vite + Drizzle + Viem |
| `defi-swap` | DEX de swap de tokens | Next.js + NestJS + Wallet |

### Utiliser un template

```bash
kompo add app my-dapp --template nft-marketplace
```

## Référence Rapide

| Commande | Description | Exemple |
|----------|-------------|---------|
| `kompo add app` | Ajouter une application | `kompo add app my-app` |
| `kompo add domain` | Ajouter un domaine | `kompo add domain auth` |
| `kompo add orm` | Ajouter un ORM | `kompo add orm` |
| `kompo add wallet` | Ajouter wallet Web3 | `kompo add wallet` |
| `kompo wire` | Générer composition | `kompo wire auth --app web` |
| `kompo doctor` | Vérifier config | `kompo doctor` |
| `kompo generate` | Régénérer fichiers | `kompo generate` |

::: tip
**Pro Tip :** Utilisez `kompo --help` sur n'importe quelle commande pour voir toutes les options disponibles.
:::
