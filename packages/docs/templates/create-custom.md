---
title: Create Your Own Template
description: Comment créer et partager vos propres templates Kompo
---

# Créer Votre Propre Template

Vous pouvez packager vos architectures récurrentes sous forme de templates Kompo.

## Structure d'un Template

Un template est simplement un dossier contenant :
1. Un fichier `template.json` de configuration.
2. Un dossier `boilerplate/` contenant les fichiers sources.

## Partage

Pour utiliser un template local ou privé :

```bash
kompo add app my-app --template path/to/your/template
```

Plus d'informations sur la structure du `template.json` bientôt.
