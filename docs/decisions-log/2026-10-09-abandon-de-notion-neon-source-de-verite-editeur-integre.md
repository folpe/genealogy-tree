---
date: 2026-10-09
title: "Abandon de Notion, Neon source de vérité, éditeur intégré"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: Abandon de Notion, Neon source de vérité, éditeur intégré

- **Date :** 2026-10-09
- **Décision :** Neon Postgres + Drizzle devient la source de vérité ; l'édition se fait directement dans l'arbre ; Notion est migré une fois puis coupé.
- **Pourquoi :** la difficulté de la généalogie est dans les liens (unions multiples, filiations, dates approximatives) ; aucun CMS générique ne les édite bien, et l'édition dans l'arbre est la meilleure UX.
- **Alternatives écartées :** Payload CMS (relations peu ergonomiques, second système d'auth) ; Gramps Web (auto-hébergement Docker, interface austère) ; NocoDB / Teable (ergonomie tableur, auto-hébergement) ; garder Notion (URLs de photos expirantes, pas de rôles).
- **À réexaminer si :** le besoin d'outils de généalogiste avancés (sources, citations) dépasse ce que l'éditeur couvre ; Gramps Web en back-office redevient alors pertinent.
