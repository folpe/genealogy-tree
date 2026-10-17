---
schemaVersion: 1
id: "adr:a0504182-9bc2-47bd-b7c6-5d0521cc6b25"
createdAt: "2026-10-17T16:30:00.000Z"
title: "Lignées seules, arbre resserré"
status: accepted
deciders: ["folpe", "claude"]
supersedes: ["adr:a71236e8-fb0f-44b1-9e0f-6c2a667a957e"]
---

# Lignées seules, arbre resserré

## Context

Retour de Folpe du 2026-10-17 sur « Toute la famille » : trop de familles à la fois, des traits qui se croisent, et l'ordre ne suit pas la convention des tableaux d'ascendance (Sosa, FamilySearch, Ancestry, MyHeritage). Il demande un arbre centré sur les lignées directes, les collatéraux repliés par défaut et dépliables un par un, le père à gauche et la mère à droite à chaque génération, et un placement qui dépend de ce qui est déplié pour gêner le moins possible. La règle du 2026-10-13 (« Pliage sans nouveau placement ») laissait un vide à chaque branche pliée : avec la plupart des collatéraux repliés, l'arbre serait troué.

## Decision

- Au départ, la lignée directe est dépliée (la personne au centre, son ou ses conjoints, tous leurs ascendants, leurs descendants) ; chaque fratrie de la lignée est repliée à chaque génération, avec ses familles, comme la famille d'origine de tout conjoint venu d'ailleurs (`src/lib/tree/tree.lineage.ts`). Chaque fratrie repliée laisse un repère « +N frères et sœurs » au bout de la fratrie, côté extérieur ; le menu d'une bulle replie ou affiche sa famille, sa fratrie, sa branche ; « Lignées seules » et « Tout afficher » dans les réglages. L'état est celui du lecteur, dans l'onglet (`sessionStorage`, `tree-memory.storage.ts`), sans écriture serveur.
- Le père à gauche, la mère à droite dans chaque couple homme-femme ; sinon l'ordre enregistré. Les fratries restent par ordre de naissance. Un membre de la lignée ne quitte son rang pour le bord de sa fratrie que si ses frères et sœurs croiseraient une famille dépliée : celle de son conjoint, ou celle du conjoint d'un de ses descendants en lignée directe (`src/lib/tree/tree.order.ts`).
- Remplace la règle du 2026-10-13 : l'arbre est dessiné serré sur ce qui est affiché. Chaque pli redemande un placement à ELK dans un Web Worker (retour de `src/workers/elk.worker.ts`, `tree-layout.client.ts` et de `worker-src 'self'`), puis la transition animée existante ; la caméra compense le déplacement de la bulle touchée, qui reste exactement à sa place à l'écran. Le premier dessin, lignées seules, vient toujours du rendu serveur.

## Consequences

Positive:

- Un arbre lisible d'emblée, sans croisement sur la lignée directe dans les états testés (`tree.crossings.test.ts`), qu'on ouvre famille par famille.
- Plus de trous : l'arbre se resserre à chaque pli, la bulle touchée sert de repère.

Negative:

- Les autres bulles bougent à chaque pli, ce que la règle du 2026-10-13 évitait ; la bulle touchée immobile et l'animation doivent suffire à garder ses repères.
- Le worker ELK revient (environ 300 ms pour 500 personnes dépliées, hors du thread principal ; l'ordre des familles y coûte 2 ms).
- Un croisement reste possible quand on déplie à la fois les cousins du côté de la mère et la famille du conjoint : géométrie, pas réglage (documenté dans les tests).

## Alternatives considered

- Garder le placement d'origine et seulement masquer : l'arbre lignées seules serait plein de vides.
- Recalculer au serveur à chaque pli : un aller-retour réseau par geste, et l'état de pliage à porter dans l'URL ou en base, alors qu'il est propre au lecteur.

## Reversal cost

Moyen : revenir au placement d'origine se fait dans `use-folded-tree.ts` (historique de #109 et du 2026-10-13) ; les plis par défaut tiennent à `defaultFolds`, qu'on peut vider pour retrouver tout déplié.
