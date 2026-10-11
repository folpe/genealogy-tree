---
date: 2026-10-09
title: "App unique, pas de monorepo"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: App unique, pas de monorepo

- **Date :** 2026-10-09
- **Décision :** une seule app Next, domaine dans `src/server/<domaine>/`.
- **Pourquoi :** une seule cible de déploiement ; Turborepo serait du cérémonial.
- **Alternatives écartées :** reprendre le monorepo complet de void-starter.
- **À réexaminer si :** une deuxième cible apparaît (app mobile, site public séparé).
