# Ances-Tree

Arbre généalogique familial. L'app actuelle (Farm, React 18, données Notion, Netlify) est en cours de refonte vers Next.js 16, Neon et Vercel sur `famille.folpe.me`.

- Spec de la refonte : [docs/specs/2026-10-09-refonte-ances-tree.md](docs/specs/2026-10-09-refonte-ances-tree.md)
- Journal de décisions : [docs/DECISIONS.md](docs/DECISIONS.md)

## Prérequis

- Bun 1.3 (`packageManager` dans `package.json`)
- Node 24
- gitleaks (hook de pre-commit) : `brew install gitleaks`

## Commandes

```bash
bun install          # installe les dépendances et les hooks Lefthook
bun run dev          # serveur de dev Farm
bun run netlify:dev  # dev avec les fonctions Netlify (/api)
bun run build        # build de production dans dist/
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
