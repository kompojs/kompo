---
title: Production Checklist
description: Vérifications avant la mise en production
---

# Production Checklist

Avant de pousser votre application Kompo en production, assurez-vous de cocher les points suivants :

<Steps>
  <Step>
    **Tests** : Lancez `pnpm test` pour vérifier que tout votre domaine métier est valide.
  </Step>
  <Step>
    **Doctor** : Lancez `kompo doctor` pour valider la configuration globale.
  </Step>
  <Step>
    **Migrations** : Vérifiez que vos schémas Drizzle/Prisma sont synchronisés avec la base de production.
  </Step>
  <Step>
    **Secrets** : Assurez-vous que toutes les variables sensibles ne sont pas commitées mais présentes sur votre plateforme de déploiement.
  </Step>
</Steps>
