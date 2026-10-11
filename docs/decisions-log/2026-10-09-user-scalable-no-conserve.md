---
date: 2026-10-09
title: "`user-scalable=no` conservé"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: `user-scalable=no` conservé

- **Date :** 2026-10-09
- **Décision :** le flag reste dans le viewport ; le pinch est géré par `touch-action: none` limité au canvas de l'arbre.
- **Pourquoi :** le zoom navigateur entre en conflit avec le pan / zoom de l'arbre.
- **Alternatives écartées :** laisser le zoom navigateur actif.
- **À réexaminer si :** un audit d'accessibilité l'exige ; les fiches et formulaires restent lisibles sans zoom.
