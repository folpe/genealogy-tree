# Plan phase 3 : socle Next 16, Neon, auth et migration Notion

- **Date :** 2026-10-09
- **Spec :** [docs/specs/2026-10-09-refonte-ances-tree.md](../specs/2026-10-09-refonte-ances-tree.md), sections 3 à 6, 13, 15 et 15.1
- **Décisions :** [docs/DECISIONS.md](../DECISIONS.md), ADR 01 (Next 16 sur Vercel), 02 (app unique), 03 (abandon de Notion, Neon), 04 et 08 (comptes sur invitation, droits par proximité), 12 (domaine `famille.folpe.me`)
- **Design :** tokens et composants dans [docs/design/DESIGN.md](../design/DESIGN.md) (en cours d'écriture)
- **Statut :** à faire, après la phase 2

## 1. Objectif et sortie attendue

Remplacer l'app Farm + Notion + Netlify par le socle définitif, sans encore refaire le moteur de rendu (phase 4) :

- Next 16 App Router dans ce repo, déployé sur Vercel à `famille.folpe.me` ;
- Neon + Drizzle avec le schéma complet de la section 5, migrations versionnées ;
- better-auth : magic link puis passkey, comptes liés à une fiche, invitations, demandes d'accès ;
- toutes les données Notion migrées dans Neon, photos comprises, avec rapports validés par Folpe ;
- les lieux géocodés ;
- ~~l'ancienne app coupée, `ances-tree.netlify.app` redirigée~~ : reporté à la bascule, une fois la nouvelle app à parité (arbre graphique de la phase 4, édition de la phase 6), voir la [décision du 2026-10-12](../decisions-log/2026-10-12-bascule-apres-parite--c78945f9-9b5c-4ac6-859b-e34d3403431b.md).

Sortie : la famille se connecte sur `famille.folpe.me`, voit ses données depuis Neon, à travers la policy de la phase 2 appliquée côté serveur. L'arbre affiché peut encore être un rendu provisoire (liste et fiche) : le vrai moteur arrive en phase 4.

## 2. Prérequis

- Phases 1 et 2 mergées : outillage, domaine et policy testés, fixture Marchand.
- Actions de Folpe listées en section 9, au moins celles marquées « avant le lot ».

## 3. Conventions (alignées sur void-starter)

- Couches : composant -> action (`defineAction` / `defineFormAction`) -> service -> repository -> `getDb()`. Seuls les repositories touchent la base ou le réseau et portent `import 'server-only'`.
- Fichiers `<domaine>.<couche>.ts` sous `src/server/<domaine>/`, comme en phase 2.
- Env validé par `@t3-oss/env-nextjs` + Zod dans `src/env.ts` (`emptyStringAsUndefined`, `SKIP_ENV_VALIDATION` pour le build, comme `createAppEnv` du starter).
- `proxy.ts` (Next 16) : session et redirection des routes `(app)` ; la policy est **toujours** revérifiée dans les services.
- Erreurs typées (`AppError` et dérivées) mappées vers `fieldErrors` / `formError` dans les actions.
- Tests d'intégration `*.integration.test.ts` contre une vraie base (Postgres de service en CI, branche Neon `dev` en local), ignorés si `DATABASE_URL` est absent.

## 4. Architecture cible

Celle de la section 4 de la spec. Ajouts propres à cette phase :

```
src/
  env.ts
  proxy.ts
  app/
    (public)/login/  (public)/invite/[token]/  (public)/request-access/
    (app)/layout.tsx  (app)/tree/  (app)/people/[id]/  (app)/admin/
    api/auth/[...all]/route.ts
    robots.ts  layout.tsx  globals.css
  server/
    db/  schema/  client.ts  migrations/      # Drizzle
    auth/  auth.ts  auth.service.ts  auth.repository.ts  auth-action.ts
    family/  (repository, service, mapper ajoutés au domaine de phase 2)
    access/  (policy de phase 2, inchangée)
    members/  invitations, demandes d'accès, memberships
    media/  Blob, normalisation d'images
    places/  géocodage BAN et Nominatim
    notifications/  emails React Email + Resend
scripts/
  migrate-notion/  extract.ts  photos.ts  transform.ts  load.ts  report.ts  index.ts
```

## 5. Lots ordonnés

### Lot 1 : bascule de Farm vers Next 16 (sans données)

- [ ] **Avant de merger ce lot sur `main`**, Folpe verrouille le déploiement de production Netlify (« Lock published deploy ») : l'ancienne app reste servie telle quelle pendant que `main` évolue.
- [x] Ajouter Next 16, React 19, `@types/react@19` ; retirer Farm, React Router, `@farmfe/*`, `react-refresh`, `postcss.config.js` remplacé par `postcss.config.mjs` (Tailwind 4).
- [x] `next.config.ts` : `typedRoutes`, en-têtes de sécurité, `images.remotePatterns` limité au domaine Blob. CSP stricte à nonce posée par `src/proxy.ts`. **Écart :** pas de `cacheComponents`, incompatible avec une CSP à nonce ([décision](../decisions-log/2026-10-11-csp-nonce-sans-cache-components--92c82dd2-1732-4620-a4c0-fa1d589051f3.md)).
- [x] `src/app/layout.tsx` (lang `fr`, `noindex`), `robots.ts` qui interdit tout, polices Fraunces et Figtree via `next/font`, viewport avec `user-scalable=no` (ADR 07).
- [x] Tokens de `docs/design/DESIGN.md` posés dans `globals.css` (`@theme`, OKLCH, thèmes clair et sombre via `light-dark()`, système par défaut).
- [x] Ancien code UI déplacé dans `legacy/` (suppression au lot 9) ; `src/server/**` de la phase 2 conservé tel quel.
- [x] Tests : `proxy.test.ts` (matcher, exclusions `api/auth` et assets), test de rendu de la page de connexion.
- [x] Mettre à jour `knip.json` (entrées Next), `tsconfig.json` (plugin `next` ; Next impose `jsx: react-jsx`), CI (build Next inchangé : `bun run build`). Builds Netlify coupés (`ignore = "exit 0"`) : la production Netlify reste figée sur l'ancienne app.
- **Acceptation :** `bun run build` produit un build Next ; CI verte ; la preview Vercel affiche la page de connexion.

### Lot 2 : environnement et Vercel

- [x] Projet Vercel `ances-tree` (équipe `voidcorp`) relié au repo GitHub, preview par PR, production sur `main`, framework Next.js, Node 24.
- [x] Variables posées par environnement sans transiter en clair : `DATABASE_URL` (rôle applicatif de la branche Neon correspondante), `BETTER_AUTH_SECRET` (distinct par environnement), `NEXT_PUBLIC_APP_URL` (production et développement ; en preview, déduite de `VERCEL_URL` au lot 4). Le rôle propriétaire n'est jamais posé dans Vercel.
- [ ] `src/env.ts` (avec son premier consommateur, au lot 4) : `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (migrations, hors app), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `PASSKEY_RP_ID=folpe.me`, `RESEND_API_KEY`, `EMAIL_FROM=famille@mail.folpe.me`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_APP_URL`, `NOTION_TOKEN` et `NOTION_DATABASE_ID` (scripts de migration uniquement, jamais exposés à l'app).
- [ ] `.env.example` à jour, sans valeur réelle ; gitleaks vérifie.
- **Acceptation :** un env manquant fait échouer le démarrage avec un message clair ; `vercel env pull` fournit un `.env.local` fonctionnel.

### Lot 3 : Neon et schéma Drizzle

- [x] Provisionnement (section 15.1, étape 1) : projet Neon `ances-tree` (`frosty-feather-00901702`, organisation VoidCorp, `aws-eu-central-1`, Postgres 18), branches `main`, `preview`, `dev`. Variables posées à la main par environnement, comme void-cortex, plutôt que par l'intégration Vercel-Neon. Rôle applicatif `ances_tree_app` sans DDL (`scripts/db-app-role.ts`, vérifié : lecture et écriture autorisées, `create` et `alter` refusés), rôle propriétaire `ances_tree_owner` réservé aux migrations.
- [x] Migration `0000_init` appliquée sur `dev` et `preview`, famille fictive Marchand semée sur les deux. `main` : `0000` et `0001` appliquées le 2026-10-11 après validation de Folpe (19 tables, toutes lisibles par le rôle applicatif).
- [x] Schéma famille `src/server/db/schema/family.schema.ts`, migration `0000_init` : `persons` (`legacy_notion_id` unique, `visibility`, `is_living_override`, `version` pour le verrou optimiste), `unions` (dates de début et de fin, motif), `parent_child`, `events` (naissance et décès compris, un seul de chaque par personne), `places` (libellé normalisé unique, clé du cache de géocodage), `residences`, `sources`, `sourced_facts` (champ sourcé et sa source, remplace un `source_id` par événement), `media` (SHA-256 unique, MIME, dimensions, `blur_data_url`, `origin_url`), `media_persons`. Identifiants en `text` (UUID par défaut). Dates à précision variable sur trois colonnes `<x>_precision`, `<x>_value`, `<x>_value_end`.
- [ ] **Reporté au lot 4** : tables better-auth (générées par son CLI plutôt que recopiées), `memberships`, `invitations`, `access_requests`. **Reporté à la phase 6** : `suggestions` et `activity` (le lot 5 n'a besoin que d'un journal des consultations admin, ajouté avec lui).
- [x] Contraintes en base qui doublent les invariants : clés étrangères (cascade sur les liens d'une personne supprimée), enums Postgres, `CHECK` filiation et union distinctes, date complète ou absente, `value_end` réservé à `entre` et postérieur au début, fin d'union seulement avec un motif ; index uniques (`legacy_notion_id`, empreinte média, naissance et décès uniques) ; index sur `parent_child(child_id)` (la clé primaire couvre `parent_id`), `unions(partner_a_id)`, `unions(partner_b_id)`.
- [x] `family.mapper.ts` : lignes Drizzle <-> graphe du domaine, aller-retour de la famille Marchand testé unitairement. Le `null` de Postgres s'arrête là (`?? undefined`).
- [x] `family.repository.ts` : chargement du graphe en une requête par table, insertion d'un graphe complet en une transaction.
- [x] Tests d'intégration (`bun run test:integration`, config `vitest.integration.config.ts`, migrations appliquées en `globalSetup`) : la famille Marchand relue à l'identique, insertion atomique, 8 contraintes vérifiées en contournant le service.
- [x] Seed `bun run db:seed` depuis la fixture Marchand. Liste blanche plutôt que liste noire : base locale ou hôte listé dans `SEED_ALLOWED_HOSTS` (branches `dev` et `preview`), tout le reste est refusé.
- [x] CI : job `integration` avec un Postgres 17 de service, contrôle qu'aucune migration n'a été oubliée (`drizzle-kit generate` ne doit rien produire), puis tests d'intégration ; requis par `quality`.
- **Garde-fou destructif :** la première migration sur la branche Neon `main` (production) n'est appliquée qu'après validation explicite de Folpe, migration SQL relue dans la PR. Aucune migration destructive (`DROP`, changement de type) sans plan de retour arrière écrit.
- [x] Migrations de production automatiques (décidé par Folpe le 2026-10-12) : le workflow `Migrations` applique `drizzle-kit migrate` sur la branche Neon `main` à chaque arrivée de migration sur `main`, depuis l'environnement GitHub `production` (secret du rôle propriétaire, limité à `main`). Le merge de la PR vaut validation : la migration SQL se relit dans la PR, et elle reste additive puisque Vercel déploie en parallèle.
- **Acceptation :** `bunx drizzle-kit migrate` passe sur `dev` et `preview` ; CI applique les migrations sur un Postgres de service et lance les tests d'intégration.

### Lot 4 : auth, comptes et invitations

- [x] better-auth 1.6.33 avec adaptateur Drizzle (`src/server/auth/auth.ts`, fabrique testable) : `magicLink` (15 min, usage unique, jeton haché en base), `passkey` (RP ID `PASSKEY_RP_ID`, `folpe.me` en production, l'hôte de l'app ailleurs), sessions de 30 jours prolongées à chaque visite, rate limiting en base. Tables d'auth et de membres dans la migration `0001_auth_members`.
- [x] Mode invitation seule (`members/admission.ts`) : un compte n'est créé que pour l'admin d'amorçage (`AUTH_BOOTSTRAP_ADMIN_EMAIL`, devient propriétaire) ou une adresse qui détient une invitation en cours (membre relié à la fiche, invitation consommée). Aucun lien n'est envoyé à une adresse inconnue, avec la même réponse qu'une adresse connue. Vérifié en intégration et de bout en bout sur le build.
- [x] Proxy : sans cookie de session, toute route hors `/login`, `/invite/`, `/request-access` renvoie vers `/login` ; session revérifiée côté serveur (`requireSession`). Page `/login` branchée (lien, passkey), accueil provisoire `/tree` (activation de passkey, déconnexion).
- [x] Emails React Email + Resend depuis `famille@mail.folpe.me` : lien de connexion, invitation, demande d'accès reçue (admins), demande acceptée. Gabarits au style Album (voir `docs/design/DESIGN.md` et la maquette `EmailVeille`). Gabarits dans `src/server/notifications/emails/` (`react-email` 6.11.1), HTML et texte brut, logo servi par l'app (`/email/logo.png`), relus en rendu mobile et desktop.
- [x] `members` (`members.policy.ts` pur, `members.service.ts`) : invitation du cercle proche et de la descendance (un admin invite tout le monde, une fiche déjà reliée ne se réinvite pas), lien `/invite/<jeton>` valable 14 jours qui accueille l'invité par son prénom et préremplit son adresse ; demandes d'accès publiques (`/request-access`), prévenant les admins, acceptées en choisissant la fiche (`/admin`, 404 pour un non-admin) ; « Nommer admin » (`/members`) ; propriétaire non rétrogradable, dernier admin non retirable. Server actions qui prennent l'identité dans la session.
- [x] Rate limiting : liens magiques 5 par minute ; demandes d'accès, une seule en attente par adresse (les admins ne sont prévenus qu'une fois) et 20 par heure au total.
- [x] Tests : unitaires sur le service members (droits d'inviter, cas propriétaire et dernier admin) ; intégration sur le cycle invitation -> compte -> membership ; e2e Playwright sur la connexion par magic link (boîte mail interceptée en test). E2e (`tests/e2e/`, `bun run test:e2e`, job CI `e2e`) : build de production local, base Postgres jetable peuplée de la famille Marchand, lien lu dans les logs du serveur (sans clé Resend, l'app y écrit l'email) ; chaque variable de `.env.example` est vidée pour qu'aucune valeur locale réelle ne serve. Parcours : page protégée, photo sans session, adresse inconnue sans email, propriétaire, lien à usage unique, en mobile et desktop.
- **Acceptation :** parcours de la maquette `Connexion` et `Membres` fonctionnels de bout en bout en preview.

### Lot 5 : lecture des données à travers la policy

- [x] `family.service.ts` : `getTreeForViewer(viewer)` qui charge le graphe, calcule le niveau de visibilité de chaque fiche avec `access.policy`, applique `access.redact` **avant** de sérialiser vers le client. La projection pure est `access.view` (`viewTreeAs`) ; les dates d'une union suivent le niveau le plus restrictif de ses partenaires (année en `family`, retirées au-delà).
- [x] Pages `(app)/tree` (rendu provisoire : liste par génération et fiche) et `(app)/people/[id]`. Générations calculées par `generationLevels` (conjoints au même niveau, « a élevé » ignoré).
- [x] Journalisation des consultations admin de fiches restreintes : table `admin_record_views` (migration `0002`), une ligne par admin, fiche et jour (fuseau Europe/Paris).
- [x] Tests d'intégration : un membre hors périmètre ne reçoit jamais la date exacte ni la résidence d'un vivant dans la réponse sérialisée. L'intégration porte sur la sortie sérialisée du service ; le payload RSC des pages a été contrôlé sur un build local (Hugo : rien sur Anne, Tom ni Jade au-delà de leur niveau). Assertion automatique dans l'e2e (`tests/e2e/privacy.spec.ts`) : ni résidence ni date exacte d'Anne dans le document servi à Isabelle (`/tree` et `/people/anne`), avec un témoin qui montre que le propriétaire les reçoit bien.
- **Acceptation :** les cas de la section 6.4 sont vérifiés sur des données en base.

### Lot 6 : médias

- [x] Store Vercel Blob privé ; `media.service.ts` : upload, normalisation avec `sharp` (rotation EXIF appliquée, métadonnées EXIF et GPS retirées, dérivées WebP 256 / 768 / 1600 px, `blur_data_url`), déduplication par SHA-256, chemin `persons/<person_id>/<sha256>.<ext>`.
- [x] Accès aux médias privés par URL signée de courte durée, générée après vérification de la policy. HMAC sur une clé dérivée de `BETTER_AUTH_SECRET`, expiration arrondie à l'heure (1 à 2 h) pour garder le cache du navigateur ; route `/media/[id]/[width]`. La photo de profil suit la policy (`showsProfilePhoto` : niveaux `full` et `family`). Store privé `ances-tree-media` (fra1) provisionné le 2026-10-12 et relié aux trois environnements.
- [x] Tests : une image avec GPS ressort sans GPS ; un doublon n'est pas réuploadé.

### Lot 7 : géocodage des lieux

- [x] `src/server/places/` : BAN pour la France, servie depuis le 2026-01-31 par la Géoplateforme de l'IGN (`data.geopf.fr/geocodage`, l'ancienne `api-adresse.data.gouv.fr` est retirée) ; Nominatim pour l'étranger (User-Agent identifiant, une requête par seconde au plus) ; la table `places` sert de cache (un lieu géocodé, à la main ou non, n'est plus interrogé ni réécrit) ; source et score enregistrés. Pas de repository séparé : `places.service.ts` écrit directement, comme `media.service.ts`.
- [x] Lecture des libellés (`places.label.ts`) : département entre parenthèses, pays en français (codes ISO via `Intl.DisplayNames`), autre précisant gardé comme indice, « St » et « Ste », arrondissements de Paris, Lyon et Marseille, libellés vides de sens (« non renseigné »). Revue manuelle (`places.verdict.ts`) : homonymes de score voisin, score BAN sous 0,7 ou précisant introuvable ne reçoivent pas de coordonnées et sont listés avec leurs candidats. Commande `bun scripts/migrate-notion.ts geocode --target <branche> [--dry-run]`, `--confirm-production` exigé pour `main`. Essai sur `notion-import` le 2026-10-12 : 29 lieux géocodés, 4 en revue (Montreuil et Valence homonymes, deux libellés vides). Revue manuelle par `geocode-pick --target <branche> --label <libellé> --ref <réf>` (source `manuel`) ; choix de Folpe : Montreuil (93) et Valence (Drôme). Exécuté sur `main` le 2026-10-12 après le go de Folpe : 29 lieux géocodés, les deux choix manuels appliqués, restent « Nowhere » et « non renseigné ».
- [x] Tests unitaires sur la lecture des libellés et le choix des candidats, tests des géocodeurs sur des réponses enregistrées (`tests/fixtures/geocoding/`, lieux publics sans lien avec la famille), intégration du service sur Postgres.
- Nominatim interdit l'autocomplétion : la saisie des lieux à l'étranger (phase d'édition) devra passer par un autre service.

### Lot 8 : migration Notion -> Neon (section 15.1)

Script `scripts/migrate-notion/`, idempotent, mode `--dry-run`, cible choisie explicitement (`--target dev|preview|main`).

Réalisé (2026-10-12) : `scripts/migrate-notion.ts` (`extract`, `report`, `load --target <branche> [--dry-run]`, `--confirm-production` exigé pour `main`) ; logique pure et testée dans `src/server/migration/`. Secrets (jeton Notion, base, clé AES-256-GCM de l'export) dans le trousseau macOS ; export, photos et rapport chiffrés ou en `0600` sous `~/.local/share/ances-tree/notion-exports/`. Écart au plan : les essais se font sur une branche Neon dédiée `notion-import` (copie de `main`) plutôt que `dev` et `preview`, qui portent la famille fictive Marchand ; le chargement refuse toute base contenant des fiches sans identifiant Notion. Premier export : 103 pages, 21 photos, 27 unions, 130 filiations, 0 anomalie à corriger, 21 à vérifier (dates au 1er janvier, un doublon probable, fiches sans date), 19 surnoms. Les surnoms sont portés par la fiche depuis le 2026-10-12 (colonne `persons.nickname`, affichés sur la fiche, cherchables, masqués pour un mineur comme les autres noms). Les photos sont conservées chiffrées ; leur chargement attend le pipeline du lot 6.

- [x] **Extraction** : export brut de toute la base Notion (pages et propriétés) en JSON daté, stocké hors du repo et chiffré au repos ; la suite de la migration lit ce fichier, pas l'API.
- [x] **Photos, pendant l'extraction** : les URLs de fichiers Notion sont signées et expirent au bout d'une heure, les URLs externes peuvent disparaître. Chaque photo est téléchargée immédiatement, son empreinte SHA-256 calculée, le binaire conservé avec l'export ; les échecs sont listés.
- [x] **Transformation** : mapping Notion -> schéma (personnes, unions, filiations, événements, lieux, résidences), validation Zod, invariants de phase 2 appliqués, `legacy_notion_id` conservé ; anomalies collectées (parent introuvable, cycle, date impossible, doublon probable, photo en échec) au lieu d'arrêter le script.
- [x] **Chargement** : transaction unique par cible ; médias passés par le pipeline du lot 6 ; upsert par `legacy_notion_id` et empreinte, donc rejouable sans doublon.
- [ ] **Rapport** : Markdown et JSON (comptes par type, anomalies avec lien Notion, photos en échec, lieux non géocodés), relu avec Folpe.
- [ ] **Contrôles** : comptages Notion vs Neon par type ; échantillon de 20 fiches comparées visuellement ; toutes les photos accessibles par URL signée.
- [ ] Ordre d'exécution : `--dry-run` sur `dev`, puis réel sur `dev`, puis `preview` ; corrections dans Notion ou dans le mapping ; **validation explicite de Folpe** ; puis exécution sur `main`. Essais faits sur la branche `notion-import` plutôt que `dev`/`preview` ; fiches, unions et filiations chargées sur `main` le 2026-10-12 après le feu vert de Folpe (103 / 27 / 130, rejouable sans écart) ; 21 photos chargées sur `main` le même jour par le pipeline du lot 6, sans échec.
- [x] Tests : transformation testée sur un export Notion anonymisé en fixture ; idempotence testée (deux exécutions = même état).
- **Garde-fou destructif :** l'écriture sur la branche `main` de Neon n'a lieu qu'après validation écrite de Folpe du rapport `preview`. Notion n'est jamais modifié par le script.

### Lot 9 : envoi et bascule

La bascule (redirection, suppressions, fin de Notion) est reportée après parité fonctionnelle : [décision du 2026-10-12](../decisions-log/2026-10-12-bascule-apres-parite--c78945f9-9b5c-4ac6-859b-e34d3403431b.md). D'ici là, Notion reste la source et Neon est resynchronisé à la demande (`load`, rejouable).

- [x] Domaine `famille.folpe.me` branché sur Vercel (CNAME chez Gandi), certificat Let's Encrypt actif.
- [x] Domaine d'envoi Resend `mail.folpe.me` (créé par Folpe) : DKIM `resend._domainkey.mail.folpe.me`, MX et SPF sur `send.mail.folpe.me` ; DMARC hérité de `folpe.me`. Clé posée dans Vercel sur les 3 environnements, `EMAIL_FROM=Ances-Tree <famille@mail.folpe.me>`.
- [ ] Envoi de test reçu en boîte principale chez Gmail et chez un webmail Orange (aînés). Gmail validé le 2026-10-12 (lien de connexion de production) ; Orange à vérifier avec les vraies adresses des premiers invités.
  Les liens de connexion ne fonctionnent pas sur les previews : la protection Vercel retire le paramètre `token` de l'URL. Tester la connexion en local ou en production.
- [ ] Création des comptes : Folpe (propriétaire, admin) puis premières invitations envoyées par Folpe. Compte propriétaire créé en production le 2026-10-12 ; invitations à venir.
- [ ] **Bascule, reportée.** Redirection 301 de `ances-tree.netlify.app` vers `famille.folpe.me` (règle `[[redirects]]` dans `netlify.toml` d'une branche de redirection publiée une dernière fois sur Netlify).
- [ ] **Bascule, reportée.** Suppression de `netlify/functions`, du client Notion, de `netlify.toml` (après la publication de la redirection) et du dossier `legacy/`.
- [ ] Mise à jour de la spec et de `docs/decisions-log/` si des écarts sont apparus.
- **Garde-fou destructif :** la révocation du token Notion et l'archivage de la base Notion n'ont lieu qu'après feu vert explicite de Folpe, une fois la production vérifiée pendant au moins une semaine.

## 6. Commandes de vérification

```bash
bun run lint && bun run type-check && bun run test && bun run build && bun run knip
bunx drizzle-kit generate          # migration SQL relue dans la PR
bunx drizzle-kit migrate           # dev / preview uniquement sans validation
bun run test:integration           # contre DATABASE_URL de dev
bun run test:e2e                   # Playwright
bun run migrate:notion -- --dry-run --target dev
```

## 7. Risques et garde-fous

- **Production cassée pendant la transition** : verrou du déploiement Netlify avant le lot 1, bascule DNS seulement au lot 9.
- **Fuite de données de vivants** : redaction côté serveur avant sérialisation, tests d'intégration sur le payload, app 100 % authentifiée, `noindex`.
- **Emails en spam** (magic link inutilisable pour les aînés) : SPF, DKIM, DMARC alignés avant la bascule, test multi-fournisseurs.
- **Passkeys** : RP ID `folpe.me` pour survivre à un renommage de sous-domaine ; le magic link reste toujours disponible en secours.
- **Photos perdues** : téléchargement immédiat pendant l'extraction, empreintes, rapport des échecs, export brut conservé.
- **Migration partielle** : transaction par cible, idempotence, `--dry-run`, ordre `dev` -> `preview` -> `main`.
- **Coûts** : Neon et Vercel en offre gratuite au départ ; surveiller le stockage Blob (dérivées WebP pour limiter le volume).
- **Garde-fou destructif global** : migration de schéma sur la production, écriture des données réelles sur `main`, suppression de Notion ou de l'app Netlify, révocation de secrets : chacune attend une validation explicite de Folpe.

## 8. Hors périmètre

- Moteur de rendu ELK, caméra GSAP, vues éventail, frise, carte (phases 4, 5 et 7).
- Éditeur intégré, suggestions, veille de lignée et annulation côté UI (phase 6). Le schéma les prévoit dès maintenant.
- Récits (phases 8 et 9), GEDCOM (phase 6).

## 9. Actions qui nécessitent Folpe

| Quand | Action |
|---|---|
| Avant le lot 1 | Verrouiller le déploiement de production Netlify. |
| Avant le lot 2 | Créer ou relier le projet Vercel (équipe et facturation), donner accès au repo GitHub. |
| Avant le lot 3 | Créer le compte et le projet Neon (ou autoriser l'intégration Vercel-Neon), choisir la région. |
| Lot 3 | Valider la première migration SQL sur la branche `main`. |
| Avant le lot 4 | Compte Resend, domaine d'envoi `mail.folpe.me` (fait). |
| Lot 4 | Fournir l'adresse email du compte propriétaire. |
| Avant le lot 8 | Fournir un token Notion en lecture seule et l'ID de la base ; indiquer où stocker l'export brut chiffré. |
| Lot 8 | Relire et valider le rapport de migration `preview`, arbitrer les anomalies, donner le feu vert pour `main`. |
| Lot 9 | CNAME `famille` vers Vercel, liste des premières personnes à inviter, feu vert pour couper Notion et Netlify. |

## 10. Définition de terminé

- `famille.folpe.me` en production sur Vercel, connexion par magic link et passkey fonctionnelle.
- Toutes les fiches et photos Notion présentes dans Neon et Blob, rapport final validé par Folpe.
- Policy appliquée côté serveur, vérifiée par des tests d'intégration.
- ~~Ancienne app redirigée, fonctions Netlify et intégration Notion supprimées du repo~~ : reporté à la bascule.
- CI verte (lint, types, unitaires, intégration, build, knip, audit, gitleaks, e2e).

## 11. PR proposées

1. `feat: bascule de Farm vers Next 16` (lot 1).
2. `feat: env validé et projet Vercel` (lot 2).
3. `feat(db): schéma Drizzle et migrations Neon` (lot 3).
4. `feat(auth): magic link, passkey, invitations et demandes d'accès` (lot 4).
5. `feat(family): lecture du graphe à travers la policy` (lot 5).
6. `feat(media): Blob privé et normalisation des images` (lot 6).
7. `feat(places): géocodage BAN et Nominatim` (lot 7).
8. `feat(migration): script Notion vers Neon` (lot 8), exécution sur `main` hors PR après validation.
9. `chore: bascule de domaine et suppression de Notion et Netlify` (lot 9).
