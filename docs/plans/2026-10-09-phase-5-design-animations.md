# Phase 5 : design system, thèmes et animations

- **Date :** 2026-10-09
- **Spec :** [refonte Racines](../specs/2026-10-09-refonte-racines.md), sections 9, 10 (socle et "Quel est notre lien ?"), 12, 14
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
  - [x] `src/motion/gsap.ts` : point d'entrée unique, DrawSVG et Inertia enregistrés, mouvement réduit lu au même endroit (caméra, relayout, éventail, chemin). Flip, SplitText et Draggable s'y ajouteront avec leur premier usage ; les durées restent près de chaque animation.
- [x] Chargement différé de GSAP et des plugins hors du chemin critique (import dynamique après le premier rendu) : écarté après mesure, décision validée par Folpe le 2026-10-15.
  - [x] Mesuré (2026-10-15) : ~32 Ko gzip, chargés seulement par `/tree` et `/ancestors` (découpage par route) ; sur ces pages GSAP est le chemin critique (caméra, entrée). Retenu : pas d'import dynamique (journal du 2026-10-15, GSAP sans import différé).
- [ ] Animations de la spec 9 : logo dessiné et titre révélé (Connexion), arbre qui pousse génération par génération au premier chargement, liens dessinés (DrawSVG), nœud créé qui apparaît à sa place (branché en phase 6).
  - [x] Logo dessiné et titre révélé (Connexion), en CSS seul : traits en `pathLength="1"` tracés par `stroke-dashoffset`, titre découpé mot à mot au rendu serveur (`RevealTitle`), petit arbre du canevas qui pousse rangée par rangée. La page de connexion ne charge pas GSAP (journal du 2026-10-15) ; fondu seul avec le mouvement réduit.
  - [x] Arbre qui pousse au premier affichage de l'onglet : génération par génération, bulles en échelle et fondu, traits tracés (DrawSVG), poignées en fondu (`src/motion/entry.ts`, vagues de `tree.entry.ts`). Marqué avant l'affichage par un script sous nonce : l'arbre rendu au serveur ne clignote pas ; repli CSS s'il ne vient pas. Fondu seul avec le mouvement réduit.

### Lot 4 : fiche personne

- [x] `components/PersonSheet/` : panneau latéral desktop (420 px max) et bottom sheet mobile (vaul, poignée, coins 28 px), conforme aux maquettes Arbre et MobileAlbum.
- [ ] Contenu : avatar 120 px, kicker de lien de parenté relatif à l'utilisateur ("Ton demi-frère"), nom, nom de naissance, dates selon la visibilité, badge "Sourcé", lignes à filets (lieu, parents, frères et sœurs dont demi-, conjoint, enfants, "A aussi été élevé par"), note.
  - [x] Avatar, kicker de lien, nom, dates selon la visibilité, parents, unions, enfants ; raccourcis (fiche complète, ancêtres, centrer) et ajout de proches. Frères et sœurs (demi- à part), « A aussi été élevé par » et badge « Sourcé » faits depuis.
  - [x] Note en fin de fiche (maquette Arbre : filet, texte secondaire), lue en visibilité complète seulement, modifiable sur place dans sa lignée (zone de texte : Entrée va à la ligne, toucher ailleurs enregistre). Reste : la nature de la source dans le badge (« Sourcé : acte de décès »), qui attend que les faits sourcés soient reliés à leurs sources (phase 6, lot 3).
- [x] Encart de droits : "Dans ta lignée : tu modifies directement", "Ancêtre commun...", "Fiche ouverte...", "Hors de ta lignée : ta suggestion ira à X" ; texte fourni par le serveur à partir de la policy.
  - [x] `rightsOf` et `rightsNotice` (`src/server/access/access.rights.ts`) : ta fiche, administrateur, ancêtre commun (ancêtre aussi d'un membre d'une autre branche), fiche ouverte, dans ta lignée, hors lignée avec les prénoms des gardiens (ou les administrateurs). `TreeForViewer.rights` les porte ; `RightsNoticeBox` les affiche dans le panneau et sur `/people/[id]`. Suggestions et veille de lignée annoncées au futur (« bientôt, tes suggestions iront à… ») tant que la phase 6 ne les a pas livrées.
- [x] Ouverture : l'avatar du nœud devient la photo de la fiche (Flip), contenu en cascade.
  - [x] `src/motion/fiche.ts` : sur grand écran, l'avatar part de la bulle touchée (FLIP mesuré à la main, sans le plugin Flip) quand elle est visible ; le contenu suit en cascade. Sur téléphone, la feuille monte déjà : la cascade seule. Mouvement réduit : un fondu. Corrigé au passage : la caméra ne recentre plus une bulle prise au doigt ou à la souris, seulement au clavier ; avec le mouvement réduit, elle sautait sous le doigt et le tap n'ouvrait pas la fiche.
- [x] Deep link `/people/[id]` et `?fiche=<id>` sur l'arbre (`?p` est déjà la personne au centre ; `history.pushState` suivi par Next plutôt que nuqs), le retour navigateur ferme la fiche.

### Lot 5 : recherche ⌘K

- [x] `components/CommandPalette/` (cmdk) : raccourci ⌘K / Ctrl+K, recherche floue insensible aux accents et aux noms de naissance (helper de la phase 2), résultats avec bulle, nom, "née X", années et lien de parenté en accent, "Récemment consultés" sans requête.
- [x] Sélection : vol caméra jusqu'à la personne puis ouverture de la fiche. `camera.flyTo` prend un rappel d'arrivée (aussi appelé si un geste coupe le vol, aussitôt avec le mouvement réduit) ; `FamilyTree` reçoit la personne à révéler (`reveal`) et l'arbre n'ouvre la fiche qu'à l'arrivée, d'une bulle à l'écran dont l'avatar peut partir. Une bulle déjà bien visible ouvre sa fiche tout de suite.

### Lot 6 : lien de parenté animé

- [x] `components/RelationshipFinder/` : bouton "Notre lien" sur la fiche, carte en haut du canevas avec la phrase ("Maxime est ton demi-frère."), étapes en pilules, ancêtres communs.
- [x] Chemin : arêtes du chemin en accent et dessinées (DrawSVG), reste de l'arbre estompé, caméra cadrée sur le chemin.
  - [x] Arêtes en accent, reste estompé, caméra cadrée sous la carte.
  - [x] Tracé DrawSVG (lot 3) : le chemin s'allume pas à pas de Toi vers la cible, chaque trait dans le sens du parcours (`steps` de `pathHighlight`), pilules d'étapes au même rythme ; posé d'un coup avec le mouvement réduit.
  - [x] Lien long (lot 7) : cadré en entier, ancêtres communs compris, sous la carte et hors de la colonne des boutons (`Cover`), jusqu'en vue de loin sous la limite des gestes, sans bond au geste suivant ; « Me retrouver » masqué pendant un lien ; étapes sur une ligne qui défile sur téléphone. Vérifié à 360 px, sur Pixel 7 et sur ordinateur.

### Lot 7 : mobile

- [ ] Layout mobile conforme à MobileAlbum : arbre plein écran, barre de recherche et cloche en haut, barre d'onglets flottante en bas, fiche en bottom sheet.
  - [x] Arbre plein écran sous l'en-tête et les onglets, signe de la marque, barre « Trouver quelqu'un » en haut, vues et « Unions passées » en pastilles flottantes (effacées sous une carte « Notre lien »), commandes de caméra au-dessus des onglets. Reste : la cloche (phase 6).
- [x] Gestes : pan, pinch, tap, appui long pour les actions rapides ; cibles >= 44 px. Appui long, clic droit ou Maj + F10 : menu accroché à la bulle (ajouts selon la policy, ouvrir, centrer, ancêtres), pas de survol (journal du 2026-10-14).
- [ ] Safe areas iOS, `100dvh`, clavier virtuel sans casse de mise en page.
  - [x] Clavier virtuel : `--keyboard-inset` mesuré par `visualViewport` (`keyboard-inset.ts`), dialogue d'ajout posé au-dessus, liste ⌘K raccourcie, champ en cours ramené en vue (feuille vaul, page de fiche). Vérifié en émulation Pixel 7 ; reste à confirmer sur un iPhone réel, avec les marges sûres.

### Lot 8 : écran Connexion

- [x] Conforme à la maquette Connexion : étapes email -> "Regarde tes emails" -> proposition de passkey -> connecté ; formulaire de demande d'accès.
  - [x] Cadre commun (`src/components/auth/auth-shell.tsx`) : canevas à trame avec un petit arbre anonyme (rien de la famille avant connexion), carte des étapes ; carte seule sur téléphone. Connexion, invitation et demande d'accès le partagent. Le lien magique ramène sur `/login/passkey` (la route porte l'étape, sans nuqs) : proposition de passkey, puis l'arbre ; déjà une passkey, droit à l'arbre. Focus posé sur le titre à chaque étape.

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
