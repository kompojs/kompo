---
title: Configuration
description: Détails du fichier kompo.config.json
---

# Configuration (`kompo.config.json`)

Le fichier `kompo.config.json` à la racine de votre monorepo est la source de vérité pour la CLI.

## Structure

```json
{
  "version": 1,
  "project": {
    "name": "my-app",
    "org": "myorg"
  },
  "apps": {
    "apps/web": {
      "framework": "nextjs",
      "designSystem": "shadcn",
      "capabilities": ["orm", "wallet"]
    }
  }
}
```

## Maintenance

Ce fichier est automatiquement mis à jour par les commandes `kompo add`. Vous n'avez généralement pas besoin de le modifier manuellement, sauf pour configurer des aliases complexes ou des chemins personnalisés.
