---
title: CLI Overview
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

**Exemples :**
```bash
kompo add use-case authenticate-user --domain auth
kompo add use-case process-payment --domain payment
```

### `kompo add port` - Définir un port

```bash
kompo add port  --domain <domain> --type <type>
```

**Types disponibles :**
- `repository` : Pour la persistence
- `service` : Pour les services externes
- `gateway` : Pour la communication inter-systèmes
- `publisher` : Pour la publication d'événements

**Exemples :**
```bash
kompo add port user-repository --domain auth --type repository
kompo add port email-service --domain notifications --type service
```

## Capabilities - Brancher l'Infrastructure

### `kompo add orm` - Persistance des données

```bash
kompo add orm
```

**Choix disponibles :**
- Drizzle + PostgreSQL (recommandé)
- Prisma + PostgreSQL
- Drizzle + MySQL

**Génère :**
- Configuration de la base de données
- Schéma de base dans `shared/adapters/orm/schema.ts`
- Adapter générique `Repository<T>`
- Variables d'environnement
- Scripts de migration

### `kompo add wallet` - Connexion Web3

```bash
kompo add wallet
```

**Génère :**
- Provider Wagmi configuré
- Hooks React : `useWallet`, `useConnect`, `useSignMessage`
- Composant `ConnectButton`
- Port `WalletProvider` avec méthodes de base

### `kompo add cache` - Mise en cache

```bash
kompo add cache
```

**Options :**
- Redis (production)
- In-memory (développement)

**Génère :**
- Client Redis configuré
- Port `CacheProvider`
- Health checks

### `kompo add queue` - File d'attente

```bash
kompo add queue
```

**Génère :**
- Configuration BullMQ
- Workers de base
- Dashboard de monitoring
- Port `QueueProvider`

### `kompo add auth` - Authentification

```bash
kompo add auth
```

**Providers :**
- Privy (Web3-first)
- Clerk (traditionnel + Web3)
- Self-hosted (custom)

## Commandes de Gestion

### `kompo wire` - Générer la composition

```bash
kompo wire <domain> --app <app-name>
```

Génère le fichier de composition pour connecter un domaine à une app.

**Exemple :**
```bash
kompo wire user-management --app web
```

**Résultat :**
```typescript
// apps/web/src/composition/user-management.composition.ts
export const userService = {
  // Services pré-wirés avec les adapters
}
```

### `kompo generate` - Régénérer les fichiers

```bash
kompo generate [type]
```

**Types :**
- `providers` : Régénère les index des providers React
- `demos` : Régénère les composants de démo
- `composition` : Régénère tous les fichiers de composition

::: warning
Utilisez kompo generate après avoir manuellement modifié les fichiers générés avec l'en-tête @generated.
:::

### `kompo doctor` - Vérifier la configuration

```bash
kompo doctor
```

Vérifie :
- Variables d'environnement présentes
- Connexion à la base de données
- Migrations appliquées
- Dépendances installées
- Configuration cohérente

### `kompo doctor --fix` - Réparer automatiquement

```bash
kompo doctor --fix
```

Tente de réparer les problèmes courants :
- Crée les variables manquantes
- Applique les migrations en attente
- Installe les dépendances manquantes

## Templates

### `kompo add app --list-templates`

Liste tous les templates disponibles :

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

Le template va :
- Créer la structure complète
- Ajouter les capabilities nécessaires
- Générer les domains de base
- Configurer l'environnement

## Configuration

### `kompo.config.json`

Fichier de configuration automatiquement maintenu par la CLI :

```json
{
  "version": 1,
  "project": {
    "name": "my-web3-app",
    "org": "myusername"
  },
  "apps": {
    "apps/web": {
      "packageName": "@myusername/web",
      "frontend": "nextjs",
      "backend": "nextjs",
      "designSystem": "shadcn",
      "ports": {
        "orm": "drizzle-postgres",
        "wallet": "wagmi",
        "cache": "redis"
      },
      "chains": ["ethereum", "base"]
    }
  },
  "history": [
    {
      "action": "new",
      "plugin": "framework-nextjs",
      "app": "apps/web",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "action": "add",
      "plugin": "port-orm",
      "adapter": "drizzle-postgres",
      "app": "apps/web",
      "timestamp": "2024-01-01T00:05:00.000Z"
    }
  ]
}
```

### Variables d'Environnement

Kompo gère automatiquement les variables dans `.env` :

```bash
# Générées par kompo add orm
DATABASE_URL="postgresql://..."
NEON_DATABASE_URL="..."

# Générées par kompo add wallet
NEXT_PUBLIC_WALLET_PROJECT_ID="..."

# Générées par kompo add cache
REDIS_URL="redis://localhost:6379"

# Générées par kompo add auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
```

## Tips & Tricks

### Raccourcis utiles

```bash
# Créer un domaine avec tous ses éléments
kompo add domain auth && \
kompo add entity User --domain auth && \
kompo add use-case signIn --domain auth && \
kompo add port user-repository --domain auth

# Vérifier tout est OK avant un commit
kompo doctor

# Régénérer après des modifications manuelles
kompo generate composition
```

### Scripts npm recommandés

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "db:migrate": "pnpm drizzle-kit push",
    "db:studio": "pnpm drizzle-kit studio",
    "check": "kompo doctor",
    "gen": "kompo generate composition"
  }
}
```

### Workflow Git

```bash
# 1. Créer une feature
git checkout -b feature/user-auth

# 2. Utiliser Kompo
kompo add domain auth
kompo add wallet

# 3. Vérifier
kompo doctor

# 4. Commit (Kompo ne commit jamais automatiquement)
git add .
git commit -m "feat: add authentication domain with wallet"
```

## Dépannage

::: warning
**Erreur commune :** "Not in a Kompo monorepo"
:::

**Solution :** Assurez-vous d'être à la racine du projet avec un fichier `kompo.config.json`.

::: warning
**Erreur commune :** "Domain already exists"
:::

**Solution :** Supprimez manuellement le dossier `domains/<domain>` avant de recréer.

::: warning
**Erreur commune :** "Missing environment variables"
:::

**Solution :** Lancez `kompo doctor --fix` pour générer les variables manquantes.

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
