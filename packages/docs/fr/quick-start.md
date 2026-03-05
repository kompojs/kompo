---
title: Démarrage Rapide
description: Commencez à construire votre application Web3 en 5 minutes avec Kompo.
icon: zap
---

## Introduction

Kompo est conçu pour être flexible : démarrez rapidement avec un **template** ou construisez pas à pas avec la **CLI**.

## 1. Ajoutez votre application

À la racine d'un monorepo Kompo, ajoutez une nouvelle application :

```bash
kompo add app my-app
cd apps/my-app   # ou le chemin choisi par la CLI
```

Ou clonez d'abord le dépôt :

```bash
git clone https://github.com/kompo-dev/kompo.git my-monorepo
cd my-monorepo
pnpm install
kompo add app my-app
cd apps/my-app
```

## 2. Choisissez votre parcours

### Option A : Utiliser un template (recommandé)
Lancez une dApp complète, prête pour la production.

```bash
kompo add app my-marketplace --template nft-marketplace
```

**Vous obtenez :**
- ✅ Application React/Vite complète
- ✅ Domaine NFT (Repository, Use Cases, Entities)
- ✅ Adapters pré-câblés (Web3 + DB locale)
- ✅ **Composition Root** qui gère le câblage

### Option B : Construire from scratch
Construisez votre application brique par brique.

**1. Ajoutez une app vide**
```bash
kompo add app my-app
```

**2. Ajoutez un domaine**
```bash
kompo add domain nft
```

**3. Ajoutez un adapter**
```bash
kompo add adapter
```

**4. Câblez le tout**
```bash
kompo wire nft
```

## 3. Lancez

```bash
pnpm dev
```

Rendez-vous sur `http://localhost:5173` pour voir votre app.

## Étapes suivantes

- [Comprendre l'architecture](/fr/understand/architecture)
- [Maîtriser la CLI](/fr/cli/overview)
- [Explorer les templates](/fr/templates/overview)
