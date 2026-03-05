---
title: kompo add
description: Ajoutez des capacités ou des domaines à votre projet
---

# `kompo add`

La commande `kompo add` est utilisée pour étendre votre projet en ajoutant des domaines métier ou des capacités d'infrastructure (adapters).

## Ajouter un Domaine

```bash
kompo add domain <domain-name>
```

Cette commande lance un flow interactif pour définir :
1. Le Use Case initial.
2. Les Ports nécessaires.
3. L'Entité principale.

## Ajouter une Capacité (Infrastructure)

```bash
# Ajouter la persistance
kompo add orm

# Ajouter la connexion Wallet
kompo add wallet

# Ajouter le système de cache
kompo add cache
```

## Autres sous-commandes

- `kompo add entity <Name> --domain <domain>`
- `kompo add use-case <name> --domain <domain>`
- `kompo add port <name> --domain <domain>`
