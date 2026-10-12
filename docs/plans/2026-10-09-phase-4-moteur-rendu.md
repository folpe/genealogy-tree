# Phase 4 : moteur de rendu de l'arbre

- **Date :** 2026-10-09
- **Spec :** [refonte Ances-Tree](../specs/2026-10-09-refonte-ances-tree.md), sections 4, 8, 8.1, 9, 14
- **Visuels :** [DESIGN.md](../design/DESIGN.md), maquettes `docs/design/maquettes/Arbre.dc.html`, `ArbreSombre.dc.html`, `Mobile.dc.html`
- **Statut :** en cours (lots 1 à 3 faits le 2026-10-12)

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

Les quatre premiers points étaient déjà livrés par la phase 2 (`src/server/family/family.display.ts`, `selectDisplayedGraph` -> `DisplayedGraph`) : c'est ce modèle que le layout consommera, pas de second modèle `RenderGraph`.

- [x] Transformation vers le modèle dessiné : nœuds personne et union, arêtes `partner`, `child`, `parent` (union passée masquée ou inconnue) et `raised`.
- [x] Filtre « unions passées » : masquées par défaut, enfants rattachés au parent visible ; un veuvage sans remariage reste l'union de référence ; l'union passée reste visible du côté de l'enfant.
- [x] Filiation `a_eleve` : arête `raised`, ignorée pour les générations.
- [x] Parent inconnu : union à un seul parent (`unknownPartner`).
- [x] Sélection de sous-graphe par vue (`src/server/family/family.subgraph.ts`, `selectSubgraph`) : descendants d'une racine, sablier (ancêtres au-dessus, descendance et conjoints en dessous, sans fratrie), profondeur paramétrable.
- [x] Tests : famille recomposée, veuvage et remariage, adoption, parent inconnu, consanguinité (cousins germains : ni personne ni lien en double). Les cycles sont refusés à l'écriture par `family.invariants.ts` (phase 2).

### Lot 2 : layout ELK en Web Worker

Prototype sur la famille réelle (branche `notion-import`, 103 fiches) le 2026-10-12. ELK seul, avec un nœud par union : 11 couples aux partenaires éloignés ou sur deux couches, et une couche intermédiaire par union. Retenu : **un bloc par couple**. Les partenaires sont côte à côte dans un même nœud ELK, avec un emplacement réservé pour un parent inconnu, et les enfants partent d'un port au milieu du trait d'union. Résultat : couples soudés par construction, une ligne par génération, 94 ms.

- [x] `src/lib/tree/tree.layout.ts` (`computeTreeLayout`) : blocs de couples, ports fixes (`FIXED_POS`), algorithme `layered` vers le bas, `NETWORK_SIMPLEX` pour les couches et le placement, espacements en paramètres (`LayoutMetrics`, bulle de 76 px), « a élevé » exclu du calcul des générations. Sortie : centre de chaque bulle, milieu de chaque union, emplacement de chaque parent inconnu.
- [x] Réponse d'ELK validée par Zod ; positions par identifiant, déterministes (même graphe, même placement).
- [x] Placement initial calculé au rendu serveur (`src/lib/tree/tree.instance.ts`, décision du 2026-10-12 « Placement de l'arbre calculé au rendu serveur »). Le Web Worker et le hook `useTreeLayout` (annulation, cache par empreinte, état `pending`) arrivent avec le premier nouveau placement fait dans le navigateur, au lot 5. Le worker se réduit à `import 'elkjs/lib/elk-worker.min.js'` (le script s'enregistre seul) ; le thread principal utilise `elkjs/lib/elk-api` avec `workerFactory`.
- [x] Routes (`src/lib/tree/tree.routes.ts`, `routeLinks`) : trait d'union droit d'un bord de bulle à l'autre, Bézier depuis le milieu du trait vers le haut de la bulle de l'enfant, branche directe depuis le bas de la bulle du parent (DESIGN.md, section 7), « a élevé » à part pour le pointillé. Pas besoin de d3-shape.
- [x] ~~Premier rendu depuis le dernier placement en cache (IndexedDB)~~ : abandonné, le rendu serveur arrive déjà dessiné.
- [x] Bench (`bun run bench`, ELK sans worker sur une machine de dev) : 200 personnes 30 ms, 500 personnes 87 ms (objectif 150 ms), 2 000 personnes environ 1 s, acceptable dans le worker.

### Lot 3 : rendu SVG

- [x] `src/components/family/family-tree.tsx` : un calque commun (que la caméra transformera au lot 4), les liens en SVG dessous, les bulles en liens HTML dessus comme dans la maquette Arbre (photo en `srcset`, focus et Entrée natifs). Modèle de rendu `drawTree` (`family-tree.helper.ts`) : positions et textes rédigés côté serveur, rien de plus que ce que la policy laisse passer. Surbrillances et chemin de parenté : phase 5.
- [x] Bulle (`person-bubble.tsx`, partagée avec la fiche) : bord blanc, initiales ou photo (`<img srcset>` signé et aperçu flou, pas de Next Image : décision de la phase 3), prénom, années ; états moi (« Toi » en accent), décédé, focus clavier. Sélectionné : avec la fiche en panneau (phase 5). Hors périmètre : avec l'interrupteur (phase 6). Les branches partent sous l'étiquette d'une bulle, jamais à travers.
- [x] Liens : un `<path>` par arête, calque mémoïsé ; une flèche ne re-rend que les deux bulles qui changent d'état. Identifiants de branche dédoublonnés (avis de la revue du lot 2).
- [ ] Virtualisation au-delà de 300 nœuds : reportée au lot 4, elle dépend du viewport que la caméra définit (103 fiches aujourd'hui).
- [x] Accessibilité : `role="tree"` / `treeitem` (motif « arbre de navigation » : chaque entrée est un lien), `aria-level` par génération, nom « Prénom Nom, années », focus itinérant, flèches spatiales (`treeNeighbors` : gauche et droite dans la génération, haut et bas vers le parent ou l'enfant le plus proche), Début et Fin, Entrée ouvre la fiche, focus visible. `aria-expanded` arrive avec le pliage (lot 5), Échap avec la fiche en panneau (phase 5). Testé dans Chromium mobile et desktop (`tests/e2e/tree.spec.ts`).

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
