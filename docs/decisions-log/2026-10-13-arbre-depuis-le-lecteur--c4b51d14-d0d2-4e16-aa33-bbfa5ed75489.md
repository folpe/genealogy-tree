---
schemaVersion: 1
id: "adr:c4b51d14-d0d2-4e16-aa33-bbfa5ed75489"
createdAt: "2026-10-13T11:33:24.000Z"
title: "L'arbre s'ouvre sur la famille du lecteur"
status: accepted
deciders: ["folpe", "claude"]
supersedes: []
---

# L'arbre s'ouvre sur la famille du lecteur

## Context

`/tree` s'ouvrait sur toute la famille : l'arbre de la rencontre familiale, centré sur la branche fondatrice. Retour de Folpe le 2026-10-13 : tout est relatif au point de vue. Sa compagne veut voir son côté, lui le sien ; un compte sans fiche reliée tombait en plus sur l'ancêtre le plus haut, et son sablier ne montrait aucun ascendant.

## Decision

Sans vue demandée, l'arbre s'ouvre sur la famille du lecteur : « notre famille » s'il a une union en cours (les deux lignées du couple au-dessus, leurs enfants en dessous, `selectSubgraph` vue `couple`), sinon son sablier. Un compte sans fiche voit toute la famille, avec l'invitation à se relier (« C'est moi », réservé à un admin sans fiche, sur une fiche libre). « Toute la famille » reste une vue, celle des rassemblements. « Retour à l'arbre » revient à la vue que l'on quittait.

## Consequences

Positive:

- Chacun voit d'abord ce qui le concerne ; les deux côtés d'un couple apparaissent ensemble.
- La vue réunion reste à un tap.

Negative:

- Une branche absente des données (le côté de Folpe) reste invisible tant qu'elle n'est pas saisie : il faut l'édition (phase 6).

## Alternatives considered

- Garder toute la famille par défaut : écarté, la vue d'un autre que soi.
- Sablier du lecteur par défaut, même en couple : écarté, un côté du couple manque.

## Reversal cost

Faible : la vue par défaut se résout en un point (`getTreeForViewer`, `shownView`).
