---
title: kompo add app
description: Ajouter une nouvelle application à votre monorepo Kompo
---

# `kompo add app`

La commande `kompo add app` est le point d'entrée principal pour ajouter une nouvelle application à votre monorepo Kompo. Elle génère une nouvelle app basée sur l'architecture hexagonale.

## Utilisation

```bash
kompo add app <app-name> [options]
```

## Options

- `--template <name>` : Utiliser un template pré-défini (ex. `nft-marketplace`, `dao-governance`).
- `--org <name>` : Spécifier le nom de l'organisation pour les packages (par défaut : votre nom d'utilisateur).

## Exemples

```bash
# Ajouter une application Web3 standard
kompo add app my-web3-app

# Ajouter une app à partir du template NFT Marketplace
kompo add app awesome-nfts --template nft-marketplace
```

La CLI vous guidera ensuite pour choisir votre stack (Next.js, Tailwind, etc.).
