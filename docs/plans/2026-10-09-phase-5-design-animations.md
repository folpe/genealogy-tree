# Phase 5 : design system, thèmes et animations

- **Date :** 2026-10-09
- **Spec :** [refonte Ances-Tree](../specs/2026-10-09-refonte-ances-tree.md), sections 9, 10 (socle et "Quel est notre lien ?"), 12, 14
- **Visuels :** [DESIGN.md](../design/DESIGN.md) (source de vérité des tokens et composants), maquettes `docs/design/maquettes/` : `Arbre`, `ArbreSombre`, `Connexion`, `MobileAlbum`, `DirAlbum`, `DirVeillee`
- **Statut :** en cours

## Objectif et sortie attendue

L'app ressemble trait pour trait aux maquettes validées, dans les deux thèmes : Album premium en clair, Veillée en sombre. Les animations GSAP donnent vie à l'arbre sans jamais gêner l'usage.

Sortie : les écrans Connexion, Arbre (fiche, recherche ⌘K, lien de parenté) et Mobile sont implémentés et validés par Folpe face aux maquettes, avec les deux thèmes et le mode mouvement réduit.

## Prérequis

- Phase 4 : moteur de rendu, caméra, zoom sémantique.
- Phase 3 : auth (magic link, passkey) pour l'écran Connexion.
- Phase 2 : calcul de parenté et nommage français des liens (`ton demi-frère`, `la cousine de ton père`).

## Décisions prises

- ADR 05 : GSAP 3.13+ (tous plugins gratuits) avec `@gsap/react`, presets centralisés dans `src/motion/`.
- ADR 11 : Album premium en clair, Veillée en sombre, trame de points commune, un seul accent, pas de légende ni de marqueur d'union, les couleurs ne codent pas le genre.
- Spec 12 : formes rondes, cibles >= 44 px, texte jamais minuscule, pas d'emoji ni de point d'exclamation dans la copy.

## Lots

### Lot 1 : tokens et thèmes

- [x] `src/styles/tokens.css` : tokens OKLCH dans `@theme` (Tailwind 4.3) traduits depuis DESIGN.md : papier, canevas, surface, carte, encre, textes secondaire / tertiaire / discret, bordure, filet, bulle vivant / décédé, trait d'arbre, accent, accent foncé, fond teinté accent, ombres.
- [x] Thème sombre Veillée par `[data-theme="dark"]` et `prefers-color-scheme`, mêmes noms de tokens (la correspondance clair -> sombre de DESIGN.md est la référence).
- [x] Bascule de thème persistée (cookie lu côté serveur pour éviter le flash), option "Système" (menu de l'avatar).
- [x] Polices : Fraunces (axes `opsz`, `SOFT` à 100, `WONK` à 0) et Figtree via `next/font`, sous-ensembles latin, `font-variation-settings` global.
- [x] Trame de points en utilitaire (`bg-dots`) avec variables de position pilotées par la caméra (phase 4).
- [x] Vérification de contraste AA automatisée sur toutes les paires texte / fond des deux thèmes (test Vitest sur les tokens).

### Lot 2 : composants de base

- [ ] (Remplacé : composants à la demande, décision du 2026-10-13) `components/ui/` : Button (principal encre, secondaire cerclé, discret), IconButton rond 46 px, Pill / Segmented (nav des vues), Chip personne (bulle 30 px + prénom), Switch, Input, Select, Tabs, Badge, Kicker (petites capitales accent), Card 24-28 px, Sheet (vaul), Dialog (Radix), Toast (sonner), Tooltip.
- [ ] Variantes avec cva, `cn` (clsx + tailwind-merge), icônes lucide, tout conforme à DESIGN.md.
- [ ] Header d'app : logo, nav pilule Arbre / Ancêtres / Frise / Carte / Récits, recherche, cloche Activité avec pastille, avatar.
  - [x] Logo, onglets Arbre et Ancêtres, avatar (les autres vues, la recherche et la cloche arrivent avec leurs lots).
- [ ] Page de démonstration interne `/dev/ui` (exclue en production) pour la revue visuelle.

### Lot 3 : système d'animation

- [ ] `src/motion/` : enregistrement unique des plugins (DrawSVG, Flip, SplitText, InertiaPlugin, Draggable), presets de durée et d'easing (doux, jamais élastique excessif), `gsap.matchMedia()` pour `prefers-reduced-motion` (fondus courts uniquement).
- [ ] Chargement différé de GSAP et des plugins hors du chemin critique (import dynamique après le premier rendu).
- [ ] Animations de la spec 9 : logo dessiné et titre révélé (Connexion), arbre qui pousse génération par génération au premier chargement, liens dessinés (DrawSVG), nœud créé qui apparaît à sa place (branché en phase 6).

### Lot 4 : fiche personne

- [x] `components/PersonSheet/` : panneau latéral desktop (420 px max) et bottom sheet mobile (vaul, poignée, coins 28 px), conforme aux maquettes Arbre et MobileAlbum.
- [ ] Contenu : avatar 120 px, kicker de lien de parenté relatif à l'utilisateur ("Ton demi-frère"), nom, nom de naissance, dates selon la visibilité, badge "Sourcé", lignes à filets (lieu, parents, frères et sœurs dont demi-, conjoint, enfants, "A aussi été élevé par"), note.
  - [x] Avatar, kicker de lien, nom, dates selon la visibilité, parents, unions, enfants ; raccourcis (fiche complète, ancêtres, centrer) et ajout de proches. Reste : frères et sœurs, « A aussi été élevé par », badge « Sourcé », note.
- [ ] Encart de droits : "Dans ta lignée : tu modifies directement", "Ancêtre commun...", "Fiche ouverte...", "Hors de ta lignée : ta suggestion ira à X" ; texte fourni par le serveur à partir de la policy.
- [ ] Ouverture : l'avatar du nœud devient la photo de la fiche (Flip), contenu en cascade.
- [x] Deep link `/people/[id]` et `?fiche=<id>` sur l'arbre (`?p` est déjà la personne au centre ; `history.pushState` suivi par Next plutôt que nuqs), le retour navigateur ferme la fiche.

### Lot 5 : recherche ⌘K

- [x] `components/CommandPalette/` (cmdk) : raccourci ⌘K / Ctrl+K, recherche floue insensible aux accents et aux noms de naissance (helper de la phase 2), résultats avec bulle, nom, "née X", années et lien de parenté en accent, "Récemment consultés" sans requête.
- [ ] Sélection : vol caméra jusqu'à la personne puis ouverture de la fiche. Pour l'instant la sélection ouvre la fiche ; le vol caméra viendra avec la fiche en panneau (lot 4).

### Lot 6 : lien de parenté animé

- [ ] `components/RelationshipFinder/` : bouton "Notre lien" sur la fiche, carte en haut du canevas avec la phrase ("Maxime est ton demi-frère."), étapes en pilules, ancêtres communs.
- [ ] Chemin : arêtes du chemin en accent et dessinées (DrawSVG), reste de l'arbre estompé, caméra cadrée sur le chemin.

### Lot 7 : mobile

- [ ] Layout mobile conforme à MobileAlbum : arbre plein écran, barre de recherche et cloche en haut, barre d'onglets flottante en bas, fiche en bottom sheet.
- [ ] Gestes : pan, pinch, tap, appui long pour les actions rapides ; cibles >= 44 px.
- [ ] Safe areas iOS, `100dvh`, clavier virtuel sans casse de mise en page.

### Lot 8 : écran Connexion

- [ ] Conforme à la maquette Connexion : étapes email -> "Regarde tes emails" -> proposition de passkey -> connecté ; formulaire de demande d'accès.

## Tests

- Unitaires : contrastes des tokens, presets motion (reduced motion), formatage de la fiche selon la visibilité, recherche floue.
- Composants (Testing Library) : Sheet, Dialog, Switch, Tabs accessibles au clavier.
- Playwright (section 16) : connexion, exploration, recherche ⌘K, ouverture de fiche, lien de parenté, mobile (viewport 390x844), bascule de thème.
- Régression visuelle : captures Playwright des écrans clés dans les deux thèmes, comparées aux maquettes à chaque PR (seuil de tolérance documenté).

## Critères d'acceptation

- [ ] Écrans Connexion, Arbre et Mobile validés par Folpe côte à côte avec les maquettes, clair et sombre.
- [ ] Contraste AA sur tout le texte, focus visible partout, navigation clavier complète de la fiche et de ⌘K.
- [ ] Aucune animation sous `prefers-reduced-motion` hormis des fondus courts.
- [ ] GSAP absent du bundle initial de `/login`, LCP < 2,5 s en 4G simulée.
- [ ] Aucun flash de thème au chargement.

## Risques

- **Écart maquette / réalité** : les maquettes utilisent des initiales ; les vraies photos changent la densité. Prévoir un réglage de cadrage et un fallback initiales élégant.
- **Flip entre canevas SVG et panneau HTML** : transition entre deux systèmes de coordonnées. Prototype dédié en début de lot 4.
- **Performance des ombres et du flou** sur mobile milieu de gamme : limiter `backdrop-filter`, préférer des ombres statiques.

## Hors périmètre

- Écrans d'édition, Activité, Membres, Suggestion (phase 6), Éventail, Frise, Carte (phase 7), Récits (phase 8).

## Définition de terminé

CI verte, captures de régression à jour, validation visuelle de Folpe sur la preview Vercel (desktop et iPhone), DESIGN.md mis à jour si une valeur a bougé pendant l'implémentation.

## Découpage en PR

1. `feat(ui): tokens, thèmes et polices` (lot 1)
2. `feat(ui): composants de base et header` (lot 2)
3. `feat(motion): système GSAP et reduced motion` (lot 3)
4. `feat(tree): fiche personne` (lot 4)
5. `feat(tree): recherche ⌘K` (lot 5)
6. `feat(tree): lien de parenté animé` (lot 6)
7. `feat(mobile): arbre et fiche mobile` (lot 7)
8. `feat(auth): écran de connexion` (lot 8)
