---
title: Environment Variables
description: Gérer les secrets et la configuration dans Kompo
---

# Variables d'Environnement

Kompo utilise un système centralisé pour gérer les variables d'environnement dans le monorepo.

## Configuration Locale

Utilisez le fichier `.env` à la racine pour les variables partagées ou dans chaque package/app pour les variables spécifiques.

```bash
# Database
DATABASE_URL="postgresql://..."

# Web3
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="..."
```

## Kompo Doctor

Lancez `kompo doctor --fix` pour vérifier si des variables requises par vos adapters sont manquantes. La CLI vous proposera de les créer avec des valeurs par défaut ou de les renseigner.
