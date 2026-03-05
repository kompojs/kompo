---
title: NFT Marketplace Template
description: NFT Marketplace template for Kompo.
---

# Template NFT Marketplace

Ce template fournit une base solide pour construire une plateforme d'échange de NFTs.

## Fonctionnalités

- **Minting** : Interface pour créer des NFTs via IPFS.
- **Listing** : Système de mise en vente on-chain.
- **Buying** : Achat via contrats intelligents.
- **Indexing** : Recherche rapide via base de données locale (Drizzle).

## Installation

```bash
kompo add app my-market --template nft-marketplace
```

## Stack incluse

- **Frontend** : Next.js + Tailwind CSS.
- **Web3** : Wagmi + Viem.
- **Database** : Drizzle ORM.
- **Storage** : Adapter Pinata (IPFS).

