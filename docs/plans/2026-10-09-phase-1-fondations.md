# Phase 1 : fondations

- **Statut :** terminée le 2026-10-09, branche `chore/phase-1-fondations`
- **Spec :** [section 17](../specs/2026-10-09-refonte-ances-tree.md#17-feuille-de-route)
- **Sortie attendue :** CI verte sur l'app actuelle (Farm, React 18, Netlify), avec l'outillage de void-starter.

## Fait

- [x] Bun 1.3.13 remplace pnpm (`bun.lock`, `packageManager`, `engines.node >= 24`) ; `.npmrc` et `pnpm-lock.yaml` supprimés.
- [x] Biome 2.5 avec la config de base du starter, Prettier retiré, tout le code reformaté.
- [x] TypeScript 7 avec les options strictes du starter (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noPropertyAccessFromIndexSignature`), deux projets : `tsconfig.json` (src) et `tsconfig.node.json` (configs).
- [x] Lefthook : Biome, type-check, gitleaks en pre-commit ; knip en pre-push ; commitlint (Conventional Commits) sur les messages.
- [x] Vitest 4 configuré (`passWithNoTests` jusqu'à la phase 2).
- [x] knip configuré, code mort supprimé (6 fichiers, `layoutTree`, état d'auth inutilisé, logs client).
- [x] 16 dépendances inutilisées retirées ; vulnérabilités transitives traitées par `overrides` (`js-yaml`, `tmp`) ; `braces` ignorée explicitement dans `bun run audit` (watcher de dev Farm, disparaît en phase 3).
- [x] CI GitHub : lint, type-check, tests, build, knip, audit, gitleaks vérifié par empreinte, job `quality` comme contrôle unique de protection de branche.
- [x] Netlify sur Bun 1.3.13 et Node 24 via `netlify.toml` (`publish = "dist"`).
- [x] `index.html` valide (`<html lang="fr">`), boutons typés, SVG décoratifs masqués aux lecteurs d'écran.

## Exceptions assumées (jusqu'à la réécriture)

- `biome.json` désactive `useExhaustiveDependencies`, `noStaticElementInteractions` et `useKeyWithClickEvents` sur `src/components/FamilyTree/**` et `src/components/PersonCard/**` : corriger les dépendances des effets d3 risquait des boucles de rendu sur du code remplacé en phase 4.
- `noConsole` désactivé sur `netlify/functions/**` (logs serveur), supprimés en phase 3.
- 20 avertissements Biome restants (assertions non nulles de l'ancien arbre).

## Reste à faire pour clore

- [ ] PR ouverte, CI verte sur GitHub, preview Netlify fonctionnelle (vérifier que le build Netlify accepte `bun.lock`).
- [ ] Protection de branche `main` : exiger le check `quality`.
- [ ] Merge.
