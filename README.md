# Ances-Tree

Arbre généalogique familial. Refonte en cours vers Next.js 16, Neon et Vercel sur `famille.folpe.me` (avancement : [docs/ROADMAP.md](docs/ROADMAP.md)). L'ancienne app (Farm, Notion, Netlify) reste en ligne sur Netlify jusqu'à la bascule ; son code est dans `legacy/`.

- Spec de la refonte : [docs/specs/2026-10-09-refonte-ances-tree.md](docs/specs/2026-10-09-refonte-ances-tree.md)
- Journal de décisions : [docs/decisions-log/](docs/decisions-log/)

## Prérequis

- Bun 1.3 (`packageManager` dans `package.json`)
- Node 24
- gitleaks (hook de pre-commit) : `brew install gitleaks`

## Commandes

```bash
bun install          # installe les dépendances et les hooks Lefthook
bun run dev          # serveur de dev Next (Turbopack)
bun run build        # build de production Next
bun run start        # sert le build
```

## Qualité

```bash
bun run lint         # Biome (lint et format)
bun run lint:fix
bun run type-check   # TypeScript strict
bun run test         # Vitest
bun run knip         # code et dépendances morts
bun run audit        # vulnérabilités des dépendances
```

Hooks Lefthook : Biome, type-check et gitleaks en pre-commit, knip en pre-push, commitlint (Conventional Commits) sur les messages. La CI GitHub rejoue lint, type-check, tests, build, knip, audit et gitleaks.
