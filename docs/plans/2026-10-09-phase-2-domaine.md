# Plan phase 2 : domaine en TDD

- **Date :** 2026-10-09
- **Spec :** [docs/specs/2026-10-09-refonte-racines.md](../specs/2026-10-09-refonte-racines.md), sections 5, 6, 8 et 16
- **Décisions :** [docs/DECISIONS.md](../DECISIONS.md), ADR 06 (graphe avec nœuds d'union), 08 (droits par proximité), 11 (direction visuelle, pour le vocabulaire affiché)
- **Statut :** lots 1 à 8 faits, PR #64 à #68 à merger

## 1. Objectif et sortie attendue

Écrire tout le cœur métier en TypeScript pur, sans I/O, piloté par les tests, **avant** la base et l'UI. Les phases 3 à 7 ne font ensuite que brancher ce domaine sur Drizzle, les actions et le rendu.

Sortie attendue :

- des modules purs sous `src/server/` (helpers, policy, types Zod) importables côté serveur comme côté client ;
- une famille fictive de référence (celle des maquettes) en fixture partagée, réutilisée par tous les tests, puis par les seeds de la phase 3 et les tests e2e ;
- une couverture élevée et mesurée sur le domaine (objectif : 95 % des lignes, 90 % des branches sur `src/server/**`), et un passage de mutation testing (Stryker) sur la policy d'accès et le calcul de parenté ;
- CI verte.

## 2. Prérequis

- Phase 1 mergée : Bun, Biome, TS strict, Vitest 4, Lefthook, CI.
- Zod 4 ajouté en dépendance (`bun add zod@^4`).
- Aucune dépendance au framework : ni React, ni Next, ni Drizzle dans `src/server/**` pendant cette phase.

## 3. Conventions (alignées sur void-starter, `docs/PATTERNS.md`)

- Nommage `<domaine>.<couche>.ts` : `family.types.ts`, `family.helper.ts`, `access.policy.ts`, etc. Tests colocalisés `*.test.ts`.
- Helpers purs : aucune horloge implicite. `now` (ou `today`) est toujours passé en paramètre.
- Types : schémas Zod + `z.infer` dans `*.types.ts` (ADR 09 du starter).
- Erreurs typées dans `family.errors.ts` (au moins 3 erreurs métier : cycle, trop de parents biologiques, dates incohérentes), sous-classes d'une `AppError` locale à code stable, reprise à l'identique du starter (`packages/core/src/errors.ts`) pour faciliter la phase 3.
- Pas de barrel fourre-tout : un `index.ts` par domaine qui n'expose que la surface publique.
- Libellés en français centralisés dans `kinship.labels.ts` (pas de chaînes dispersées), pour pouvoir les relire en un seul endroit.

## 4. Arborescence cible

```
src/server/
  _shared/
    errors.ts                     # AppError + codes (repris du starter)
  family/
    family.types.ts               # Person, Union, ParentChild, FamilyGraph (Zod)
    family.errors.ts              # CycleError, TooManyBiologicalParentsError, InconsistentDatesError, SelfUnionError
    family.helper.ts              # construction et requêtes du graphe
    family.invariants.ts          # validations d'écriture (pures)
    family.display.ts             # sélection de ce qui est dessiné (unions en cours, unions passées)
    fuzzy-date.helper.ts          # dates à précision variable
    kinship.helper.ts             # chemin, ancêtres communs, degré
    kinship.labels.ts             # nommage français des liens
    search.helper.ts              # normalisation et classement
    index.ts
  access/
    access.types.ts               # Viewer, Capability, VisibilityLevel
    access.policy.ts              # cercle proche, périmètre, gardiens, visibilité, édition
    access.redact.ts              # projection d'une fiche selon le niveau de visibilité
    index.ts
tests/
  fixtures/
    marchand-family.ts            # famille fictive des maquettes
```

## 5. Fixture de référence : la famille Marchand

Reprend exactement les maquettes (`Arbre.dc.html`, `Eventail.dc.html`, `Frise.dc.html`), pour que tests, seeds et maquettes racontent la même histoire. Identifiants lisibles (`henri`, `louise`, etc.).

- Henri Marchand (1902-1979, Rodez, décès sourcé) + Louise Garnier (1905-1991, Millau), mariés en 1928 -> Paul, Marie, Claude.
- Paul (1931-2008) + Jeanne Roux (1934-2019) -> Anne (1960), Luc (1963).
- Marie (1936, vivante) + Jacques Lefèvre (1933-2015) -> Isabelle (1962).
- Claude (1940, vivant, Montpellier) : aucun proche inscrit, fiche ouverte.
- Luc + Sophie Blanc (1965) -> Léa (1992), Hugo (1995).
- Union passée de Luc (terminée par séparation) avec une personne `ex_luc` -> Maxime (1987). Sophie a une filiation `a_eleve` vers Maxime.
- Parents de Sophie : Bernard Blanc (1938-2012) + Odette Pichon (1941, vivante).
- Parents de Jeanne : Émile Roux (1905-1980) + Marthe Vidal (1908-1996).
- Un mineur pour les règles de visibilité : Jade, fille de Léa, née en 2018 (prénom distinct de la Camille des maquettes, fille de Claude).
- Un cas d'adoption : un enfant adopté par Anne, pour vérifier que l'adoption compte partout comme une filiation.
- Comptes inscrits : Hugo, Luc, Anne, Isabelle. Admin propriétaire : Folpe (non relié à une fiche dans la fixture, ou relié selon le test).

Builders de test à côté de la fixture : `aPerson()`, `anUnion()`, `aChildOf()`, pour composer des cas limites sans dupliquer la famille.

## 6. Lots ordonnés

Chaque lot suit le cycle : tests rouges d'abord, implémentation minimale, refactor. Un lot = un ou plusieurs commits `test:` puis `feat:`.

### Lot 1 : types et fixture

- [x] `src/server/_shared/errors.ts` : `AppError` (message, `code`, `status`) et helpers de garde de type.
- [x] `family.types.ts` : schémas Zod `personSchema`, `unionSchema` (type `mariage | pacs | union_libre | inconnu`, début, fin, motif `deces | divorce | separation`), `parentChildSchema` (type `biologique | adoptive | a_eleve | inconnue`, `unionId` optionnel), `fuzzyDateSchema`, `familyGraphSchema`.
- [x] `tests/fixtures/marchand-family.ts` + builders.
- [x] Tests : la fixture passe `familyGraphSchema.parse` ; un payload invalide (type de filiation inconnu, union sans partenaire) est rejeté avec un message exploitable.
- **Acceptation :** `bun run test` vert, `bun run type-check` vert, la fixture est la seule source de la famille dans les tests.

### Lot 2 : dates à précision variable

- [x] Tests d'abord (`fuzzy-date.helper.test.ts`) :
  - parse depuis la saisie libre française : `12/03/1987`, `mars 1987`, `1987`, `vers 1850`, `avant 1900`, `après 1900`, `entre 1880 et 1885`, avec et sans accents ni majuscules ;
  - format français : « 12 mars 1987 », « mars 1987 », « 1987 », « vers 1850 », « avant 1900 », « après 1900 », « entre 1880 et 1885 » ;
  - comparaison et tri stables entre précisions différentes (une date `annee` 1987 et une date `exacte` 1987-03-12 : ordre défini et documenté) ;
  - âge à une date donnée et âge au décès, avec résultat exact ou approché (`{ value, approx: boolean }`) ;
  - bornes : `vers` = plus ou moins 5 ans par défaut (constante nommée), `entre` avec début postérieur à la fin rejeté.
- [x] `fuzzy-date.helper.ts` : `parseFuzzyDate`, `formatFuzzyDate`, `compareFuzzyDates`, `fuzzyDateRange` (intervalle min/max), `ageAt`.
- **Acceptation :** tous les formats de la spec section 5 sont couverts ; aucune utilisation de `Date.now()` dans le module.

### Lot 3 : graphe et invariants

- [x] Tests d'abord (`family.helper.test.ts`, `family.invariants.test.ts`) :
  - requêtes : parents (par type de filiation), enfants, conjoints en cours et passés, frères et sœurs avec distinction plein / demi, ancêtres (sans limite, avec génération), descendants ;
  - invariants d'écriture : ajout d'une filiation qui crée un cycle -> `CycleError` ; troisième parent biologique -> `TooManyBiologicalParentsError` ; enfant né avant un parent, décès avant naissance, union avant la naissance d'un partenaire -> `InconsistentDatesError` (en tenant compte des précisions : un conflit seulement si les intervalles ne se recouvrent pas) ; union avec soi-même -> `SelfUnionError` ;
  - les filiations `a_eleve` n'entrent jamais dans l'ascendance biologique ni dans la limite de deux parents ; les filiations `adoptive` comptent comme filiations à part entière.
- [x] `family.helper.ts` : index d'adjacence construit une fois (`buildFamilyIndex(graph)`), requêtes en O(degré).
- [x] `family.invariants.ts` : `assertCanAddParentChild`, `assertCanAddUnion`, `assertCanUpdateDates`, qui retournent les erreurs typées.
- **Acceptation :** un ajout invalide est refusé avec une erreur typée à code stable ; les requêtes passent sur la fixture et sur un graphe généré de 2 000 personnes en moins de 50 ms (test de performance léger, marqué et non bloquant en CI si instable).

### Lot 4 : ce qui est dessiné (familles recomposées)

- [x] Tests d'abord (`family.display.test.ts`), à partir de la section 8.1 :
  - par défaut, seule l'union en cours d'une personne est dessinée ; l'ancien conjoint de Luc n'apparaît pas dans la lignée de Luc ;
  - Maxime est rattaché à Luc seul (branche qui part du parent), au même niveau que Léa et Hugo ;
  - sur une vue centrée sur Maxime (ascendance), l'union passée et l'autre parent apparaissent ;
  - option « Montrer les unions passées » : les unions terminées réapparaissent, veuvage compris ;
  - parent inconnu : nœud d'union avec un emplacement « parent à découvrir » ;
  - `a_eleve` exposé comme lien secondaire (pointillé) sans compter dans l'ascendance.
- [x] `family.display.ts` : `selectDisplayedGraph(graph, { focusId, showPastUnions })` qui produit les nœuds (personnes, unions) et arêtes typées que le moteur de rendu (phase 4) consommera tel quel.
- **Acceptation :** la sortie sur la fixture correspond à la géométrie logique des maquettes (mêmes nœuds visibles, mêmes rattachements).

### Lot 5 : parenté et nommage en français

- [x] Tests d'abord (`kinship.helper.test.ts`, `kinship.labels.test.ts`), tables de cas depuis Hugo et depuis Isabelle, reprises des maquettes :
  - Hugo -> Luc « ton père », Sophie « ta mère », Léa « ta sœur », Maxime « ton demi-frère », Paul « ton grand-père », Henri « ton arrière-grand-père », Anne « ta tante », Claude « ton grand-oncle », Marie « ta grand-tante », Jacques « ton grand-oncle par alliance », Isabelle « la cousine germaine de ton père » ;
  - Isabelle -> Anne et Luc « cousine / cousin germain », Hugo, Léa et Maxime « petit-cousin / petite-cousine », Paul « ton oncle », Jeanne « ta tante par alliance », Sophie « l'épouse de ton cousin Luc » ;
  - genre grammatical : accords « ton / ta », « né / née », « demi-frère / demi-sœur », valeur par défaut neutre si le genre est inconnu (« ton parent », « ton enfant ») ;
  - liens par alliance, par adoption (même libellé que biologique, mention seulement sur la fiche), `a_eleve` (« beau-père », « belle-mère ») ;
  - cas lointains : au-delà d'une profondeur donnée, formule générique « parent au 6e degré, par Henri et Louise » plutôt qu'un libellé faux ;
  - ancêtres communs : pour Hugo et Isabelle, Henri et Louise ; pour Hugo et Maxime, Luc seul.
- [x] `kinship.helper.ts` : `findRelationshipPath(index, fromId, toId)` (BFS sur personnes + unions), `commonAncestors`, `relationship(fromId, toId)` qui retourne une structure (`{ kind, generationsUp, generationsDown, half, byAlliance, via }`), indépendante du texte.
- [x] `kinship.labels.ts` : `describeRelationship(relationship, { targetGender, perspective: 'tu' })` qui produit la phrase française, et `describeDegree`.
- **Acceptation :** chaque libellé affiché dans les maquettes sort de `describeRelationship` ; les libellés sont relus par Folpe dans la PR (liste exportée en tableau dans la description).

### Lot 6 : policy d'accès

- [x] Tests d'abord (`access.policy.test.ts`), avec les cas de la section 6.6 comme tests nommés en français :
  - **cercle proche** : soi, conjoints en cours, parents, enfants, frères et sœurs, demi compris ; un ancien conjoint en sort ;
  - **périmètre** : cercle proche + toute l'ascendance avec conjoints + descendants avec conjoints + fiches ouvertes ;
  - **fiches ouvertes** : une personne qu'aucun membre inscrit n'a dans son cercle proche (Claude) ;
  - **gardiens** : la personne si inscrite, sinon jusqu'à 3 membres inscrits les plus proches (ordre déterministe : distance, puis type de lien, puis ancienneté du compte) ; Paul -> Anne et Luc ;
  - Hugo modifie directement Hugo, Luc, Sophie, Léa, Maxime, Paul, Jeanne, Henri, Louise, Claude ; suggère sur Marie, Jacques, Isabelle (gardienne Isabelle) et Anne (gardienne Anne) ;
  - Isabelle modifie Isabelle, Marie, Jacques, Henri, Louise, Claude ; suggère sur Luc (gardien Luc) ;
  - **veille de lignée** : si Isabelle modifie Henri, les membres notifiés sont Hugo, Luc, Anne (et Léa si inscrite) ; `watchersOf(personId)` ;
  - **anti guerre d'édition** : une modification annulée ne peut pas être réappliquée directement par son auteur, elle devient une suggestion ;
  - **faits sourcés** : modifier un fait sourcé sans nouvelle source -> suggestion ; avec une nouvelle source -> direct si dans le périmètre ;
  - **admins** : voient tout, peuvent tout trancher, mais leurs lectures de fiches restreintes sont marquées « à journaliser » dans le résultat ;
  - **escalade** : `escalationDue(suggestion, now)` vrai après 14 jours sans réponse (constante nommée).
- [x] Tests de visibilité (`access.redact.test.ts`), matrice de la section 6.4 :
  - décédés : tout visible ;
  - vivants hors périmètre : année et ville de naissance, photo de profil uniquement ; date exacte, résidence, contact et autres photos retirés ;
  - mineurs hors cercle proche : prénom et initiales seulement ;
  - `visibility = cercle` : restreint au cercle proche, admins compris mais journalisés ;
  - les champs retirés sont **absents** de l'objet retourné (pas `null`), pour qu'ils ne puissent pas fuiter vers le client.
- [x] `access.policy.ts` : `closeCircle`, `perimeter`, `isOpenRecord`, `guardiansOf`, `watchersOf`, `canEdit(viewer, personId, change)` qui retourne `{ mode: 'direct' | 'suggest', reason, guardians }`, `visibilityLevel(viewer, personId)`.
- [x] `access.redact.ts` : `redactPerson(person, level)`, typé pour que le type de sortie reflète les champs retirés.
- **Acceptation :** 100 % des branches de `access.policy.ts` couvertes ; Stryker sans mutant survivant sur ce fichier (ou survivants justifiés dans la PR).

### Lot 7 : recherche

- [x] Tests d'abord (`search.helper.test.ts`) : insensible à la casse et aux accents (« lea » trouve « Léa »), trouve le nom de naissance (« Garnier » trouve Louise, « née Roux »), prénoms composés et tirets, classement (correspondance exacte, puis début de mot, puis proximité dans l'arbre par rapport au membre courant), aucun champ masqué par la visibilité n'est indexé pour un viewer qui ne doit pas le voir.
- [x] `search.helper.ts` : `normalizeForSearch`, `buildSearchIndex(graph, viewer)`, `search(index, query, { limit })`.
- **Acceptation :** les exemples du ⌘K des maquettes donnent les mêmes résultats, dans le même ordre.

### Lot 8 : durcissement

- [x] Stryker (`bunx stryker run` en local, configuration `stryker.config.json` limitée à `src/server/**`) sur `access.policy.ts`, `kinship.helper.ts`, `fuzzy-date.helper.ts` ; renforcer les tests sur les mutants survivants.
- [x] Couverture : seuils `coverage.thresholds` dans `vitest.config.ts` pour `src/server/**` (95 % lignes, 90 % branches).
- [x] `knip` propre : tout export non utilisé hors tests est soit consommé, soit retiré.

## 7. Commandes de vérification

```bash
bun run test                     # tous les tests
bunx vitest run src/server --coverage
bunx stryker run                 # mutation testing (local, non bloquant en CI)
bun run type-check && bun run lint && bun run knip
```

## 8. Risques et garde-fous

- **Libellés de parenté faux** : risque d'image le plus fort auprès de la famille. Garde-fou : tables de cas exhaustives, formule générique au-delà de la profondeur maîtrisée, relecture des libellés par Folpe dans la PR.
- **Policy trop permissive** : une erreur ici expose des données de vivants. Garde-fou : tests de la matrice complète, mutation testing, champs retirés absents de l'objet, et la phase 3 réutilise ces fonctions côté serveur uniquement.
- **Performance du BFS** sur un grand arbre : index d'adjacence construit une fois, test de charge sur 2 000 personnes.
- **Dates approximatives** : les invariants ne rejettent qu'en cas de conflit certain (intervalles disjoints), sinon on bloquerait des saisies légitimes.
- Aucune donnée réelle n'est manipulée dans cette phase : pas de garde-fou destructif à déclencher.

## 9. Hors périmètre

- Toute I/O : base, Drizzle, Notion, Blob, emails.
- Layout graphique (ELK, coordonnées) : phase 4. Cette phase produit seulement le graphe logique à dessiner.
- Écriture des suggestions et de l'activité en base, notifications, escalade planifiée : phase 6 (la phase 2 fournit seulement les règles).
- GEDCOM : phase 6.

## 10. Définition de terminé

- Tous les lots cochés, CI verte, couverture au-dessus des seuils.
- La fixture Marchand est la source unique de la famille de test.
- Les cas de la section 6.6 et les libellés des maquettes sont des tests nommés qui passent.
- La spec est mise à jour si une règle a dû être précisée (avec une entrée dans `docs/DECISIONS.md` si elle change une décision).

## 11. PR proposées

1. `feat(domain): types, fixture Marchand et dates à précision variable` (lots 1 et 2).
2. `feat(domain): graphe, invariants et sélection d'affichage` (lots 3 et 4).
3. `feat(domain): calcul et nommage des liens de parenté` (lot 5), avec le tableau des libellés à relire.
4. `feat(access): policy de périmètre, gardiens et visibilité` (lot 6).
5. `feat(domain): recherche et durcissement` (lots 7 et 8).

## Bilan (2026-10-09)

- 305 tests, couverture de `src/server` : 99 % des lignes, 92 % des branches (seuils 95 / 90 dans `vitest.config.ts`, contrôlés en CI par `bun run test:coverage`).
- Mutation testing (`bun run test:mutation`, local) : 92 % au global, 94 % sur `access.policy.ts`, 96 % sur `fuzzy-date.helper.ts`, 86 % sur `kinship.helper.ts`. Les survivants restants sont des gardes défensives sans effet observable (identifiant `null`, valeurs par défaut jamais atteintes, ordre de parcours sans conséquence).
- Stryker et TypeScript 7 : `tsconfigFile` pointe vers un fichier absent (l'API JS de TS 7 n'existe plus) et `coverageAnalysis` est à `off` (le runner Vitest attribue mal la couverture des contextes construits hors des tests).
- Règles précisées en route : veuvage sans remariage gardé dans l'arbre (spec 8.1), fiches ouvertes définies par le périmètre (ADR 14), gardiens à la plus petite distance (spec 6.2), recherche « née X » sur le nom de naissance.
