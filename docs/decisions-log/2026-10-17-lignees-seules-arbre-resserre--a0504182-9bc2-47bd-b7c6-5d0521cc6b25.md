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

- Au départ, la lignée directe est dépliée (la personne au centre, son ou ses conjoints, tous leurs ascendants, leurs descendants) ; chaque fratrie de la lignée est repliée à chaque génération, avec ses familles, comme la famille d'origine de tout conjoint venu d'ailleurs (`src/lib/tree/tree.lineage.ts`). Chaque fratrie repliée laisse un repère « +N frères et sœurs » au bout de la fratrie, côté extérieur ; le menu d'une bulle replie ou affiche sa famille, sa fratrie, sa branche ; « Lignées seules » et « Tout afficher » dans les réglages. Les plis sont ceux du lecteur, sur son appareil (`localStorage`, `tree-folds.storage.ts`) : une clé par vue, format versionné ; une mémoire d'une autre version ou abîmée est ignorée et l'arbre repart des plis de départ, et sans stockage l'arbre s'affiche normalement. Aucune écriture serveur. La position de la caméra reste propre à l'onglet (`sessionStorage`, `tree-memory.storage.ts`), qui ne retient plus les plis.
- Le père à gauche, la mère à droite dans chaque couple homme-femme ; sinon l'ordre enregistré. Les fratries restent par ordre de naissance. Un membre de la lignée ne quitte son rang pour le bord de sa fratrie que si ses frères et sœurs croiseraient une famille dépliée : celle de son conjoint, ou celle du conjoint d'un de ses descendants en lignée directe (`src/lib/tree/tree.order.ts`).
- Zéro croisement sur la lignée directe (décision de Folpe, même jour, comme MyHeritage) : déplier l'un replie l'autre. Dans chaque couple de la lignée dont les deux familles sont affichées, la famille d'origine de l'un et les collatéraux de l'autre que l'ordre range de son côté, quand leur descendance descend jusqu'au couple, se disputent le même intervalle ; les deux à la fois croisent forcément. Le côté qui n'a pas bougé se replie : la dernière action du lecteur gagne (`src/lib/tree/tree.contest.ts`, appliqué à chaque demande de pli dans `use-folded-tree.ts`). Quand les deux apparaissent d'un coup (« Tout afficher », une mémoire d'avant), la famille de la personne au centre reste entière et celle de son conjoint se replie derrière son repère ; plus haut dans la lignée, les collatéraux cèdent à la famille d'origine. « Tout afficher » devient ainsi l'état le plus complet sans croisement, non plus tout déplié. Le pli posé tout seul s'annonce sans bloquer (région d'état du canevas : « Famille de Sophie repliée pour garder l'arbre lisible ») et se retient comme les autres.
- Un nouveau rendu serveur dans la même vue (une fiche ajoutée) garde les plis du lecteur : ceux qui ne valent plus tombent, une personne ajoutée reste visible, sa branche dépliée.
- Remplace la règle du 2026-10-13 : l'arbre est dessiné serré sur ce qui est affiché. Chaque pli redemande un placement à ELK dans un Web Worker (retour de `src/workers/elk.worker.ts`, `tree-layout.client.ts` et de `worker-src 'self'`), puis la transition animée existante ; la caméra compense le déplacement de la bulle touchée, qui reste exactement à sa place à l'écran. Le premier dessin, lignées seules, vient toujours du rendu serveur.

## Consequences

Positive:

- Un arbre lisible d'emblée, qu'on ouvre famille par famille, sans croisement sur la lignée directe dans aucun état que le lecteur peut atteindre (`tree.crossings.test.ts` place chaque état atteignable des familles de test).
- Plus de trous : l'arbre se resserre à chaque pli, la bulle touchée sert de repère.

Negative:

- Les autres bulles bougent à chaque pli, ce que la règle du 2026-10-13 évitait ; la bulle touchée immobile et l'animation doivent suffire à garder ses repères.
- Le worker ELK revient (environ 300 ms pour 500 personnes dépliées, hors du thread principal ; l'ordre des familles y coûte 2 ms).
- Au retour sur l'arbre avec des plis retenus autres que ceux de départ, le serveur rend les plis de départ et le navigateur redessine aussitôt : un glissement visible.
- On ne voit jamais à la fois les cousins du côté de sa mère (s'ils descendent jusqu'à sa génération) et la famille de son conjoint : déplier l'un replie l'autre, annoncé. Les croisements hors de la lignée directe (entre familles de collatéraux) ne sont pas couverts.
- Chaque demande de pli calcule l'ordre des familles sur le thread principal, une à quelques fois (2 ms pour 500 personnes chacune).

## Alternatives considered

- Garder le placement d'origine et seulement masquer : l'arbre lignées seules serait plein de vides.
- Recalculer au serveur à chaque pli : un aller-retour réseau par geste, et l'état de pliage à porter dans l'URL ou en base, alors qu'il est propre au lecteur.

## Reversal cost

Moyen : revenir au placement d'origine se fait dans `use-folded-tree.ts` (historique de #109 et du 2026-10-13) ; les plis par défaut tiennent à `defaultFolds`, qu'on peut vider pour retrouver tout déplié.
