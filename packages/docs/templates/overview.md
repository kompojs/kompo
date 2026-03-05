---
title: Templates Overview
description: Production-ready Web3 templates.
---

# Templates Web3 - Démarrez en un Clin d'Œil

Kompo propose des templates pré-construits pour les cas d'usage Web3 les plus courants. Chaque template est une application complète, production-ready, avec l'architecture hexagonale déjà en place.

## Blueprints vs Templates

It is important to understand the distinction between **Blueprints** and **Templates** in Kompo:

### 📄 Template (The "Ingredients")
A **Template** is a set of code artifacts (files, folders) written in `.eta` (embedded template architecture). It represents the raw code that will be generated.
*   *Example*: `package.json.eta`, `useMint.ts.eta`.

### 🗺️ Blueprint (The "Recipe")
A **Blueprint** is a JSON manifest that orchestrates the generation process. It defines:
*   Which templates to render.
*   Which "features" to enable (impacting the catalog).
*   The required inputs (prompts) from the user.
*   *Example*: `nft-marketplace.json` defines that the app uses the `web3` feature and renders the `apps/web` template folder.

---

## Available Templates

### 🎨 NFT Marketplace

```bash
kompo add app my-marketplace --template nft-marketplace
```

**Features incluses :**
- Mint de NFTs (ERC-721)
- Marketplace avec listings
- Achats directs et enchères
- Collections d'artistes
- royalties automatiques
- IPFS pour les métadonnées

**Stack technique :**
```
Frontend: Next.js 14 + Shadcn/ui
Backend: Next.js API Routes
Database: Drizzle + PostgreSQL
Storage: IPFS (Pinata)
Wallet: Wagmi + Viem
Chains: Ethereum, Base, Polygon
```

**Structure générée :**
```
domains/
├── nft-marketplace/     # Core marketplace logic
├── user-management/     # Artists & collectors
├── payment-processing/  # ETH & ERC20 payments
└── notifications/       # Bids & sales alerts
```

### 🏛️ DAO Governance

```bash
kompo add app my-dao --template dao
```

**Features incluses :**
- Gouvernance on-chain
- Propositions & votes
- Treasury management
- Token staking
- Quorum & délais de vote
- Historique des décisions

**Stack technique :**
```
Frontend: Next.js + Tailwind
Backend: NestJS + PostgreSQL
Blockchain: OpenZeppelin Governor
Voting: Snapshot integration
Analytics: The Graph indexing
```

**Structure générée :**
```
domains/
├── governance/         # Proposals & voting
├── treasury/          # Fund management
├── staking/           # Token locking
└── analytics/         # Vote analytics
```

### 💰 DeFi Swap DEX

```bash
kompo add app my-dex --template defi-swap
```

**Features incluses :**
- Swap de tokens (AMM)
- Liquidity pools
- Yield farming
- Price discovery
- Slippage protection
- Multi-chain routing

**Stack technique :**
```
Frontend: Vite + React + Chakra UI
Backend: Express + Redis
Blockchain: Uniswap V3 integration
Oracle: Chainlink price feeds
Monitoring: Grafana + Prometheus
```

**Structure générée :**
```
domains/
├── swap/              # Core swap logic
├── liquidity/         # Pool management
├── farming/           # Rewards calculation
└── price/             # Oracle integration
```

### 📊 Token Analytics

```bash
kompo add app my-analytics --template token-analytics
```

**Features incluses :**
- Tracking de portefeuilles
- Analyse de performance
- Transaction history
- Real-time prices
- Portfolio insights
- Export CSV/JSON

**Stack technique :**
```
Frontend: Next.js + Recharts
Backend: NestJS + MongoDB
Indexing: The Graph
Cache: Redis
WebSocket: Real-time updates
```

**Structure générée :**
```
domains/
├── portfolio/         # User portfolios
├── pricing/           # Price data
├── analytics/         # Calculations
└── reports/           # Export logic
```

### 🎮 GameFi Platform

```bash
kompo add app my-game --template gamefi
```

**Features incluses :**
- NFTs gaming assets
- Play-to-earn mechanics
- Tournament system
- Leaderboards
- In-game marketplace
- Achievement system

**Stack technique :**
```
Frontend: Next.js + Phaser.js
Backend: Express + PostgreSQL
Game: Unity WebGL integration
Real-time: Socket.io
Storage: Arweave for game assets
```

## Utiliser un Template

### Installation rapide

```bash
# 1. Ajouter l'app depuis le template
kompo add app my-project --template nft-marketplace

# 2. Installer les dépendances
cd apps/my-project
pnpm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés

# 4. Lancer la base de données
docker-compose up -d

# 5. Appliquer les migrations
pnpm db:migrate

# 6. Démarrer le développement
pnpm dev
```

### Personnalisation

Les templates sont des points de départ. Voici comment les personnaliser :

```bash
# Ajouter une capability
kompo add auth  # Pour l'authentification utilisateur
kompo add cache # Pour les performances

# Créer votre domaine métier
kompo add domain custom-feature

# Modifier le design
# Les templates utilisent Shadcn/ui ou Tailwind
# Personnalisez dans apps/web/src/components/
```

## Architecture des Templates

### Structure Standard

```
template-project/
├── apps/
│   ├── web/                # Frontend Next.js/Vite
│   └── api/                # Backend (si séparé)
├── domains/                # Logique métier
│   ├── core/              # Domain principal du template
│   ├── shared/            # Domains réutilisables
│   └── external/          # Intégrations tierces
├── shared/
│   ├── adapters/          # Implémentations techniques
│   ├── config/            # Configuration partagée
│   └── types/             # Types TypeScript
├── packages/              # Core Kompo (read-only)
├── scripts/               # Scripts de build/déploiement
├── docs/                  # Documentation du projet
└── kompo.config.json      # Configuration Kompo
```

### Domain Patterns

Chaque template suit des patterns de domain éprouvés :

#### Repository Pattern

```typescript
// Domains typiques avec repositories
- ProductRepository (e-commerce)
- NftRepository (NFT marketplace)
- ProposalRepository (DAO)
- TokenRepository (DeFi)
```

#### Event-Driven Architecture

```typescript
// Events pour découpler les features
- NftMintedEvent
- ProposalCreatedEvent
- SwapExecutedEvent
- GameScoreUpdatedEvent
```

#### Value Objects

```typescript
// Objets métier réutilisables
- Money/TokenAmount
- BlockchainAddress
- TimestampRange
- GameScore
```

## Créer votre Template

### Structure d'un Template

```bash
# Créer un nouveau template
mkdir packages/cli-templates/templates/my-template
cd packages/cli-templates/templates/my-template
```

**Fichiers requis :**

```json
// template.json
{
  "version": 1,
  "name": "my-template",
  "description": "Description de mon template",
  "category": "custom",
  "tags": ["web3", "custom"],
  "apps": {
    "apps/web": {
      "frontend": "nextjs",
      "backend": "nextjs",
      "designSystem": "shadcn",
      "ports": {
        "orm": "drizzle-postgres",
        "wallet": "wagmi"
      },
      "chains": ["ethereum", "base"]
    }
  },
  "history": [
    { "action": "new", "plugin": "framework-nextjs", "app": "apps/web" },
    { "action": "add", "plugin": "port-orm", "adapter": "drizzle-postgres", "app": "apps/web" },
    { "action": "add", "plugin": "port-wallet", "adapter": "wagmi", "app": "apps/web" }
  ]
}
```

### Templates de fichiers

Créez des templates `.eta` pour les fichiers générés :

```typescript
// templates/domain.eta
export type <%= entityName %> = {
  readonly id: <%= idType %>
<% Object.keys(properties).forEach(key => { %>
  readonly <%= key %>: <%= properties[key] %>
<% }) %>
  readonly createdAt: Date
  readonly updatedAt: Date
}
```

### Scripts du Template

```typescript
// scripts/setup.ts
export async function setupTemplate(options: TemplateOptions) {
  // 1. Créer les domains de base
  await createDomains(options.domains)
  
  // 2. Configurer la base de données
  await setupDatabase(options.database)
  
  // 3. Générer les adapters
  await generateAdapters(options.adapters)
  
  // 4. Créer la composition
  await generateComposition(options.apps)
}
```

## Best Practices

### 1. Convention de nommage

- **Domains** : kebab-case (`nft-marketplace`, `user-management`)
- **Entities** : PascalCase (`Nft`, `User`, `Proposal`)
- **Use Cases** : verb-noun (`createNft`, `authenticateUser`)
- **Ports** : noun-repository (`NftRepository`, `UserRepository`)

### 2. Séparation des responsabilités

```typescript
// ✅ Bon : Domain pur
export async function mintNft(input, ports) {
  // Logique métier uniquement
}

// ❌ Mauvais : Domain couplé
export async function mintNft(input) {
  const web3 = new Web3(process.env.RPC_URL) // Couplage !
}
```

### 3. Gestion des erreurs

```typescript
// Utiliser des erreurs métier spécifiques
export class InsufficientFundsError extends DomainError {
  constructor(required: bigint, available: bigint) {
    super(`Insufficient funds: ${available} < ${required}`)
  }
}
```

### 4. Testing

```typescript
// Tests unitaires pour les use cases
describe('mintNft', () => {
  it('should mint NFT with valid input', async () => {
    const result = await mintNft(validInput, mockPorts)
    expect(result).toBeDefined()
  })
})
```

## Contribuer un Template

Les contributions de templates sont bienvenues ! 

1. Fork le repo Kompo
2. Créer votre template dans `packages/cli-templates/templates/`
3. Ajouter les tests
4. Documenter avec des exemples
5. Submit une PR

::: tip Tip
Regardez les templates existants comme référence. Le template `nft-marketplace` est un bon point de départ.
:::

## Prochaines Étapes

- [Deploy Guide](/deploy/overview) - Mettez votre template en production
- [Examples](/examples) - Projets réels utilisant Kompo
- [Community](https://github.com/kompo-dev/kompo) - Rejoignez la communauté
