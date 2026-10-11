---
date: 2026-10-09
title: "Next.js 16 sur Vercel plutôt qu'une SPA"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: Next.js 16 sur Vercel plutôt qu'une SPA

- **Date :** 2026-10-09
- **Décision :** migration de React 18 + Farm + Netlify Functions vers Next.js 16 App Router hébergé sur Vercel, outillage aligné sur void-starter.
- **Pourquoi :** les données doivent être chargées côté serveur derrière une session ; Next règle d'un coup l'auth, le cache et l'exposition des secrets, et s'aligne sur la stack de référence.
- **Alternatives écartées :** Vite 8 en SPA + fonctions serverless (deux mondes à sécuriser) ; rester sur Farm (bundler de niche).
- **À réexaminer si :** l'app devait fonctionner sans serveur (export statique pur).
