---
date: 2026-10-09
title: "Comptes individuels sur invitation, sans mot de passe"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: Comptes individuels sur invitation, sans mot de passe

- **Date :** 2026-10-09
- **Décision :** better-auth 1.6.x avec magic link et passkey ; entrée uniquement par invitation ou demande d'accès validée ; rôles Membre / Éditeur / Admin.
- **Pourquoi :** besoin de savoir qui modifie, de router les propositions aux admins et de promouvoir des membres ; le sans-mot-de-passe convient à tous les âges.
- **Alternatives écartées :** mot de passe partagé + cookie signé (aucune notion d'identité ni de rôle) ; Clerk (service payant au-delà du gratuit, données hors de notre base).
- **À réexaminer si :** les emails magic link posent problème de délivrabilité à la famille.
