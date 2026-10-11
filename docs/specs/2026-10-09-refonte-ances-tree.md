# Refonte Ances-Tree v2

- **Date :** 2026-10-09 (révisée le même jour : modèle de droits par proximité, vues Frise et Carte, Récits)
- **Statut :** spec validée sur le principe, implémentation non démarrée
- **Décisions associées :** `docs/DECISIONS.md`
- **Maquettes :** canvas "Ances-Tree v2" (claude.ai/artifact/72o5WKvd2GawZpMCfdKKD2)

Ce document consigne tout ce qui a été décidé pour faire passer Ances-Tree au niveau supérieur : stack, produit, droits et visibilité, éditeur intégré, vues, animations, données, récits, feuille de route. Il fait foi tant qu'il n'est pas amendé.

---

## 1. Point de départ (audit du 2026-10-09)

### 1.1 Sécurité (critique)

- `/api/getNotionPeople` n'a aucun contrôle d'accès : toute la famille (noms, dates, villes, photos) est lisible publiquement avec un simple `curl`.
- L'"auth" est un flag `localStorage.access_granted = 'true'`, forgeable depuis la console.
- Mot de passe partagé comparé avec `===` (pas de temps constant), aucun rate-limit, `Access-Control-Allow-Origin: *`.

### 1.2 Bugs fonctionnels

- Modèle de données faux pour la généalogie : l'arbre part de la personne la plus âgée, ne descend que par ses enfants et ne garde que le premier partenaire. Disparaissent silencieusement : familles des conjoints, remariages, demi-fratries, branches non descendantes de la racine.
- Tri des `childrenIds` inopérant (`getNotionPeople.js` compare `birthDate` sur des chaînes).
- `ZoomControls` crée un nouveau `d3.zoom()` à chaque clic : l'état interne se désynchronise, la molette fait sauter le zoom ensuite.
- `handleToggleCollapse` perd la fonction `separation` : plier puis déplier décale les couples.
- Dimensions codées en dur (`1625x750`) : centrage et focus faux hors desktop standard.
- Filtre SVG `#glow` dupliqué dans chaque nœud avec le même id.
- `SynthesisSection` affiche `NaN%` sur liste vide ; `PersonCard` affiche " ans" sans date de naissance.
- Les URLs `file` des photos Notion expirent au bout d'une heure.
- d3 chargé deux fois (bundle `external` + `<script>` CDN).

### 1.3 Dette

- Une dizaine de dépendances mortes (`express`, `cors`, `node-fetch`, `undici`, `formdata-*`, `fetch-blob`, `clone`, `node-cache`, `data-uri-to-buffer`, `node-domexception`, `core-js`).
- Code mort (`InfoLine`, `SpinningCircle`, `Loader/index.tsx` vide, `isAuthenticated` inutilisé, script `server` vers un fichier absent).
- Résidus Tailwind v3 (`tailwind.config.js`, safelist, bloc de compat), deux CSS globaux, bundler Farm 1.x de niche, README de template, `.npmrc` qui contient une version de Node.
- Aucun test, aucune CI, aucun lint.

---

## 2. Vision

Une application familiale privée, belle et fluide, où chaque membre :

1. se connecte sans mot de passe,
2. retrouve sa place dans l'arbre ("C'est moi"),
3. explore l'histoire familiale par plusieurs vues : arbre, éventail, frise, carte,
4. complète librement sa propre lignée, sans demander la permission à personne,
5. à terme, transmet des récits et des témoignages, mis en scène dans des récits animés.

Priorité produit : **l'adoption**. Contribuer doit être immédiat ; les garde-fous sont dans la traçabilité et la proximité familiale, pas dans une modération centrale.

Notion est abandonné : Neon devient la source de vérité et l'édition se fait dans l'app.

---

## 3. Stack cible (alignée sur void-starter)

| Domaine | Choix |
|---|---|
| Runtime / PM | Bun 1.3.x, `engines.node >=24` |
| Framework | Next.js 16 App Router, React 19, Turbopack, `cacheComponents` |
| Langage | TypeScript 7 avec le `tsconfig.base` du starter (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noPropertyAccessFromIndexSignature`) |
| Lint / format | Biome 2.5, config de base du starter, `noConsole` en error |
| Hooks git | Lefthook (Biome, type-check et gitleaks en pre-commit, knip en pre-push), commitlint conventional |
| Style | Tailwind 4.3, tokens OKLCH dans `@theme`, `cn` (clsx + tailwind-merge), cva, Radix, lucide, sonner, vaul, cmdk |
| Animations | GSAP 3.13+ (tous plugins gratuits) + `@gsap/react` |
| Graphe / layout | ELK.js (layered) en Web Worker ; `d3-hierarchy`, `d3-shape`, `d3-interpolate`, `d3-scale` pour pedigree, éventail, frise et trajectoires caméra |
| Carte | MapLibre GL + tuiles vectorielles OpenStreetMap gratuites (OpenFreeMap), style sombre maison ; géocodage Base Adresse Nationale (France) et Nominatim (étranger) |
| Base de données | Neon Postgres + Drizzle |
| Auth | better-auth 1.6.x (magic link, passkey), adaptateur Drizzle |
| Emails | Resend + React Email |
| Fichiers | Vercel Blob (photos, documents, audio) |
| Validation | Zod 4 à toutes les frontières, `@t3-oss/env-nextjs` |
| URL state | nuqs |
| Logs / monitoring | pino ; Sentry optionnel |
| Analytics | Umami (déjà en place, `umami.voidcorp.io`) |
| Tests | Vitest 4 + Testing Library + jsdom, Playwright (chromium) |
| CI | Workflow du starter : lint, type-check, test, build, knip, `bun audit`, gitleaks, e2e |
| Hébergement | Vercel, sur `famille.folpe.me` |
| Récits (plus tard) | Enregistrement navigateur (MediaRecorder), transcription speech-to-text (Whisper open-weight par défaut), structuration par LLM peu cher via AI SDK (DeepSeek V3 ou Kimi K2, hébergés hors Chine, ADR 13), récits animés GSAP, export vidéo Remotion |

App unique, pas de monorepo Turborepo : une seule cible, le monorepo serait du cérémonial.

---

## 4. Architecture

```
src/
  app/
    (public)/login/            # connexion, demande d'accès, acceptation d'invitation
    (app)/tree/                # arbre (Server Component qui charge le graphe)
    (app)/timeline/            # frise
    (app)/map/                 # carte
    (app)/people/[id]/         # deep link vers une fiche (+ récits)
    (app)/inbox/               # suggestions reçues, activité sur ma lignée
    (app)/admin/               # comptes, demandes d'accès, litiges, import / export
    api/auth/[...all]/         # better-auth
  actions/                     # *.actions.ts (defineAction / defineFormAction)
  server/
    family/                    # family.repository | service | helper | types | mapper
    access/                    # access.policy (périmètre, gardiens, visibilité) + tests
    suggestions/               # suggestions.repository | service | types
    activity/                  # journal, veille de lignée, annulation
    members/                   # comptes, invitations, demandes d'accès
    places/                    # lieux, géocodage
    stories/                   # récits (plus tard)
    notifications/             # emails (React Email + Resend)
    gedcom/                    # import / export
  components/
    FamilyTree/  PersonNode/  PersonSheet/  CommandPalette/  RelationshipFinder/
    Timeline/  FamilyMap/  Minimap/  ZoomControls/  EditDrawer/  SuggestionDiff/  ...
  workers/layout.worker.ts     # ELK
  motion/                      # timelines GSAP partagées, presets, reduced-motion
  proxy.ts
```

Flux de dépendances à sens unique : composant -> action -> service -> repository -> DB. Toutes les règles de droits et de visibilité vivent dans `server/access/access.policy.ts`, fonctions pures testées, appelées par chaque service. L'UI ne fait qu'en afficher le résultat.

---

## 5. Modèle de données

Pensé pour la généalogie dès le départ.

- `persons` : prénoms, nom d'usage, nom de naissance, genre, notes, `photo_media_id`, `is_living` (dérivé ou forcé), `visibility` (`famille` par défaut, `cercle` pour restreindre), `created_by`, timestamps.
- `unions` : deux partenaires, type (`mariage`, `pacs`, `union_libre`, `inconnu`), début, fin, motif de fin (`deces`, `divorce`, `separation`).
- `parent_child` : parent, enfant, type de filiation (`biologique`, `adoptive`, `a_eleve` pour un beau-parent qui a élevé l'enfant, `inconnue`), `union_id` optionnel (l'union dont l'enfant est issu).
- `events` : personne ou union, type (`naissance`, `deces`, `mariage`, `bapteme`, `inhumation`, `demenagement`, `autre`), date à précision variable, lieu, `source_id` optionnel.
  - Date : `date_value` + `date_precision` (`exacte`, `mois`, `annee`, `vers`, `avant`, `apres`, `entre`) + `date_value_end` pour `entre`.
- `places` : libellé, ville, code postal, région, pays, lat/lng, source du géocodage.
- `residences` : personne, lieu, période (date à précision variable). Alimente la carte des migrations.
- `sources` : type (`acte`, `livret`, `photo`, `temoignage`, `autre`), description, fichier Blob optionnel.
- `media` : URL Blob, type (`photo`, `document`, `audio`, `video`), légende, date, personnes liées, blur placeholder.
- `users`, `sessions`, `accounts`, `passkeys`, `verifications` : gérés par better-auth.
- `memberships` : `user_id`, `person_id` (lien "C'est moi", obligatoire), `is_admin`, `invited_by`, statut.
- `invitations` : email, personne pré-liée, invitant, expiration, token.
- `access_requests` : nom, email, "qui êtes-vous dans la famille", message, statut.
- `suggestions` : auteur, personne cible, `payload` (diff validé par Zod), gardiens destinataires, statut, décideur, commentaire, échéance d'escalade.
- `activity` : acteur, action, entité, avant / après, date, `reverted_by`. Base de l'historique, de la veille de lignée et de l'annulation.
- `stories`, `story_segments` (plus tard) : voir section 11.

Invariants vérifiés côté service (et testés) : pas de cycle de filiation, au plus deux parents biologiques, cohérence des dates (naissance avant décès, parent né avant l'enfant), pas d'union d'une personne avec elle-même.

---

## 6. Droits et visibilité : la proximité familiale remplace les rôles

### 6.1 Principe

Chaque compte est lié à une personne de l'arbre ("C'est moi"). Ce que l'on peut faire sur une fiche dépend de **la place de cette fiche par rapport à soi dans l'arbre**, pas d'un rôle attribué à la main. Objectif : tout le monde contribue dès le premier jour, et personne d'extérieur à une branche ne peut la réécrire sans l'accord de ses proches.

### 6.2 Définitions

- **Cercle proche** d'une personne X : X, ses conjoints, ses parents, ses enfants, ses frères et sœurs (demi compris).
- **Périmètre** d'un membre lié à la personne M :
  1. le cercle proche de M (le "plus ou moins un niveau") ;
  2. **toute la lignée ascendante** de M : parents, grands-parents, arrière-grands-parents, sans limite, et leurs conjoints ;
  3. tous les descendants de M et leurs conjoints ;
  4. les **fiches ouvertes** : personnes qu'aucun membre inscrit n'a dans son cercle proche (branches sans personne connectée).
- **Gardiens** d'une personne P : P elle-même si elle a un compte ; sinon les membres inscrits les plus proches de P dans le graphe (3 au plus), en pratique ses enfants, parents, conjoint, frères et sœurs inscrits.

### 6.3 Modifier

| Situation | Ce qui se passe |
|---|---|
| La fiche est dans mon périmètre | Je modifie directement. |
| La fiche est hors de mon périmètre | Je **suggère**. La suggestion part aux gardiens de la personne, pas aux admins. Un gardien accepte ou refuse en un clic, depuis l'app ou l'email. |
| Aucun gardien ne répond sous 14 jours | La suggestion est escaladée aux admins. |
| Ancêtre commun à plusieurs branches (ex. arrière-grands-parents de cousins) | Chacun le modifie directement (il est dans la lignée de tous). La veille de lignée garantit que les autres le voient. |

Garde-fous sans friction :

- **Veille de lignée** : toute modification d'une fiche de mon périmètre faite par quelqu'un d'autre m'est notifiée (immédiatement ou en résumé quotidien), avec **annulation en un clic**.
- **Anti guerre d'édition** : une modification annulée ne peut pas être réappliquée directement par la même personne ; elle devient une suggestion aux gardiens.
- **Faits sourcés** : un fait rattaché à une source (acte, livret, photo) affiche un badge "Sourcé". Le modifier exige d'apporter une autre source, sinon la modification devient une suggestion.
- **Historique complet** par fiche : qui, quoi, quand, avec restauration de n'importe quelle version.

### 6.4 Qui voit quoi

| Information | Membres de la famille | Personnes de mon périmètre (et moi) |
|---|---|---|
| Structure de l'arbre, noms, liens | oui | oui |
| Personnes décédées : tout (dates, lieux, photos, documents, récits) | oui | oui |
| Personnes vivantes : année de naissance, ville de naissance, photo de profil | oui | oui |
| Personnes vivantes : date exacte, résidence actuelle, contact, autres photos | non | oui |
| Mineurs : photo et détails | non (prénom et initiales seulement) | cercle proche uniquement |

- Une personne qui a un compte peut restreindre sa fiche (`visibility = cercle`) ou l'ouvrir à toute la famille.
- Personne hors de la famille ne voit rien : app 100 % authentifiée, `noindex`.
- Les admins voient tout pour régler les litiges ; leurs consultations de fiches restreintes sont journalisées.

### 6.5 Comptes

- Deux statuts seulement : **membre** (tout le monde) et **admin** (quelques personnes).
- **Tout membre peut inviter** quelqu'un de son cercle proche ou de ses descendants : il choisit la fiche correspondante, l'invité reçoit un email. C'est le moteur d'adoption.
- Les autres arrivées passent par une **demande d'accès** (nom, email, "qui es-tu dans la famille"), validée par un admin, qui relie la personne à sa fiche.
- Connexion : **magic link** par email, puis **passkey** proposée (Face ID / Touch ID). Les passkeys sont rattachées au domaine racine `folpe.me` (RP ID) pour survivre à un changement de sous-domaine ; les emails partent de `famille@folpe.me` (SPF, DKIM et DMARC Resend sur `folpe.me`). Sessions en cookie httpOnly, `proxy.ts` sur les routes, policy revérifiée dans chaque service.
- Rôle admin : valider les demandes d'accès, gérer les comptes, arbitrer les litiges, recevoir les suggestions escaladées, import / export GEDCOM. Le propriétaire (Folpe) ne peut pas être rétrogradé ; impossible de retirer le dernier admin.

### 6.6 Exemple (famille fictive des maquettes)

Hugo est lié à "Hugo Marchand", Isabelle à sa cousine germaine du père "Isabelle Lefèvre".

- Hugo modifie directement : lui, ses parents Luc et Sophie, sa sœur Léa, ses grands-parents Paul et Jeanne, ses arrière-grands-parents Henri et Louise, et Claude (fiche ouverte : personne de son entourage n'est inscrit).
- Hugo suggère sur Marie, Jacques et Isabelle (gardienne : Isabelle) et sur Anne (gardienne : Anne).
- Isabelle modifie directement ses parents, ses grands-parents Henri et Louise, et Claude. Sur Luc, elle ne peut que suggérer : la suggestion part à Luc. C'est exactement le cas "quelqu'un d'extérieur à ma lignée".
- Si Isabelle corrige la date de décès d'Henri, Hugo, Luc, Anne et Léa en sont notifiés et peuvent annuler.

---

## 7. Éditeur intégré

On édite là où on regarde, jamais dans un back-office séparé.

- Survol ou appui long sur un nœud : actions rapides "+ parent", "+ enfant", "+ union", "Modifier" (ou "Suggérer" hors périmètre).
- Un tiroir latéral (desktop) ou une bottom sheet (mobile) porte le formulaire (react-hook-form + Zod). Le tiroir indique toujours pourquoi on peut modifier ("Ta lignée directe", "Ton cercle proche", "Fiche ouverte") ou à qui part la suggestion.
- Recherche d'une personne existante avant création pour éviter les doublons.
- À l'enregistrement, le nouveau nœud apparaît en animation à sa place (re-layout ELK + interpolation GSAP).
- Photos par glisser-déposer vers Vercel Blob, recadrage circulaire, blur placeholder généré.
- Saisie de dates à précision variable ("vers 1850", "entre 1880 et 1885") et de sources.
- Lieux saisis avec autocomplétion et géocodage immédiat (alimente la carte).

---

## 8. Vues

Toutes les vues partagent les mêmes données, la même recherche ⌘K et la même fiche.

- **Arbre (descendants)** : graphe personnes + nœuds d'union, layout ELK layered en Web Worker, zoom sémantique, mini-carte, re-centrage au double-clic.
- **Sablier** : ancêtres au-dessus, descendants en dessous de la personne centrale.
- **Ancêtres en éventail** : demi-cercles par génération, cases vides "à découvrir", taux de complétude.
- **Frise** : une barre par personne de la naissance au décès (ou à aujourd'hui), regroupée par génération ; mariages marqués sur les barres ; grandes périodes historiques en bandes de fond (1914-1918, 1939-1945) ; curseur "en 1950, qui était en vie et quel âge avait-il ?".
- **Carte** : lieux de naissance, de vie et de décès ; arcs de migration entre naissance et résidences ; filtre par génération et curseur temporel qui rejoue les déplacements de la famille ; lieux "berceaux" (nombre de naissances par lieu) ; clic sur un lieu = personnes liées.
- Règle : d3 / ELK calculent, GSAP anime, React rend. Plus aucune manipulation DOM par sélection d3.

### 8.1 Familles recomposées

Le modèle en nœuds d'union règle le cas sans exception ni bricolage : un enfant est rattaché à **l'union dont il est issu**, pas à une personne isolée.

- **Seule l'union en cours est dessinée** à côté de la personne. Les anciens conjoints (séparation, divorce) ne sont **pas affichés** dans l'arbre : ce qui compte, c'est la relation actuelle et les enfants.
- Un enfant issu d'une union précédente est rattaché **directement au parent** (une branche qui part du parent lui-même, pas du nœud du couple actuel). Il reste au même niveau que ses demi-frères et demi-sœurs.
- L'union précédente existe dans les données (filiation, dates), mais n'apparaît que du côté de l'enfant : sur sa fiche ("Sa mère : ...") et dans ses propres vues d'ascendance (éventail, sablier centré sur lui). Elle n'apparaît jamais dans la lignée de l'ancien conjoint.
- Option d'affichage "Montrer les unions passées", désactivée par défaut, pour les besoins de généalogie complète (et pour le veuvage, où l'union passée est souvent souhaitée).
- Les demi-frères et demi-sœurs sont listés ensemble sur la fiche, avec la mention "demi-" ; le calcul de parenté les nomme correctement ("ton demi-frère").
- **Beau-parent** : la filiation `a_eleve` relie optionnellement un beau-parent à l'enfant qu'il a élevé, dessinée en fin trait pointillé distinct. Elle compte pour la fiche ("A élevé Maxime") mais jamais pour l'ascendance biologique ni pour l'éventail.
- **Adoption** : filiation `adoptive`, traitée comme une filiation à part entière dans toutes les vues, signalée seulement dans la fiche.
- **Parent inconnu** : nœud d'union avec un seul parent connu et un emplacement "parent à découvrir".
- Droits : les enfants d'une union précédente restent dans le périmètre de leurs deux parents. Un conjoint d'une union terminée sort du cercle proche de l'autre (on ne modifie pas la fiche de son ancien conjoint, on peut suggérer).

---

## 9. Animations (GSAP)

`@gsap/react` (`useGSAP`), chargement différé, presets centralisés dans `src/motion/`. `gsap.matchMedia()` respecte `prefers-reduced-motion` (animations coupées ou réduites à des fondus).

| Moment | Animation |
|---|---|
| Connexion | Logo dessiné trait par trait (DrawSVG sur `animatedLogo.svg`), titre révélé par SplitText |
| Premier chargement | L'arbre pousse génération par génération : liens dessinés (DrawSVG), nœuds en cascade avec léger rebond |
| Navigation | Caméra en vol (dézoom, pan, rezoom) sur la trajectoire de `d3.interpolateZoom` pilotée par une timeline GSAP ; pan à inertie (Draggable + Inertia) |
| Plier / déplier / re-centrer | Chaque nœud glisse de son ancienne position vers la nouvelle (interpolation par id), liens redessinés |
| Ouverture de fiche | L'avatar du nœud se transforme en photo de fiche (Flip), contenu en cascade |
| Calcul de parenté | Le chemin entre deux personnes s'illumine et se dessine |
| Frise | Les barres de vie se déploient de gauche à droite ; le curseur temporel glisse avec inertie |
| Carte | Les arcs de migration se dessinent dans l'ordre chronologique quand on lance la lecture |
| Édition | Le nœud créé apparaît à sa place, les voisins s'écartent |

---

## 10. Fonctionnalités produit

### Socle

- Palette ⌘K (cmdk) : recherche floue insensible aux accents et aux noms de naissance, sélection = vol caméra + ouverture de fiche.
- État dans l'URL (nuqs) : `/tree?p=<id>&view=hourglass`, fiches partageables, retour navigateur ferme la fiche.
- Mobile de premier ordre : bottom sheet (vaul), pinch-zoom sur le canvas, cibles tactiles >= 44px.
- Clavier : flèches parent / enfant / fratrie, Entrée ouvre, Échap ferme ; rôles ARIA d'arbre.
- "Mon périmètre" : surbrillance des fiches que je peux modifier directement.

### Effet waouh

- **"Quel est notre lien ?"** : BFS dans le graphe, chemin animé, lien nommé en français ("cousin issu de germain", "grand-oncle par alliance"), degré de parenté, ancêtres communs.
- **"C'est moi"** : arbre centré sur soi, liens affichés relativement ("ta grand-tante").
- **Anniversaires et mémoire** : anniversaires à venir, "il y a 100 ans naissait...".
- **Vue éventail**, **frise** et **carte des migrations**.

### Plus tard

- Récits et témoignages (section 11).
- Export poster PNG / PDF haute définition.
- PWA installable, hors ligne.

---

## 11. Récits et témoignages (vision long terme)

Objectif : garder la mémoire vivante. On interroge un ancien, il raconte, et l'histoire devient un récit rattaché aux personnes, aux lieux et aux dates de l'arbre, mis en scène dans le même langage visuel que l'app.

1. **Collecte** : enregistrement audio dans l'app (MediaRecorder) ou import d'un fichier, sur mobile pendant une visite. Consentement du témoin enregistré avec le récit.
2. **Transcription** : API speech-to-text, puis relecture humaine possible.
3. **Structuration** : un LLM (ADR 13) découpe le témoignage en chapitres, repère les personnes, lieux et dates mentionnés et propose de les relier à l'arbre (chaque lien est confirmé par un humain ; les nouvelles informations deviennent des faits sourcés "témoignage").
4. **Récit animé** : une suite de scènes générées à partir des données et du témoignage (carton titre, arc sur la carte, photo avec citation, branche de l'arbre qui pousse, frise), animées avec GSAP dans l'app, avec la voix du témoin en fond.
5. **Export** : vidéo MP4 via Remotion pour partager hors de l'app (licence Remotion à vérifier selon l'usage).

Modèle : `stories` (titre, témoin, intervieweur, date, consentement, audio, transcription), `story_segments` (chapitre, horodatage, texte, personnes, lieux, dates liés), `story_scenes` (type de scène, paramètres, ordre).

---

## 12. Direction visuelle

**Tranchée le 2026-10-09** (ADR 11). Détail d'implémentation : [docs/design/DESIGN.md](../design/DESIGN.md). La direction "archive précieuse" de la v1 (sombre, dorée) a été écartée : trop carrée, trop dure, pas assez chaleureuse pour toutes les générations.

Exigences :

- formes rondes et douces, liens en courbes organiques plutôt qu'en angles droits ;
- chaleureuse, lisible par un enfant comme par un arrière-grand-parent (grandes cibles, contrastes forts, texte jamais minuscule) ;
- ludique sans être enfantine : micro-interactions, illustrations légères, animations GSAP qui donnent vie à l'arbre ;
- photos mises en valeur, c'est le contenu le plus émouvant ;
- thème clair par défaut, thème sombre disponible ;
- pas d'emoji ni de point d'exclamation dans la copy.

Trois directions ont été explorées (A Album de famille, B Jardin vivant, C Veillée). **Retenu le 2026-10-09 :**

- **Thème clair = A "Album de famille", version premium** : palette resserrée (papier, encre, un seul accent terracotta réservé à la sélection et aux libellés de parenté), bulles photo neutres plutôt que des teintes pastel multiples, typographie Fraunces SOFT pour les titres et Figtree pour le texte, filets fins, ombres douces, beaucoup d'air.
- **Thème sombre = C "Veillée"** : nuit prune, personnes en "lanternes", accent ambre, et surtout la **trame de points** en fond du canevas. Elle est commune aux deux thèmes et doit rester bien visible : points de 1 px (fondu jusqu'à 1,5 px) tous les 46 px, à 16 % d'opacité en sombre et 24 % en clair. La trame suit le pan et le zoom du canevas, ce qui donne la sensation de déplacement.
- Pas de légende ni de marqueur d'union dans l'arbre : le trait entre deux personnes suffit à dire l'union, les enfants partent de ce trait. Seules les branches d'un enfant d'une union précédente partent du parent lui-même.
- Les couleurs ne codent plus le genre ; la distinction passe par les photos et les noms.

## 13. Sécurité

- Accès 100 % authentifié, `noindex` et `robots.txt` restrictif.
- Règles de visibilité appliquées côté serveur (les données masquées ne quittent jamais le serveur).
- En-têtes de sécurité et CSP stricte, secrets via env validé, gitleaks en pre-commit et en CI.
- Journal d'activité de toutes les écritures.
- Export GEDCOM réservé aux admins, et limité aux données que l'export a le droit de contenir (vivants filtrés).

## 14. Mobile et viewport

`user-scalable=no` est conservé volontairement : le zoom navigateur entre en conflit avec le pan / zoom de l'arbre. Le hack global `useDisablePinch` est remplacé par `touch-action: none` sur le seul canvas de l'arbre et un blocage de `gesturestart` limité à cette zone (iOS ignore le flag du viewport).

## 15. Données : sortie de Notion

- Neon est la source de vérité dès la phase 3.
- Script de migration Notion -> Neon exécuté une fois : validation Zod, rapport d'anomalies (parent introuvable, cycle, date impossible), copie des photos vers Vercel Blob, géocodage des lieux existants.

### 15.1 Provisionnement Neon et migration (phase 3, demandé par Folpe le 2026-10-09)

Exécuté au moment où le schéma Drizzle et la policy d'accès existent (phase 3), pas avant : migrer vers un schéma provisoire obligerait à migrer deux fois.

1. **Provisionnement** : un projet Neon (région Europe, `aws-eu-central-1`), trois branches : `main` (production), `preview` (déploiements de preview Vercel), `dev` (local). Intégration Vercel-Neon pour injecter `DATABASE_URL` par environnement. Rôle applicatif sans droits DDL ; les migrations Drizzle passent par un rôle dédié. Store Vercel Blob privé pour les médias.
2. **Extraction** : export complet de la base Notion en JSON brut, versionné hors du repo (fichier daté, chiffré au repos), pour pouvoir rejouer la migration sans rappeler l'API.
3. **Photos** : les URLs de fichiers Notion sont signées et expirent au bout d'une heure, les URLs externes peuvent disparaître. Chaque photo est téléchargée pendant l'extraction, dédupliquée par empreinte SHA-256, envoyée sur Vercel Blob sous `persons/<person_id>/<sha256>.<ext>`, normalisée (rotation EXIF appliquée, métadonnées GPS retirées, dérivées WebP). La table `media` garde l'empreinte, le type MIME, les dimensions et l'URL d'origine pour la traçabilité.
4. **Transformation** : mapping Notion -> schéma (personnes, unions, filiations, événements, lieux), validé par Zod, avec des identifiants Notion conservés dans une colonne `legacy_notion_id` pour l'idempotence.
5. **Chargement** : dans une transaction, d'abord sur la branche `dev`, puis `preview` ; rapport d'anomalies (parents introuvables, cycles, dates impossibles, doublons probables, photos en échec) relu avec Folpe avant la production.
6. **Contrôles** : comptages Notion vs Neon par type, échantillon de fiches comparées à l’œil, toutes les photos accessibles.
7. **Bascule** : migration finale sur `main`, Notion passe en lecture seule, l'intégration Notion et les fonctions Netlify sont supprimées, `ances-tree.netlify.app` redirige vers `famille.folpe.me`. Notion n'est archivé qu'après validation de Folpe (garde-fou destructif).

Le script est idempotent (rejouable sans doublon grâce à `legacy_notion_id` et aux empreintes) et dispose d'un mode `--dry-run` qui produit le rapport sans écrire.
- Notion reste en lecture seule jusqu'à la bascule, puis l'intégration est coupée.
- Import / export **GEDCOM** pour ne jamais être enfermé dans un outil (Geneanet, MyHeritage, Gramps).

## 16. Qualité

- TDD sur le domaine : graphe, invariants, **policy d'accès (périmètre, gardiens, visibilité, mineurs)**, calcul de parenté, nommage des liens en français, recherche, dates à précision variable.
- Playwright sur les parcours clés : connexion, exploration, recherche, fiche, modification dans le périmètre, suggestion hors périmètre, annulation depuis la veille de lignée, invitation.
- Performance : LCP < 2,5 s, layout ELK hors thread principal, GSAP et MapLibre chargés à la demande.
- Accessibilité : Radix pour les primitives, navigation clavier complète, contrastes vérifiés.

---

## 17. Feuille de route

| Phase | Contenu | Sortie |
|---|---|---|
| 0 | ~~Hotfix sécurité sur la stack actuelle~~ : écarté le 2026-10-09 par Folpe, la refonte remplace l'app. Risque accepté : les données restent lisibles via `/api/getNotionPeople` jusqu'à la bascule de la phase 3 | - |
| 1 | Fondations : Bun, Biome, TS 7, Lefthook, commitlint, gitleaks, knip, CI, nettoyage deps et code mort | CI verte |
| 2 | Domaine en TDD : graphe, invariants, policy d'accès, parenté, recherche, dates | Helpers et policies couverts |
| 3 | Next 16, Neon / Drizzle, better-auth (magic link, passkey), comptes liés à une fiche, migration Notion, Blob, géocodage | App en ligne sur Vercel avec comptes |
| 4 | Moteur de rendu : ELK worker, rendu SVG, caméra GSAP, zoom sémantique, vues descendants et sablier | Arbre complet et fluide |
| 5 | Design et animations : direction visuelle, système GSAP, fiche Flip, ⌘K, mobile | Maquettes validées implémentées |
| 6 | Éditeur intégré, périmètre, suggestions aux gardiens, veille de lignée, annulation, invitations par les membres, GEDCOM | La famille contribue |
| 7 | Vues éventail, frise et carte ; parenté, "C'est moi", anniversaires | Effet waouh |
| 8 | Récits : enregistrement, transcription, structuration, liens à l'arbre | Mémoire collectée |
| 9 | Récits animés, export vidéo, poster, PWA | |

## 18. Questions ouvertes

- Délai d'escalade des suggestions (14 jours proposés).
- Profondeur du cercle proche : inclure ou non les oncles, tantes, neveux et nièces (proposé : non, ils passent par la lignée ascendante ou par suggestion).
- Fournisseur de transcription pour les récits.
