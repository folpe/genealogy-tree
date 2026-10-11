# Décisions d'architecture

Journal ADR-lite des choix non évidents. Lire avant de remettre une décision en cause, ajouter une entrée quand une alternative crédible existait. Fichier en ajout seulement.

## Format

```
### NN. <Titre>

- **Date :** YYYY-MM-DD
- **Décision :** ce qui est retenu
- **Pourquoi :** la raison porteuse en 1 à 3 phrases
- **Alternatives écartées :** ce qui a été envisagé et pourquoi ça a perdu
- **À réexaminer si :** la condition qui rouvre la décision
```

---

### 01. Next.js 16 sur Vercel plutôt qu'une SPA

- **Date :** 2026-10-09
- **Décision :** migration de React 18 + Farm + Netlify Functions vers Next.js 16 App Router hébergé sur Vercel, outillage aligné sur void-starter.
- **Pourquoi :** les données doivent être chargées côté serveur derrière une session ; Next règle d'un coup l'auth, le cache et l'exposition des secrets, et s'aligne sur la stack de référence.
- **Alternatives écartées :** Vite 8 en SPA + fonctions serverless (deux mondes à sécuriser) ; rester sur Farm (bundler de niche).
- **À réexaminer si :** l'app devait fonctionner sans serveur (export statique pur).

### 02. App unique, pas de monorepo

- **Date :** 2026-10-09
- **Décision :** une seule app Next, domaine dans `src/server/<domaine>/`.
- **Pourquoi :** une seule cible de déploiement ; Turborepo serait du cérémonial.
- **Alternatives écartées :** reprendre le monorepo complet de void-starter.
- **À réexaminer si :** une deuxième cible apparaît (app mobile, site public séparé).

### 03. Abandon de Notion, Neon source de vérité, éditeur intégré

- **Date :** 2026-10-09
- **Décision :** Neon Postgres + Drizzle devient la source de vérité ; l'édition se fait directement dans l'arbre ; Notion est migré une fois puis coupé.
- **Pourquoi :** la difficulté de la généalogie est dans les liens (unions multiples, filiations, dates approximatives) ; aucun CMS générique ne les édite bien, et l'édition dans l'arbre est la meilleure UX.
- **Alternatives écartées :** Payload CMS (relations peu ergonomiques, second système d'auth) ; Gramps Web (auto-hébergement Docker, interface austère) ; NocoDB / Teable (ergonomie tableur, auto-hébergement) ; garder Notion (URLs de photos expirantes, pas de rôles).
- **À réexaminer si :** le besoin d'outils de généalogiste avancés (sources, citations) dépasse ce que l'éditeur couvre ; Gramps Web en back-office redevient alors pertinent.

### 04. Comptes individuels sur invitation, sans mot de passe

- **Date :** 2026-10-09
- **Décision :** better-auth 1.6.x avec magic link et passkey ; entrée uniquement par invitation ou demande d'accès validée ; rôles Membre / Éditeur / Admin.
- **Pourquoi :** besoin de savoir qui modifie, de router les propositions aux admins et de promouvoir des membres ; le sans-mot-de-passe convient à tous les âges.
- **Alternatives écartées :** mot de passe partagé + cookie signé (aucune notion d'identité ni de rôle) ; Clerk (service payant au-delà du gratuit, données hors de notre base).
- **À réexaminer si :** les emails magic link posent problème de délivrabilité à la famille.

### 05. GSAP pour les animations, d3 / ELK pour le calcul

- **Date :** 2026-10-09
- **Décision :** GSAP 3.13+ anime (caméra, transitions de layout, DrawSVG, Flip, SplitText) ; ELK.js et `d3-hierarchy` calculent les positions ; React rend.
- **Pourquoi :** GSAP est désormais entièrement gratuit et bien supérieur pour orchestrer des timelines ; séparer calcul et animation supprime les manipulations DOM concurrentes de React et d3.
- **Alternatives écartées :** transitions d3 (impératives, en conflit avec React) ; Motion (moins adapté au SVG complexe et aux timelines).
- **À réexaminer si :** le poids du bundle GSAP pèse sur le LCP malgré le chargement différé.

### 06. Graphe avec nœuds d'union, layout ELK

- **Date :** 2026-10-09
- **Décision :** modèle personnes + unions, les enfants partent de l'union ; layout ELK layered en Web Worker.
- **Pourquoi :** une généalogie n'est pas un arbre ; le modèle actuel perd conjoints, remariages et demi-fratries.
- **Alternatives écartées :** `d3.tree` seul (arbre strict) ; dagre (moins bon sur les croisements, peu maintenu).
- **À réexaminer si :** les performances du layout deviennent insuffisantes au-delà de quelques milliers de personnes.

### 07. `user-scalable=no` conservé

- **Date :** 2026-10-09
- **Décision :** le flag reste dans le viewport ; le pinch est géré par `touch-action: none` limité au canvas de l'arbre.
- **Pourquoi :** le zoom navigateur entre en conflit avec le pan / zoom de l'arbre.
- **Alternatives écartées :** laisser le zoom navigateur actif.
- **À réexaminer si :** un audit d'accessibilité l'exige ; les fiches et formulaires restent lisibles sans zoom.

### 08. Droits par proximité familiale plutôt que par rôles

- **Date :** 2026-10-09
- **Décision :** remplace la partie "rôles Membre / Éditeur / Admin" de l'ADR 04. Chaque compte est lié à une fiche ; on modifie directement son cercle proche, toute sa lignée ascendante, ses descendants et les fiches ouvertes ; ailleurs, on suggère aux gardiens de la personne. Veille de lignée avec annulation en un clic. Seuls restent les statuts membre et admin.
- **Pourquoi :** l'adoption exige que chacun puisse contribuer sans attendre ; le vrai risque n'est pas un inconnu mais un parent d'une autre branche qui réécrit la mienne, et la proximité dans le graphe le règle sans modération centrale.
- **Alternatives écartées :** rôles attribués à la main avec modération admin (goulot d'étranglement, freine l'adoption) ; wiki totalement ouvert (aucune protection des branches) ; propriété exclusive d'une fiche par une personne (bloque les ancêtres communs).
- **À réexaminer si :** les suggestions restent sans réponse trop souvent, ou si des conflits répétés apparaissent sur les ancêtres communs.

### 09. Carte avec MapLibre et tuiles OpenStreetMap gratuites

- **Date :** 2026-10-09
- **Décision :** MapLibre GL, tuiles vectorielles OpenFreeMap, style sombre maison ; géocodage Base Adresse Nationale pour la France, Nominatim pour l'étranger, résultat stocké dans `places`.
- **Pourquoi :** open source, sans clé ni facturation, style entièrement personnalisable pour rester dans la direction visuelle.
- **Alternatives écartées :** Mapbox (payant au-delà du gratuit, clé obligatoire) ; Google Maps (payant, style contraint) ; Leaflet raster (moins fluide, style limité).
- **À réexaminer si :** la disponibilité d'OpenFreeMap devient un problème (repli : auto-hébergement de tuiles PMTiles sur Blob).

### 10. Récits animés : GSAP dans l'app, Remotion pour l'export

- **Date :** 2026-10-09
- **Décision :** les récits animés sont composés de scènes paramétrées, jouées avec GSAP dans l'app ; l'export vidéo passe par Remotion.
- **Pourquoi :** un seul langage visuel entre l'app et les vidéos, scènes générées à partir des données plutôt que montées à la main.
- **Alternatives écartées :** montage vidéo manuel (ne passe pas à l'échelle, style incohérent) ; génération vidéo par IA (rendu non maîtrisé, invente des images).
- **À réexaminer si :** la licence Remotion ne convient pas à l'usage, ou si l'export vidéo n'est finalement pas utilisé.

### 11. Direction visuelle : Album premium en clair, Veillée en sombre

- **Date :** 2026-10-09
- **Décision :** thème clair "Album de famille" en version premium (palette resserrée, un seul accent), thème sombre "Veillée" (nuit prune, accent ambre, quadrillage de points). Pas de légende ni de marqueur d'union dans l'arbre.
- **Pourquoi :** la v1 sombre et anguleuse était jugée dure et peu accueillante ; ces deux directions sont rondes, chaleureuses et lisibles par toutes les générations, et partagent les mêmes formes pour qu'un seul jeu de composants serve les deux thèmes.
- **Alternatives écartées :** "Jardin vivant" (le plus ludique, mais moins premium et plus coûteux à décliner) ; conserver l'esthétique sombre dorée de la v1.
- **À réexaminer si :** les tests avec les aînés de la famille montrent des problèmes de lisibilité.

### 12. Domaine de production : famille.folpe.me

- **Date :** 2026-10-09
- **Décision :** l'app est servie sur `famille.folpe.me` (Vercel), en remplacement de `ances-tree.netlify.app`, qui redirige vers le nouveau domaine une fois la migration faite. Les passkeys utilisent `folpe.me` comme RP ID et les emails partent de `famille@folpe.me`.
- **Pourquoi :** domaine personnel plutôt que professionnel (volpio, voidcorp) pour un outil familial ; « famille » est lisible par toutes les générations dans les emails de connexion. Rattacher les passkeys au domaine racine évite de les invalider si le sous-domaine change.
- **Alternatives écartées :** sous-domaine de volpio ou voidcorp (marques professionnelles) ; rester sur `netlify.app` (domaine tiers, pas d'emails sur un domaine maîtrisé) ; passkeys liées au sous-domaine (perdues au moindre renommage).
- **À réexaminer si :** l'app sort du cadre familial ou si un domaine dédié est acheté (les passkeys devront alors être recréées).

### 13. IA des récits : modèles open-weight peu chers, hébergés hors Chine

- **Date :** 2026-10-09
- **Décision :** la transcription et la structuration des récits passent par l'AI SDK (abstraction de fournisseur). Par défaut : Whisper large-v3 pour la transcription, DeepSeek V3 ou Kimi K2 pour la structuration, servis par un hébergeur d'inférence occidental (AI Gateway, Groq, Together, Fireworks ou équivalent) avec engagement de non-rétention et de non-entraînement. Le choix final se fait en phase 8 sur un même échantillon.
- **Pourquoi :** coût très inférieur aux modèles propriétaires pour une tâche d'extraction structurée, validée de toute façon par un humain ; l'abstraction permet de changer de modèle sans toucher au code métier.
- **Alternatives écartées :** API officielles DeepSeek ou Moonshot (données personnelles de la famille, dont des vivants et des mineurs, stockées en Chine : incompatible RGPD) ; modèle Claude par défaut (meilleure qualité mais plus cher, gardé comme étalon de comparaison).
- **À réexaminer si :** la qualité de structuration ne passe pas la relecture, ou si un hébergeur européen devient compétitif en prix.

### 14. Fiches ouvertes définies par le périmètre, pas par le cercle proche

- **Date :** 2026-10-09
- **Décision :** une fiche est ouverte (modifiable par tous) seulement si aucun membre inscrit ne l'a dans son périmètre (cercle proche, ascendance et descendance avec conjoints), ni comme ancien conjoint d'une personne de ce périmètre. Précise l'ADR 08.
- **Pourquoi :** avec la définition initiale (« aucun membre ne l'a dans son cercle proche »), Odette, grand-mère de Hugo, aurait été modifiable par Isabelle, et Claire, ancienne compagne de Luc, par Luc lui-même : contraire à « protéger sa lignée » et à la règle des anciens conjoints. Les cas de la spec (Claude ouvert, Marie et Jacques gardés par Isabelle) sont inchangés.
- **Alternatives écartées :** définition par le cercle proche (trop permissive).
- **À réexaminer si :** trop de fiches restent bloquées en suggestion faute de gardien actif.
