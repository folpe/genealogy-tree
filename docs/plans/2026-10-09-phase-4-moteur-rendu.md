# Phase 4 : moteur de rendu de l'arbre

- **Date :** 2026-10-09
- **Spec :** [refonte Ances-Tree](../specs/2026-10-09-refonte-ances-tree.md), sections 4, 8, 8.1, 9, 14
- **Visuels :** [DESIGN.md](../design/DESIGN.md), maquettes `docs/design/maquettes/Arbre.dc.html`, `ArbreSombre.dc.html`, `Mobile.dc.html`
- **Statut :** à faire

## Objectif et sortie attendue

Un arbre complet, fluide et juste sur toute la famille réelle migrée en phase 3 : layout ELK calculé hors du thread principal sur un graphe à nœuds d'union, rendu SVG déclaratif par React, caméra pan / zoom à inertie pilotée par GSAP, zoom sémantique, vues descendants et sablier. Les unions passées sont masquées par défaut, les enfants d'une union précédente partent du parent.

Sortie : `/tree` affiche l'arbre de la famille à 60 fps sur un iPhone récent et un portable milieu de gamme, sans geler pendant le calcul du layout.

Le style visuel fin (tokens, thèmes, fiche, animations de mise en scène) est en phase 5. Ici, le rendu utilise déjà les tokens de DESIGN.md mais vise d'abord la justesse, la performance et la caméra.

## Prérequis

- Phase 2 : domaine pur testé (`server/family` helpers : graphe, invariants, parenté), `server/access/access.policy.ts`.
- Phase 3 : Next 16 en place, données réelles dans Neon, endpoint ou Server Component qui sert le graphe filtré par la policy de visibilité.

## Décisions prises

- ADR 05 : GSAP anime, d3 / ELK calculent, React rend. Aucune manipulation DOM par sélection d3.
- ADR 06 : graphe avec nœuds d'union, layout ELK.
- ADR 07 : `user-scalable=no` conservé, `touch-action: none` limité au canvas.
- ADR 11 : pas de légende ni de marqueur d'union, trame de points qui suit la caméra.
- Spec 8.1 : seule l'union en cours est dessinée ; option "Montrer les unions passées" désactivée par défaut ; `a_eleve` en trait pointillé fin.

## Lots

### Lot 1 : modèle de rendu (pur, testé)

- [ ] `src/server/family/family.graph.ts` (ou `src/lib/tree/`) : transformation `FamilyGraph -> RenderGraph` (nœuds personne, nœuds d'union, arêtes partenaire -> union, union -> enfant, parent -> enfant direct pour union passée masquée).
- [ ] Filtre "unions passées" : par défaut, une union terminée (divorce, séparation) n'est pas rendue ; ses enfants deviennent des arêtes directes depuis le parent visible. Veuvage : union conservée si l'option est active.
- [ ] Filiation `a_eleve` : arête marquée `kind: 'raised'`, jamais utilisée pour le rang générationnel.
- [ ] Parent inconnu : nœud d'union à un seul parent avec emplacement "parent à découvrir".
- [ ] Sélection de sous-graphe par vue : descendants d'une racine, sablier (ancêtres + descendants d'une personne centrale), profondeur maximale paramétrable.
- [ ] Tests Vitest exhaustifs : famille recomposée (Luc, Maxime, Sophie des maquettes), veuvage, adoption, parent inconnu, cycles rejetés, consanguinité (même ancêtre par deux chemins).

### Lot 2 : layout ELK en Web Worker

- [ ] `src/workers/layout.worker.ts` : `elkjs/lib/elk-api` + worker bundle, algorithme `layered`, direction `DOWN`, contraintes de couches par génération (`elk.layered.layering.strategy` + `layerConstraint` / priorités), partenaires côte à côte (ports et `elk.layered.crossingMinimization`), espacement issu des tokens.
- [ ] Contrat typé `LayoutRequest` / `LayoutResult` (Zod côté frontière worker), positions par id stables pour l'interpolation.
- [ ] Hook `useTreeLayout(graph, options)` : envoi au worker, annulation des requêtes obsolètes, cache par empreinte du graphe (même graphe = pas de recalcul), état `pending` sans bloquer le rendu précédent.
- [ ] Post-traitement des routes : courbes de Bézier organiques (d3-shape) depuis le milieu du trait d'union vers chaque enfant, branche directe depuis le parent pour une union passée.
- [ ] Fallback serveur ou premier rendu : positions du dernier layout en cache (IndexedDB par empreinte) pour un affichage instantané au retour.
- [ ] Bench : script Vitest bench sur 200, 500 et 2 000 personnes ; objectif < 150 ms pour 500 personnes hors thread principal.

### Lot 3 : rendu SVG

- [ ] `components/FamilyTree/FamilyTree.tsx` : SVG unique, groupe caméra transformé, calques ordonnés (liens, nœuds, surbrillances, chemin de parenté).
- [ ] `components/PersonNode/PersonNode.tsx` : bulle ronde à bord blanc, initiales ou photo (Next Image avec blur placeholder), prénom, années ; états sélectionné, moi, décédé, hors périmètre (estompé), conformes à DESIGN.md.
- [ ] Liens : un `<path>` par arête, mémoïsé, pas de re-render global au pan.
- [ ] Virtualisation : ne rendre que les nœuds dans le viewport élargi (quadtree d3 sur les positions) au-delà de 300 nœuds.
- [ ] Accessibilité : `role="tree"` / `treeitem`, `aria-level`, `aria-expanded`, navigation clavier (flèches parent / enfant / fratrie, Entrée ouvre la fiche, Échap ferme), focus visible.

### Lot 4 : caméra

- [ ] `src/motion/camera.ts` : état caméra `{x, y, k}` hors React (ref + `gsap.quickSetter` sur le `transform` du groupe), React ne re-rend pas à chaque frame.
- [ ] Pan : Pointer Events unifiés souris / tactile, Draggable + InertiaPlugin, bornes élastiques sur l'emprise du layout.
- [ ] Zoom : molette et trackpad (ctrlKey = pinch), pinch tactile à deux doigts, zoom centré sur le point, limites `kMin` / `kMax`.
- [ ] Vol caméra : `focusOn(id | ids[])` sur la trajectoire `d3.interpolateZoom`, durée proportionnelle à la distance, pilotée par une timeline GSAP interruptible.
- [ ] Trame de points : `background-position` et `background-size` du canevas synchronisés avec la caméra (spec 12 : points de 1,5 px tous les 46 px, 24 % clair, 16 % sombre), même setter que la caméra.
- [ ] `touch-action: none` sur le canvas et blocage de `gesturestart` limité à cette zone ; suppression de `useDisablePinch`.
- [ ] Double-clic / double-tap : recentrage sur le nœud. Bouton "Me retrouver".
- [ ] Mini-carte (`components/Minimap`) : positions réduites, rectangle de viewport déplaçable.

### Lot 5 : zoom sémantique et transitions de layout

- [ ] Trois niveaux de détail selon `k` : loin (points et lignées colorées par génération, pas de texte), moyen (bulles + prénoms), proche (photo, nom complet, années, actions rapides).
- [ ] Changement de niveau sans re-layout, par bascule CSS et rendu conditionnel mémoïsé.
- [ ] Plier / déplier une branche, changer de racine ou de vue : nouveau layout, puis interpolation par id des positions (GSAP, nœuds entrants en fondu + échelle, sortants en fondu), liens redessinés.
- [ ] Respect de `prefers-reduced-motion` : vols remplacés par un fondu court, pas d'inertie.

### Lot 6 : vues descendants et sablier

- [ ] État d'URL via nuqs : `/tree?p=<id>&view=descendants|hourglass&past=0|1`.
- [ ] Sablier : ancêtres au-dessus (layout ELK direction `UP` fusionné) et descendants en dessous de la personne centrale.
- [ ] Interrupteur "Montrer les unions passées" (désactivé par défaut) dans les réglages d'affichage.
- [ ] Interrupteur "Ce que je peux modifier" (maquette Arbre) : estompe les nœuds hors périmètre à partir du résultat de la policy servi par le serveur (le client ne calcule pas les droits).

## Tests

- Unitaires (Vitest) : transformation RenderGraph, filtres d'unions passées, sélection de sous-graphe, routes de liens, niveaux de zoom sémantique, état caméra (fonctions pures de bornes et d'interpolation).
- Worker : test d'intégration du contrat `LayoutRequest -> LayoutResult` avec elkjs en Node.
- Playwright (chromium + WebKit mobile) : chargement de `/tree`, pan, zoom, double-clic de recentrage, navigation clavier, bascule descendants / sablier, URL partageable qui rouvre la même vue, unions passées masquées puis affichées.
- Performance : trace Playwright mesurant les long tasks pendant le chargement et un pan continu.

## Critères d'acceptation

- [ ] Aucune long task > 50 ms sur le thread principal pendant le calcul du layout (ELK dans le worker).
- [ ] Pan et zoom à 60 fps sur la famille réelle (trace Chrome, appareil de référence documenté).
- [ ] LCP de `/tree` < 2,5 s en 4G simulée, premier rendu depuis le cache de layout au retour.
- [ ] Famille recomposée rendue comme la maquette Arbre : Maxime rattaché à Luc seul, ancienne conjointe absente, aucune légende, aucun marqueur d'union.
- [ ] La trame de points suit exactement la caméra (pas de glissement au zoom).
- [ ] Navigation au clavier complète et annoncée par VoiceOver (rôles d'arbre).
- [ ] `prefers-reduced-motion` respecté.

## Risques

- **ELK et les couples** : layered ne connaît pas les couples ; risque de partenaires éloignés. Mitigation : nœud d'union compact entre les partenaires, contraintes d'ordre dans la couche, post-traitement de compaction ; prototype en début de phase sur la famille réelle.
- **Taille du bundle** : elkjs est lourd (environ 1,5 Mo). Chargé uniquement dans le worker, à la demande.
- **Safari iOS** : gestes et `gesturestart`, inertie. Tester tôt sur appareil réel.
- **Consanguinité / mariages entre cousins** : un même ancêtre atteint par deux chemins. Le graphe à nœuds d'union le supporte, le layout doit éviter les arêtes très longues ; tester sur données réelles.

## Hors périmètre

- Thème sombre complet, fiche Flip, ⌘K, animations de mise en scène (phase 5).
- Édition (phase 6), éventail, frise, carte (phase 7).

## Définition de terminé

CI verte (lint, types, tests, build, knip, audit, gitleaks, e2e), critères d'acceptation cochés avec captures et traces jointes à la PR, preview Vercel testée sur iPhone et desktop par Folpe.

## Découpage en PR

1. `feat(tree): modèle de rendu et filtres d'unions` (lot 1)
2. `feat(tree): layout ELK en worker` (lot 2)
3. `feat(tree): rendu SVG et accessibilité` (lot 3)
4. `feat(tree): caméra GSAP, trame et mini-carte` (lot 4)
5. `feat(tree): zoom sémantique et transitions` (lot 5)
6. `feat(tree): vues descendants et sablier` (lot 6)
