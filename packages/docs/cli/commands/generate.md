---
title: kompo generate
description: Régénérez les fichiers de composition et les providers
---

# `kompo generate`

La commande `kompo generate` synchronise votre code en régénérant les fichiers marqués `@generated`.

## Utilisation

```bash
kompo generate [type]
```

## Types disponibles

- `composition` : Met à jour les fichiers de connexion entre Domains et Apps.
- `providers` : Régénère le RootProvider avec les nouvelles capacités.
- `demos` : Met à jour les composants de démonstration.

::: warning
Ne modifiez jamais manuellement les blocs marqués @generated car ils seront écrasés lors du prochain kompo generate.
:::
