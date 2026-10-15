# Racines

<!-- void-machine:begin -->

## Void Machine (managed by `void-machine init`)

Claude Code doctrine active in this project:

- `void` — universal craftsman skills (TDD, TypeScript strict, hexagonal, DDD, ...)
- `harness-nextjs` — Next.js 16 App Router conventions
- `harness-react` — React 19 + shadcn/Radix + accessibility
- `harness-server` — Server Actions, webhooks, Drizzle, Zod boundaries
- `harness-pwa` — PWA manifest, service worker, offline-first

### Doctrine — loaded into every session

@.void/installed/PHILOSOPHY.md
@.void/PROJECT-DOCTRINE.md

`PHILOSOPHY.md` is the universal Void Machine doctrine (managed — overwritten on init). `PROJECT-DOCTRINE.md` holds project-specific rules: context, ADRs, in-flight decisions (yours; init never overwrites what you have written in it).

To capture a new rule, just say it ("ajoute la règle…", "always X here", "never Y"). The `void-learn` skill auto-invokes, classifies project-specific vs universal, proposes the wording, waits for your confirmation, then writes. Never silent.

Every skill is invoked by its name: `/void-implement`, `/void-tdd`. A skill that composes another names it the same way; the syntax is the runtime's, the name is the skill's.

### Program — when present

If `.void/program.md` exists with `status: executing`, read it and its linked plan/spec before choosing implementation work. The programme holds global context; the local checkpoint holds session residue, and `ResumeBundle` composes both with Git. On a continue/start/resume request without a named work unit, use the declared progress provider: recover the scoped unit if exactly one is started; if several are started, stop and surface the competing claims; otherwise select the first ready unit from the declared order and native blocker relations. Fetch the complete unit before running `void-implement`. The declared progress provider owns mutable execution state; the program and checkpoint never store a current or next unit. If the provider or a required capability is unavailable, do not infer remote progress; stop the action that needs it. If no progress provider is declared, require a specific unit instead of selecting one. A specific user request overrides selection; human gates and merges remain human. The file's `autopilot` block carries consent to autonomous execution and is never inferred: `enabled: false`, an absent block, or an unreadable one forbids autonomous selection entirely.

An authorized merge includes routine local synchronization by the coordinator without asking for confirmation again. Verify the branch, remote, and verified merged commit, then fetch and advance the clean local target branch with `git merge --ff-only` to that commit. Stop on local changes, divergence, or an unexpected remote tip; preserve the work. This does not authorize another remote merge, deployment, history rewrite, or changes to shared Git state by commit-only workers. Runtime sandbox and approval controls still apply; never bypass them.

Use `void-orchestrate` to delegate independent research and substantial implementation when native capabilities permit. Keep intent and decisions with the coordinator; an already delegated writer executes its unit once. Use the supported session host per that policy: Herdr when the current session is validated there, native delegation without it elsewhere. Preserve existing permissions, independent review and real invocation evidence.

Run `void-machine doctor` to verify the install.

<!-- void-machine:end -->

Arbre généalogique familial en refonte : app actuelle Farm + React 18 + Notion + Netlify, cible Next.js 16 + Neon + Vercel sur `famille.folpe.me`.

## Avant de travailler

1. Lire [docs/ROADMAP.md](docs/ROADMAP.md) pour savoir quelle phase est en cours, puis le plan de cette phase dans `docs/plans/`.
2. Référence fonctionnelle : [docs/specs/2026-10-09-refonte-racines.md](docs/specs/2026-10-09-refonte-racines.md). Référence visuelle : [docs/design/DESIGN.md](docs/design/DESIGN.md) et les maquettes `docs/design/maquettes/`.
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
