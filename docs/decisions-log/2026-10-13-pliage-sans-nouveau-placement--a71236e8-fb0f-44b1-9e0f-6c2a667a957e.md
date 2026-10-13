---
schemaVersion: 1
id: "adr:a71236e8-fb0f-44b1-9e0f-6c2a667a957e"
createdAt: "2026-10-13T10:21:51.000Z"
title: "Pliage sans nouveau placement"
status: accepted
deciders: ["folpe", "claude"]
supersedes: []
---

# Pliage sans nouveau placement

## Context

Au lot 5 (#109), plier une branche recalculait le placement de tout l'arbre dans un Web Worker ELK, puis les bulles glissaient vers leurs nouvelles places, la bulle pliée restant fixe à l'écran. À l'usage sur téléphone, Folpe trouve ce mouvement perturbant : on était positionné quelque part, et après le pli les repères ont bougé. Sa demande : plier, sans recalculer le positionnement.

## Decision

Plier retire la branche et ne déplace rien d'autre : le dessin plié reprend le placement d'origine, porté par `TreeDrawing.layout` (`use-folded-tree.ts`, calcul synchrone). Les bulles cachées s'effacent, celles qui reviennent apparaissent. Plus aucun placement ne se calcule dans le navigateur : le worker ELK, `elk-api` et `worker-src` dans la CSP sont retirés. Les vues du lot 6 (descendants, sablier, racine) passent par un nouveau rendu serveur, comme le premier affichage (décision du 2026-10-12 « Placement de l'arbre calculé au rendu serveur »).

## Consequences

Positive:

- Repères stables : seule la branche pliée change à l'écran.
- Pliage instantané, sans attente de calcul ni état « occupé », et moins de code : ni worker, ni cache de placements, ni gestion des demandes concurrentes.

Negative:

- L'arbre ne se resserre pas : une branche pliée laisse un vide à sa place. Si le besoin d'un arbre compacté apparaît, une action explicite « Réorganiser » pourra redemander un placement au serveur.

## Alternatives considered

- Recalcul dans un worker, bulle pliée fixe à l'écran (#109) : écarté à l'usage, tout le reste bouge.
- Recalcul différé (bouton « Réorganiser ») : pas demandé à ce stade, ajoutable sans revenir sur cette décision.

## Reversal cost

Faible : `computeTreeLayout` reste inchangé côté serveur ; le worker se retrouve dans l'historique de #109 (`src/workers/elk.worker.ts`, `tree-layout.client.ts`).
