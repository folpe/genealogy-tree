---
date: 2026-10-09
title: "Domaine de production : famille.folpe.me"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: Domaine de production : famille.folpe.me

- **Date :** 2026-10-09
- **Décision :** l'app est servie sur `famille.folpe.me` (Vercel), en remplacement de `ances-tree.netlify.app`, qui redirige vers le nouveau domaine une fois la migration faite. Les passkeys utilisent `folpe.me` comme RP ID et les emails partent de `famille@folpe.me`.
- **Pourquoi :** domaine personnel plutôt que professionnel (volpio, voidcorp) pour un outil familial ; « famille » est lisible par toutes les générations dans les emails de connexion. Rattacher les passkeys au domaine racine évite de les invalider si le sous-domaine change.
- **Alternatives écartées :** sous-domaine de volpio ou voidcorp (marques professionnelles) ; rester sur `netlify.app` (domaine tiers, pas d'emails sur un domaine maîtrisé) ; passkeys liées au sous-domaine (perdues au moindre renommage).
- **À réexaminer si :** l'app sort du cadre familial ou si un domaine dédié est acheté (les passkeys devront alors être recréées).
