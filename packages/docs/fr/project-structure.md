---
title: Structure du Projet
description: Comprenez l'organisation des fichiers et l'architecture d'un projet Kompo.
icon: files
---

# Structure du Projet

Un projet Kompo est un **monorepo** géré par pnpm workspaces.

## Aperçu

```text
my-project/
├── apps/                  # Applications déployables
│   └── web/               # Frontend Next.js / Vite
├── packages/              # Packages partagés
│   ├── config/            # Configuration partagée
│   ├── domains/           # Logique métier (domaines)
│   ├── ui/                # Composants UI
│   └── utils/             # Utilitaires
├── kompo.catalog.json
├── pnpm-workspace.yaml
└── package.json
```

Consultez le [guide complet en anglais](/project-structure) pour le détail.
