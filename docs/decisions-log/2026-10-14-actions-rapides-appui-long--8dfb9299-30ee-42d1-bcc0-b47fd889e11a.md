---
schemaVersion: 1
id: "adr:8dfb9299-30ee-42d1-bcc0-b47fd889e11a"
createdAt: "2026-10-14T19:30:00.000Z"
title: "Actions rapides : appui long, clic droit et Maj + F10, sans survol"
status: accepted
deciders: ["folpe"]
supersedes: []
---

# Actions rapides : appui long, clic droit et Maj + F10, sans survol

## Context

La spec (section 7) et le plan de phase 6 prévoient des actions rapides sur une bulle : « survol desktop, appui long mobile ». Sur le canevas, la souris sert aussi à déplacer l'arbre : un menu qui apparaît au survol se montre à chaque passage et vient sous le curseur pendant un glissé. Les bulles sont des liens : sur iOS, l'appui long ouvre l'aperçu de lien, et Safari n'émet pas `contextmenu` au doigt.

## Decision

Un seul menu Radix (`DropdownMenu`), accroché au-dessus de la bulle et cerclé d'accent, ouvert par l'appui long au doigt (450 ms, 8 px de tolérance, détecté sur le canevas), le clic droit, la touche Menu ou Maj + F10. Il propose les ajouts que la policy permet (« + Parent », « + Enfant », « + Conjoint », sans « + Parent » quand il y en a deux), puis « Ouvrir la fiche », « Centrer l'arbre ici », « Ses ancêtres ». Le dialogue d'ajout est celui de la fiche. Pas de survol.

## Consequences

Positive:

- Le même menu au doigt, à la souris et au clavier ; focus, flèches et Échap viennent de Radix.
- Aucun menu ne surgit pendant qu'on explore l'arbre à la souris.

Negative:

- Sur ordinateur, le clic droit se découvre moins qu'un survol ; la fiche garde ses boutons d'ajout.
- « Modifier » et « Suggérer » attendent l'éditeur et les suggestions (phase 6).

## Alternatives

- Survol avec délai : écarté, il se déclenche pendant les glissés et cache les bulles voisines.
- `ContextMenu` de Radix : son appui long s'annule au moindre mouvement du doigt et ouvre le menu sous le doigt, pas au-dessus de la bulle.
