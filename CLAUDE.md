# Ances-Tree

Arbre généalogique familial en refonte : app actuelle Farm + React 18 + Notion + Netlify, cible Next.js 16 + Neon + Vercel sur `famille.folpe.me`.

## Avant de travailler

1. Lire [docs/ROADMAP.md](docs/ROADMAP.md) pour savoir quelle phase est en cours, puis le plan de cette phase dans `docs/plans/`.
2. Référence fonctionnelle : [docs/specs/2026-10-09-refonte-ances-tree.md](docs/specs/2026-10-09-refonte-ances-tree.md). Référence visuelle : [docs/design/DESIGN.md](docs/design/DESIGN.md) et les maquettes `docs/design/maquettes/`.
3. Décisions structurantes : [docs/DECISIONS.md](docs/DECISIONS.md), en ajout uniquement.

## Conventions

- Stack et outillage alignés sur `void-starter` : Bun, Biome, TypeScript strict, Lefthook, commitlint, knip, Vitest.
- Avant de proposer un commit : `bun run lint && bun run type-check && bun run test && bun run build && bun run knip`.
- Domaine (graphe, parenté, droits, dates) en TDD, sans I/O.
- Droits par proximité (spec section 6) : la policy est vérifiée côté serveur dans chaque service, jamais seulement dans l'UI.
- Textes de l'app en français, tutoiement.
- Cocher les cases du plan de phase dans la même PR que le code correspondant.

## Garde-fous

- Pas de migration de schéma en production, d'écriture de données réelles, de suppression de Notion ou de Netlify, ni de changement DNS sans validation explicite de Folpe.
- Les photos et données familiales sont personnelles : jamais de données réelles dans les fixtures, les tests ou les maquettes.
