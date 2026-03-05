---
title: Introduction
description: Bienvenue sur Kompo - Le framework Composant-as-a-Service pour le Web3
icon: book
---

# Bienvenue sur Kompo

Kompo est un **framework TypeScript Web3** basé sur l'Architecture Hexagonale (Ports & Adapters). Il vous permet de construire des applications décentralisées rapidement avec une séparation parfaite entre votre logique métier et l'infrastructure.

## Pourquoi Kompo ?

::: warning Le problème avec les DApps traditionnelles :
- Logique métier mélangée avec le code blockchain

    - Impossible de tester sans réseau

    - Changer de provider = refonte complète

    - Pas de séparation des préoccupations
:::

::: tip La solution Kompo :
- Domaine pur, testable unitairement

    - Changez de providers sans toucher à la logique métier

    - Architecture évolutive et maintenable

    - Fonctionnalités Web3 prêtes à l'emploi
:::

## Les 4 Piliers de Kompo

- [**Composant-as-a-Service**](/fr/understand/architecture) — Des briques Web3 prêtes à l'emploi (wallet, NFT, DAO) que vous composez via CLI.
- [**Architecture Hexagonale**](/fr/understand/architecture) — Le domaine pur au centre, l'infrastructure connectée via des ports/adapters interchangeables.
- [**Magic CLI**](/fr/cli/overview) — `kompo add wallet` génère tout le nécessaire : provider, hooks, composants, configuration.
- [**Templates Web3**](/fr/templates/overview) — Démarrez avec des templates prêts pour la production : Marketplace NFT, DAO, DeFi DEX...

## Démarrage Rapide - 5 minutes chrono

### 1. Ajoutez votre application

Depuis un monorepo Kompo, ajoutez une nouvelle application :

```bash
kompo add app my-web3-app
cd apps/my-web3-app   # ou le chemin choisi par la CLI
```

### 2. Ajoutez des capacités Web3

```bash
# Connexion Wallet
kompo add wallet

# Persistance base de données
kompo add orm

# Stockage de fichiers
kompo add ipfs
```

### 3. Créez votre domaine métier

```bash
kompo add domain nft-collection
# → Use case : create-nft
# → Port : nft-repository  
# → Entity : Nft
```

### 4. Lancez l'application

```bash
pnpm dev
```

🎉 **Résultat** : Une app Web3 complète avec :
- Connexion Wallet (MetaMask, WalletConnect)
- Base de données PostgreSQL configurée
- Stockage IPFS pour les métadonnées
- Architecture propre et testable

## L'Architecture Kompo en 30 secondes

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Votre App     │───▶│ Racine de    │───▶│   Domaine Pur   │
│   (Next.js)     │    │ Composition  │    │(métier seulement)│
└─────────────────┘    └──────────────┘    └─────────────────┘
                                │                   │
                                ▼                   ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │   Adapters   │◀───│     Ports       │
                       │ (Drizzle,    │    │   (contracts)   │
                       │  Wagmi, etc) │    └─────────────────┘
                       └──────────────┘
```

**Votre domaine ne dépend de rien. Tout dépend de votre domaine.**

## Ce que vous pouvez construire

### Marketplace NFT

```typescript
// Votre logique métier, pure et simple
export async function createAndListNft(input, ports) {
  const nft = createNft(input)
  const metadata = await ports.storage.upload(input.image)
  const token = await ports.wallet.mint(metadata)
  const listed = listNft(nft, input.price)
  await ports.nftRepository.save(listed)
  return listed
}
```

Kompo gère le reste :
- ✅ Connexion Wallet (Wagmi)
- ✅ Upload d'image (IPFS)  
- ✅ Mint on-chain (Viem)
- ✅ Persistance base de données (Drizzle)

### Gouvernance DAO

```typescript
export async function createProposal(input, ports) {
  const proposal = createProposal(input)
  await ports.governance.propose(proposal)
  await ports.notification.notifyVoters(proposal)
  return proposal
}
```

Kompo fournit :
- ✅ Contrat Governor (OpenZeppelin)
- ✅ Suivi des votes (The Graph)
- ✅ Système de notification
- ✅ Gestion de trésorerie

## La Promesse Kompo

::: tip
**🚀 Time-to-market** : Les capacités Web3 prêtes à l'emploi vous font gagner des semaines de développement.
:::

::: tip
**🔧 Pas de Vendor Lock-in** : Changez de providers (DB, wallet, stockage) sans modifier votre logique métier.
:::

::: tip
**🧪 Testabilité** : Vos domaines sont 100% testables unitairement. Pas de mocks complexes, pas de blockchain.
:::

::: tip
**📈 Scalabilité** : Architecture hexagonale éprouvée, utilisée par les grandes entreprises.
:::

## Commencez Maintenant

- [**Démarrage Rapide**](/fr/quick-start) — Guide rapide pour créer votre première app en 5 minutes.
- [**Comprendre**](/fr/understand/architecture) — Plongez dans l'architecture hexagonale et les concepts.
- [**Construire**](/fr/build/overview) — Construisez une application Web3 complète étape par étape.
- [**CLI**](/fr/cli/overview) — Maîtrisez toutes les commandes Kompo.

## Rejoignez la Communauté

- 📖 [Documentation](https://docs.kompo.dev)
- 💬 [Discord](https://discord.gg/kompo)  
- 🐦 [Twitter/X](https://twitter.com/kompo_js)
- 🐙 [GitHub](https://github.com/kompo-dev/kompo)

---

**Kompo** - Build Web3. Faster. Cleaner. Better.
