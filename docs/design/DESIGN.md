# Racines - Design de référence

Source de vérité visuelle pour les phases 4 à 9. Toute valeur ci-dessous est extraite des maquettes validées par Folpe le 2026-10-09 (`docs/design/maquettes/`). En cas de conflit entre ce document et une maquette, la maquette fait foi pour le rendu, ce document pour les règles.

- Canvas en ligne (version vivante, interactive) : https://claude.ai/artifact/72o5WKvd2GawZpMCfdKKD2
- Spec produit : [../specs/2026-10-09-refonte-racines.md](../specs/2026-10-09-refonte-racines.md) (sections 6 droits, 8 vues, 9 animations, 12 direction visuelle)
- Décisions : [../DECISIONS.md](../DECISIONS.md) (ADR 05, 06, 07, 08, 11, 12)

## 1. Direction

- **Thème clair = "Album" premium** : papier crème, encre chaude, un seul accent terracotta. Les photos apportent la couleur, pas l'interface.
- **Thème sombre = "Veillée"** : nuit prune, accent ambre, même géométrie, mêmes composants.
- **Signature commune** : la trame de points sur le canevas.
- **Ton** : rond, calme, chaleureux, lisible par toutes les générations. Rien d'anguleux, pas de pastel multiple, pas de dégradé décoratif.
- **Interdits** : légende dans l'arbre, marqueur d'union, couleur qui code le genre, tiret long dans les textes, emoji.

## 2. Écrans, maquettes et routes

| # | Écran | Maquette | Route Next cible | Phase |
|---|---|---|---|---|
| 01 | Connexion, magic link, passkey, demande d'accès | `Connexion.dc.html` (prop `etape`) | `src/app/(public)/login` | 3 (UI finale 5) |
| 02 | Arbre, fiche, ⌘K, lien de parenté, périmètre | `Arbre.dc.html` (prop `vue` : hugo / isabelle), `ArbreSombre.dc.html` | `src/app/(app)/tree`, fiche en `?person=` (nuqs) et `src/app/(app)/people/[id]` en accès direct | 4 rendu, 5 design, 6 droits |
| 03 | Ancêtres en éventail | `Eventail.dc.html` | `src/app/(app)/ancestors` (`/ancestors?p=&g=`) | 7 |
| 04 | Frise | `Frise.dc.html`, `FriseSombre.dc.html` | `src/app/(app)/timeline` | 7 |
| 05 | Carte des origines | `Carte.dc.html`, `CarteSombre.dc.html` | `src/app/(app)/map` | 7 |
| 06 | Récits | `Recits.dc.html`, `RecitsSombre.dc.html` | `src/app/(app)/stories` et `stories/[id]` | 8 (lecteur animé 9) |
| 07 | Suggérer hors de sa lignée | `Suggestion.dc.html` | dialogue depuis la fiche (`?person=&suggest=1`) | 6 |
| 08 | Activité : à décider, veille de lignée, mes suggestions | `Activite.dc.html` | `src/app/(app)/inbox` | 6 |
| 09 | Famille connectée : membres, invitations, admin | `Membres.dc.html` (prop `vue` : membre / admin) | `src/app/(app)/members` (+ `src/app/(app)/admin` pour la partie admin) | 6 |
| 10 | Email de veille de lignée | `EmailVeille.dc.html` | `src/server/notifications/emails/` (React Email) | 6 |
| 11 | Mobile : arbre et fiche | `Mobile.dc.html` (390 x 844) | mêmes routes, layout responsive | 5 |
| - | Référence des deux directions | `DirAlbum.dc.html`, `DirVeillee.dc.html` | - | - |

Les maquettes sombres de Suggestion, Activité, Membres, Éventail, Connexion et Mobile n'existent pas : elles s'obtiennent par la table de tokens (section 3), qui est exactement la transformation utilisée pour générer les maquettes sombres existantes.

## 3. Tokens de couleur

Palette stricte : aucune autre couleur dans l'UI. Les valeurs OKLCH sont calculées depuis les hex (D65, OKLab).

| Rôle | Variable CSS | Clair (hex) | Clair (OKLCH) | Sombre (hex) | Sombre (OKLCH) |
|---|---|---|---|---|---|
| Fond de page | `--color-paper` | `#F6F2EA` | `oklch(96.2% 0.011 84.6)` | `#1D1A2B` | `oklch(23.0% 0.033 291.7)` |
| Fond du canevas | `--color-canvas` | `#F1EBE0` | `oklch(94.2% 0.016 82.8)` | `#221E33` | `oklch(25.0% 0.039 292.0)` |
| Surface (pilules, champs) | `--color-surface` | `#FBF9F5` | `oklch(98.3% 0.006 84.6)` | `#262238` | `oklch(26.7% 0.041 291.7)` |
| Carte, panneau, bord des bulles | `--color-card` | `#FFFFFF` | `oklch(100% 0 0)` | `#2A2640` | `oklch(28.6% 0.047 290.1)` |
| Encre (texte, bouton principal) | `--color-ink` | `#1F1C19` | `oklch(22.9% 0.007 67.4)` | `#F5EFE6` | `oklch(95.4% 0.014 78.3)` |
| Texte secondaire | `--color-ink-2` | `#6F675D` | `oklch(51.8% 0.018 73.5)` | `#B7AFC9` | `oklch(76.9% 0.038 299.6)` |
| Texte tertiaire | `--color-ink-3` | `#8A8278` | `oklch(61.1% 0.018 73.6)` | `#8E86A8` | `oklch(63.9% 0.051 295.7)` |
| Texte discret, placeholder | `--color-ink-4` | `#9A9186` | `oklch(66.1% 0.019 73.0)` | `#7C7398` | `oklch(57.7% 0.057 295.7)` |
| Bordure | `--color-line` | `#E4DCCF` | `oklch(89.7% 0.020 80.1)` | `#3A3456` | `oklch(34.7% 0.059 291.1)` |
| Filet interne | `--color-rule` | `#EFE9DF` | `oklch(93.6% 0.015 80.7)` | `#322D4A` | `oklch(31.6% 0.051 291.1)` |
| Bulle vivant | `--color-bubble` | `#EAE3D7` | `oklch(91.8% 0.018 81.3)` | `#3D3758` | `oklch(35.8% 0.057 291.6)` |
| Bulle décédé | `--color-bubble-past` | `#E3DED6` | `oklch(90.2% 0.012 79.8)` | `#2F2A45` | `oklch(30.3% 0.048 291.8)` |
| Traits de l'arbre | `--color-link` | `#C9BCA9` | `oklch(80.1% 0.030 77.5)` | `#5E5680` | `oklch(47.8% 0.067 292.4)` |
| Accent | `--color-accent` | `#A4532F` | `oklch(53.4% 0.118 43.4)` | `#FFB86B` | `oklch(83.4% 0.125 66.9)` |
| Accent appuyé (hover) | `--color-accent-strong` | `#7C3D21` | `oklch(43.5% 0.097 43.4)` | `#FFC98C` | `oklch(87.0% 0.099 69.3)` |
| Fond teinté accent | `--color-accent-soft` | `#F3E4DA` | `oklch(92.8% 0.021 56.1)` | `#3F3343` | `oklch(34.1% 0.032 317.6)` |
| Texte sur encre | `--color-on-ink` | `#F6F2EA` | = paper | `#1D1A2B` | = paper |

Ombres : base `rgba(31, 28, 25, a)` en clair, `rgba(8, 6, 18, min(a x 2.5, 0.7))` en sombre ; halo accent `rgba(164, 83, 47, a)` en clair, `rgba(255, 184, 107, a)` en sombre.

Usage de l'accent, exclusivement : personne sélectionnée, "Toi", chemin du lien de parenté, libellés en petites capitales, badges de compteur, curseurs actifs (frise, carte). Jamais en fond de grande surface. Pas de vert ni de rouge : accepté, refusé et annulé se disent par le texte et la forme.

Teintes de génération (`--color-gen-0` à `--color-gen-4`, `globals.css`) : seulement l'arbre vu de loin (zoom sémantique, `k < 0,45`), une pastille par personne teintée selon sa génération à l'écran, en boucle sur cinq teintes sourdes de la palette (terre cuite, ocre, sauge, ardoise, prune), éclaircies en sombre. Elles ne disent aucun statut ; "Toi" garde l'accent.

### 3.1 Bloc `@theme` (Tailwind 4)

```css
@import 'tailwindcss';

@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));

@theme {
  --color-paper: oklch(96.2% 0.011 84.6);
  --color-canvas: oklch(94.2% 0.016 82.8);
  --color-surface: oklch(98.3% 0.006 84.6);
  --color-card: oklch(100% 0 0);
  --color-ink: oklch(22.9% 0.007 67.4);
  --color-ink-2: oklch(51.8% 0.018 73.5);
  --color-ink-3: oklch(61.1% 0.018 73.6);
  --color-ink-4: oklch(66.1% 0.019 73.0);
  --color-line: oklch(89.7% 0.020 80.1);
  --color-rule: oklch(93.6% 0.015 80.7);
  --color-bubble: oklch(91.8% 0.018 81.3);
  --color-bubble-past: oklch(90.2% 0.012 79.8);
  --color-link: oklch(80.1% 0.030 77.5);
  --color-accent: oklch(53.4% 0.118 43.4);
  --color-accent-strong: oklch(43.5% 0.097 43.4);
  --color-accent-soft: oklch(92.8% 0.021 56.1);
  --color-on-ink: var(--color-paper);

  --font-display: var(--font-fraunces), ui-serif, Georgia, serif;
  --font-sans: var(--font-figtree), ui-sans-serif, system-ui, sans-serif;

  --radius-pill: 999px;
  --radius-card: 28px;
  --radius-panel: 24px;
  --radius-field: 16px;

  --shadow-card: 0 20px 50px oklch(22.9% 0.007 67.4 / 0.07);
  --shadow-float: 0 0 0 1px var(--color-line), 0 10px 24px oklch(22.9% 0.007 67.4 / 0.1);
  --shadow-bubble: 0 0 0 1px var(--color-line), 0 8px 20px oklch(22.9% 0.007 67.4 / 0.1);
  --shadow-bubble-selected: 0 0 0 2px var(--color-accent), 0 12px 28px oklch(53.4% 0.118 43.4 / 0.22);

  --grid-dot: oklch(22.9% 0.007 67.4 / 0.24);
}

@layer base {
  :root[data-theme='dark'] {
    --color-paper: oklch(23.0% 0.033 291.7);
    --color-canvas: oklch(25.0% 0.039 292.0);
    --color-surface: oklch(26.7% 0.041 291.7);
    --color-card: oklch(28.6% 0.047 290.1);
    --color-ink: oklch(95.4% 0.014 78.3);
    --color-ink-2: oklch(76.9% 0.038 299.6);
    --color-ink-3: oklch(63.9% 0.051 295.7);
    --color-ink-4: oklch(57.7% 0.057 295.7);
    --color-line: oklch(34.7% 0.059 291.1);
    --color-rule: oklch(31.6% 0.051 291.1);
    --color-bubble: oklch(35.8% 0.057 291.6);
    --color-bubble-past: oklch(30.3% 0.048 291.8);
    --color-link: oklch(47.8% 0.067 292.4);
    --color-accent: oklch(83.4% 0.125 66.9);
    --color-accent-strong: oklch(87.0% 0.099 69.3);
    --color-accent-soft: oklch(34.1% 0.032 317.6);
    --grid-dot: oklch(95.4% 0.014 78.3 / 0.16);
    --shadow-card: 0 20px 50px oklch(10% 0.02 290 / 0.18);
  }
}
```

Implémentation (`src/app/globals.css`) : mêmes valeurs, mais chaque token porte ses deux thèmes via `light-dark(clair, sombre)`, piloté par `color-scheme` sur `:root`. Le bloc sombre n'est donc écrit qu'une fois et l'absence de `data-theme` suit le système sans duplication.

Bascule : attribut `data-theme` sur `<html>`, valeur `light`, `dark` ou absente (= suit `prefers-color-scheme`). Script inline dans le `<head>` du layout racine pour poser l'attribut avant la peinture (pas de flash). Préférence enregistrée en cookie (lisible côté serveur) et dans le profil du membre. `<meta name="theme-color">` mis à jour avec `--color-paper`.

### 3.2 Contrastes (WCAG 2.2) et correctifs à appliquer

| Paire | Ratio | Verdict |
|---|---|---|
| Encre sur papier, clair / sombre | 15.2 / 14.9 | AAA |
| Secondaire sur papier (clair) | 4.98 | AA |
| Secondaire sur carte (sombre) | 6.89 | AA |
| Accent sur papier (clair) | 4.88 | AA |
| Accent sur papier (sombre) | 9.98 | AAA |
| Tertiaire sur carte (clair) | 3.79 | **échec AA petit texte** |
| Discret sur carte (clair / sombre) | 3.10 / 3.29 | **échec AA petit texte** |

Règles d'implémentation :
- `ink-3` et `ink-4` réservés au texte non essentiel de 18px et plus, aux placeholders, aux icônes décoratives.
- Les années sous les bulles (12px dans les maquettes) passent en `ink-2`, ou `ink-3` foncé à `#736B61` (4.70 sur papier) si l'on veut garder la hiérarchie. À trancher en phase 5 ; défaut : `ink-2`.

## 4. Trame de points

| | Clair | Sombre |
|---|---|---|
| Couleur | `rgba(31, 28, 25, 0.24)` | `rgba(245, 239, 230, 0.16)` |
| Point | `radial-gradient(color 1px, transparent 1.5px)` | idem |
| Pas | 46px | 46px |
| Support | fond du canevas (`--color-canvas`) uniquement | idem |

```css
.canvas-grid {
  background-color: var(--color-canvas);
  background-image: radial-gradient(var(--grid-dot) 1px, transparent 1.5px);
  background-size: calc(46px * var(--cam-k, 1)) calc(46px * var(--cam-k, 1));
  background-position: var(--cam-x, 0) var(--cam-y, 0);
}
```

Règle : la trame **suit la caméra**. La transform de la caméra (pan `x`, `y`, zoom `k`) est poussée dans `--cam-x`, `--cam-y`, `--cam-k` à chaque frame GSAP (un seul `gsap.quickSetter` par variable), sans re-render React. En dessous de `k = 0.5`, la trame passe à un pas de 92px pour ne pas devenir un aplat (fondu croisé de 150ms). Elle doit rester visible sans zoom : ne jamais baisser l'opacité sous ces valeurs.

## 5. Typographie

- **Fraunces** (variable, axes `opsz` 9-144, `wght` 300-700, `SOFT` 100, `WONK` 0) : titres, noms de personnes, initiales des bulles, citations de récits. Toujours `font-variation-settings: "SOFT" 100, "WONK" 0`.
- **Figtree** (variable 400-700) : toute l'UI, les données, les boutons.
- Chargement : `next/font/google` pour les deux, `display: swap`, sous-ensemble `latin` + `latin-ext`, exposés en `--font-fraunces` et `--font-figtree`.

Échelle réellement utilisée dans les maquettes (px) :

| Usage | Taille | Police | Graisse |
|---|---|---|---|
| Titre d'écran (h1) | 30-34 | Fraunces | 400 |
| Nom dans la fiche | 32 | Fraunces | 400, letter-spacing -0.01em |
| Phrase du lien de parenté | 26 | Fraunces | 400 |
| Marque "Racines" | 24 | Fraunces | 500 |
| Initiales bulle 76px / avatar 120px | 24 / 42 | Fraunces | 400 |
| Nom sous une bulle | 17 | Fraunces | 400 |
| Corps, boutons, champs | 15 | Figtree | 400 / 600 |
| Corps secondaire, onglets | 14 | Figtree | 500 |
| Notes, méta | 13 | Figtree | 400 |
| Années, libellés en petites capitales | 12 | Figtree | 400 / 600 |

Petites capitales accent (relation, catégorie) : 12px, 600, `letter-spacing: 0.14em`, `text-transform: uppercase`, couleur accent. Années et compteurs : `font-variant-numeric: tabular-nums`. Taille minimale de texte : 12px (11px toléré uniquement dans les badges).

## 6. Formes, espacements, ombres

- Rayons : 999px pour boutons, pilules, onglets, champs de recherche ; 28px pour les panneaux principaux (canevas, fiche) ; 24px pour les cartes secondaires et dialogues ; 16-18px pour les encarts internes ; bulles toujours rondes.
- Bulles : 76px en desktop avec bord `--color-card` de 4px ; 120px dans la fiche avec bord 5px ; 56-60px en mobile ; 30px dans les chips ; 42px dans les résultats de recherche.
- Ombres : `--shadow-card` pour les panneaux, `--shadow-float` pour les barres flottantes et menus, `--shadow-bubble` / `--shadow-bubble-selected` pour les bulles.
- Grille de mise en page desktop : marge 32px, gouttière 20px, header 18px de padding vertical, fiche en colonne de 360 à 420px.
- Cibles tactiles : 44px minimum (46-50px pour les boutons principaux).
- Boutons : principal = fond encre, texte `on-ink`, 50px ; secondaire = fond carte, bordure `line`, 50px ; pilule d'action = fond `paper` dans une barre flottante.

## 7. Règles de l'arbre

1. Pas de légende, pas de marqueur d'union. Une union = un simple trait horizontal entre les deux bulles.
2. Les couleurs ne codent ni le genre ni la branche. Vivant = `bubble`, décédé = `bubble-past` avec texte `ink-3`.
3. Seule l'union en cours est dessinée. Les unions passées sont masquées ; option "Montrer les unions passées" (désactivée par défaut) dans les réglages d'affichage.
4. Un enfant d'une union précédente est rattaché **directement au parent** : la branche part du bas de la bulle du parent (`M px (py+42) C px (py+142) kx (ky-100) kx ky`), jamais d'un point d'union fantôme. L'ancien conjoint n'est visible que depuis la lignée de l'enfant.
5. Branche enfant d'une union en cours : courbe depuis le milieu du trait d'union (`M mx my C mx (my+110) kx (ky-100) kx ky`), trait 2px `--color-link`, extrémités arrondies.
6. Demi-frères et demi-sœurs : listés ensemble dans "Frères et sœurs" de la fiche, la relation précise ("Ton demi-frère") apparaît dans les petites capitales.
7. Lien de parenté : le chemin passe en accent, 3px ; le reste à 32 % d'opacité.
8. Périmètre ("Ce que je peux modifier") : hors périmètre à 32 % d'opacité, dans le périmètre bord encre 2px.
9. "Toi" : nom en accent à la place du prénom.

## 8. Composants à créer

| Composant | Anatomie | États | Base technique |
|---|---|---|---|
| `PersonBubble` | disque, bord carte, initiales ou photo, nom en Fraunces, années | vivant, décédé, sélectionné (anneau accent 2px + halo), moi (nom accent), hors périmètre (opacité 0.32), sur le chemin, inconnu (pointillés `link`, "À découvrir"), focus clavier (anneau encre 2px décalé) | bouton SVG `<g role="button">` dans le canevas |
| `UnionLink` | segment entre deux bulles | normal, sur le chemin, estompé | `<path>` SVG, DrawSVG |
| `ChildBranch` | courbe de Bézier | depuis une union, depuis un parent seul, sur le chemin, estompé | `<path>` SVG, `d3-shape` |
| `PersonSheet` (fiche) | avatar 120, relation en petites capitales, nom, nom de naissance, dates et lieux, badge Sourcé, liste à filets (lieu, parents, frères et sœurs, conjoint, enfants, note), `RightsNotice`, actions | personne vivante proche, vivante éloignée (résidence "Visible par ses proches"), décédée, moi, mineur (initiales seulement) | panneau desktop, `BottomSheet` mobile, Flip GSAP |
| `RightsNotice` | puce + phrase | dans ta lignée (puce encre), ancêtre commun, fiche ouverte, hors lignée "ta suggestion ira à X" (puce accent), ta fiche | composant pur, texte calculé par la policy |
| `PersonChip` | mini bulle 30px + prénom | normal, hover, désactivé (déjà inscrit) | bouton |
| `NavPills` | 5 onglets Arbre, Ancêtres, Frise, Carte, Récits | actif (fond encre), inactif | liens Next, `aria-current` |
| `CommandPalette` | champ 18px, section "Récemment consultés", résultats (bulle 42, nom, nom de naissance + années, relation en accent) | vide, résultats, aucun résultat ("Essaie un nom de naissance") | `cmdk` dans un dialogue Radix, recherche insensible aux accents |
| `RelationshipPanel` | petites capitales "Votre lien", phrase en Fraunces 26, étapes en pilules, ancêtres communs | ouvert, fermé | carte flottante en haut du canevas |
| `PerimeterToggle` | libellé "Ce que je peux modifier" + switch | off, on | Radix Switch |
| `CanvasControls` | zoom +, zoom -, "Me retrouver" | | boutons ronds 46px |
| `BottomSheet` | poignée, contenu de la fiche | replié, ouvert, plein écran | `vaul` |
| `SuggestionDiff` | champ, valeur actuelle barrée, nouvelle valeur, source jointe | ajout, modification, suppression | |
| `ActivityItem` | auteur, action, fiche, diff, actions | à décider (Accepter / Refuser), accepté, refusé, veille (Annuler), annulé (mention anti guerre d'édition), en attente avec barre d'escalade 14 jours | |
| `SourcedBadge` | coche + "Sourcé : <type de source>" | | pilule bordée |
| `EmptyAncestorSlot` | secteur ou bulle en pointillés "À découvrir" | survol, sélection | éventail et arbre |
| `TimelineRow`, `MapArc`, `StoryScene` | voir section 9 | | |

## 9. Écran par écran

### 01 Connexion
- Intention : entrer sans mot de passe, sentir tout de suite la famille.
- Contenu : canevas à trame avec un petit arbre (Hugo en accent, une place "?" en pointillés), carte à étapes.
- États (prop `etape`) : `email`, `envoye` (renvoyer, changer d'email), `passkey` ("Activer Face ID / Touch ID" ou "Plus tard"), `demande` (nom, email, "Qui es-tu dans la famille ?"), `demandeOk`.
- Implémentation : better-auth magic link + passkey (RP ID `folpe.me`), état d'étape en URL (nuqs) pour survivre au retour depuis l'email.

### 02 Arbre
- Intention : se retrouver, explorer, comprendre ce qu'on peut changer.
- Contenu : header (marque, `NavPills`, recherche ⌘K, cloche Activité avec compteur, avatar), canevas, fiche à droite.
- Interactions : clic sur une bulle = sélection + fiche ; barre d'actions flottante au-dessus de la bulle (+ Parent, + Enfant, + Conjoint si modifiable, "Suggérer un ajout" sinon) ; "Notre lien" ; interrupteur de périmètre ; "Me retrouver" ; ⌘K.
- Droits affichés : `RightsNotice` dans la fiche, bouton Modifier ou Suggérer selon la policy. La maquette se joue en deux points de vue (Hugo, Isabelle) pour vérifier les cas de la spec 6.6.
- Attention : la fiche ouverte vit dans l'URL ; le layout vient du worker ELK ; la maquette place les nœuds à la main.

### 03 Ancêtres en éventail
- Demi-cercle de 4 générations centré sur "Toi", côté paternel à gauche, secteurs `bubble` / `bubble-past`, cases inconnues en pointillés qui invitent à compléter.
- Panneau : ancêtre sélectionné, statistiques "Tes racines" (connus / total, plus ancien, terres d'origine), actions "Voir dans l'arbre", "Modifier" ou "Demander à la famille" / "Ajouter" sur une case vide.
- Attention : `d3-shape` `arc()` pour les secteurs ; les libellés suivent l'angle et basculent pour rester lisibles.

### 04 Frise
- Une ligne par personne, groupée par génération ; barre de vie arrondie (décédé `bubble-past`, vivant `bubble` qui s'estompe vers aujourd'hui) ; points d'événements (naissance, mariage plein, déménagement en anneau, décès).
- Bande de contexte historique discrète (1914-1918, 1939-1945, 1968, 2000).
- Curseur d'année (clic, glisser, flèches) avec encart "En 1963 : Luc naît à Toulouse. Henri a 61 ans...".
- Filtres "Toute la famille" / "Ma lignée directe".
- Attention : `d3-scale` pour l'axe ; dates à précision variable (spec 5) rendues en extrémités floues.

### 05 Carte des origines
- Lieux en pastilles dimensionnées par le nombre de personnes, arcs de migration courbes, curseur d'époque (1900, 1950, 2000, Aujourd'hui).
- Panneau : lieu sélectionné ("Berceau des Marchand", naissances, mariages, décès, personnes) ou classement des lieux.
- Attention : maquette en SVG stylisé ; cible MapLibre + OpenFreeMap avec un style maison qui reprend les tokens (terre `bubble`, eau `canvas`, routes masquées), arcs en couche SVG ou deck calée sur la projection.

### 06 Récits
- Bibliothèque (récits, archive audio, récit en traitement avec étapes), bouton "Enregistrer un récit".
- Lecteur : scène 16:9 dans le style Album (chapitre, titre Fraunces, illustration au trait, citation sous-titrée), lecture / pause, chapitres, personnes et lieux cités en chips, transcription défilante (phrase courante en encre, autres en `ink-4`), "Exporter en vidéo".
- Attention : scènes paramétrées jouées en GSAP, export Remotion (ADR 10).

### 07 Suggérer
- Fiche hors périmètre (Anne pour Hugo) : explication "ta suggestion lui sera envoyée", `SuggestionDiff` champ par champ, justificatif optionnel (rend la suggestion "Sourcée"), mot au gardien, "Envoyer à Anne" inactif tant que rien ne change.
- Confirmation : "Envoyé à Anne. Sans réponse sous 14 jours, un admin prendra le relais."

### 08 Activité
- Onglets avec compteurs : "À décider" (première réponse d'un gardien tranche), "Veille de lignée" (Annuler en un clic ; une modification annulée ne peut pas être réappliquée directement), "Mes suggestions" (barre d'escalade).
- Réglage "Me prévenir : tout de suite / résumé quotidien".

### 09 Famille connectée
- Tous : inviter un proche (fiche du cercle ou des descendants + email), membres inscrits avec personne liée et statut (Propriétaire, Admin, Membre), invitations en cours.
- Admin : demandes d'accès à relier à une fiche, suggestions escaladées, Nommer / Retirer admin (jamais le propriétaire, jamais le dernier admin).

### 10 Email de veille
- Avant / après, source jointe, boutons "C'est bon" et "Annuler la modification" (lien signé à usage unique), rappel des autres nouveautés, pied avec "Passer au résumé quotidien" et désinscription.
- Attention : React Email, styles inline, rendu testé en clair uniquement (les clients mail sombres inversent mal), largeur 600px.

### 11 Mobile
- Arbre plein écran avec trame, recherche et cloche en haut, onglets en pilule flottante en bas, fiche en `BottomSheet` (coins 28px, poignée).
- Attention : `user-scalable=no` conservé (ADR 07), `touch-action: none` sur le canevas, gestes pan / pinch gérés par la caméra, safe areas iOS.

## 10. Motion (GSAP)

Principes : d3 calcule, GSAP anime, React rend (ADR 05). Animations interruptibles, jamais bloquantes ; aucune animation ne retarde une action de plus de 150ms.

| Moment | Chorégraphie | Durée | Easing |
|---|---|---|---|
| Entrée de l'arbre | liens tracés en DrawSVG du haut vers le bas par génération, puis bulles en `scale 0.85 -> 1` + fondu, stagger par génération | 0.6s liens, 0.35s bulles, stagger 0.04s | `power2.out` |
| Caméra (pan, zoom, "Me retrouver", focus) | tween unique sur `{x, y, k}`, trame synchronisée | 0.7s | `power3.inOut` |
| Inertie au lâcher | InertiaPlugin sur le pan | selon vitesse | - |
| Ouverture de la fiche | Flip depuis la bulle vers l'avatar de la fiche, contenu en fondu décalé | 0.45s | `expo.out` |
| Lien de parenté | estompage du reste, puis chemin qui s'allume de "Toi" vers la cible (DrawSVG séquentiel), pilules d'étapes en stagger | 0.25s + 0.12s par segment | `power2.out` |
| Périmètre | fondu d'opacité des nœuds hors périmètre | 0.3s | `power1.out` |
| Éventail | déploiement angulaire depuis le centre, anneau par anneau | 0.5s par anneau, stagger 0.08s | `back.out(1.2)` |
| Frise | curseur qui glisse, encart qui se met à jour en SplitText (mots) | 0.3s | `power2.out` |
| Carte | arcs tracés en DrawSVG au changement d'époque, pastilles en `scale` | 0.8s | `power2.inOut` |
| Récits | scènes en timelines GSAP indexées sur l'audio (seek = timeline.progress) | selon scène | - |
| Bottom sheet | piloté par vaul | - | - |

`prefers-reduced-motion: reduce` : toutes les durées passent à 0 sauf les fondus d'opacité (0.15s), pas de DrawSVG, pas d'inertie, caméra en saut direct. Réglage équivalent dans le profil.

## 11. Accessibilité et mobile

- Navigation clavier complète dans le canevas : flèches pour passer de nœud en nœud (parent, enfant, conjoint, frère), Entrée ouvre la fiche, Échap ferme, ⌘K partout.
- Branches : « - » sur une bulle replie les branches qui en partent, « + » les déplie ; la bulle porte `aria-expanded`. Plier ne déplace aucune autre bulle : la branche laisse sa place vide, les repères restent. Les poignées sur les traits (« − », ou « +N » personnes cachées) sont hors du Tab, cible de 44 px à toute échelle.
- Chaque bulle a un nom accessible "Prénom Nom, années, relation".
- Focus visible : anneau encre 2px décalé de 2px (accent en sombre).
- Contrastes : voir 3.2.
- Mobile : `user-scalable=no` conservé, `touch-action: none` sur le canevas uniquement, cibles 44px, safe areas, onglets en bas.
- Langue : `lang="fr"`, textes en tutoiement, tirets simples uniquement.

## 12. Écarts connus à trancher

| Écart | Où | Proposition |
|---|---|---|
| Joseph et Victorine (parents d'Henri) et des arrière-grands-parents côté Blanc ont été ajoutés pour remplir l'éventail ; "le plus ancien" devient Joseph (1871) et "15 ancêtres connus sur 30" | `Eventail.dc.html` | Données fictives de démonstration, sans impact sur l'implémentation ; à aligner sur la famille de la spec si l'éventail sert de démo |
| Camille, fille de Claude, apparaît dans les demandes d'accès | `Membres.dc.html` | Idem, fictif |
| Années sous les bulles en `ink-3` (3.79:1) | toutes les vues d'arbre | Passer en `ink-2` (section 3.2) |
| Bouton principal en sombre = fond crème | maquettes sombres | Garder (cohérent avec le clair) ou passer en ambre ; à valider en phase 5 |
| Maquettes sombres absentes pour 7 écrans | section 2 | Dérivées par tokens, revue visuelle en phase 5 |
| Fiche `people/[id]` en page dédiée non maquettée | section 2 | Même composant que la fiche, en pleine largeur |
