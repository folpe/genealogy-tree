# Phase 6 : édition intégrée, droits par proximité et contribution

- **Date :** 2026-10-09
- **Spec :** [refonte Racines](../specs/2026-10-09-refonte-racines.md), sections 5, 6, 7, 13
- **Visuels :** [DESIGN.md](../design/DESIGN.md), maquettes `docs/design/maquettes/` : `Arbre` (actions rapides, encart de droits, réglage de vue Hugo / Isabelle), `Suggestion`, `Activite`, `Membres` (vues membre et admin), `EmailVeille`
- **Statut :** à faire

## Objectif et sortie attendue

La famille contribue directement dans l'app, sans modération lourde : chacun modifie sa lignée, suggère ailleurs, est prévenu de ce qui change sur sa lignée et peut l'annuler en un clic. Les membres invitent leurs proches.

Sortie : un membre crée, modifie et supprime des fiches dans son périmètre ; hors périmètre, il suggère aux gardiens ; la veille de lignée et l'annulation fonctionnent de bout en bout, emails compris ; import et export GEDCOM disponibles pour les admins.

## Prérequis

- Phase 2 : `access.policy.ts` (périmètre, gardiens, visibilité, mineurs) et invariants du graphe, testés.
- Phase 3 : schéma Drizzle complet (`suggestions`, `activity`, `invitations`, `access_requests`, `sources`, `media`), better-auth, Resend configuré sur `folpe.me`, Vercel Blob.
- Phase 5 : composants UI, fiche, Sheet / Dialog.

## Décisions prises

- ADR 03 : Neon source de vérité, éditeur intégré.
- ADR 04 et 08 : comptes sur invitation, deux statuts (membre, admin), droits par proximité.
- Spec 6.3 : suggestion aux gardiens, escalade aux admins après 14 jours, veille de lignée avec annulation, anti guerre d'édition, faits sourcés, historique complet.
- Spec 8.1 : un conjoint d'une union terminée sort du cercle proche.

## Lots

### Lot 1 : autorisation côté serveur

- [ ] Chaque service d'écriture (`family`, `suggestions`, `members`) appelle la policy avant toute écriture ; aucune décision de droit côté client. Fait pour `family` et `members` ; `suggestions` avec son lot.
- [ ] `server/access/access.service.ts` : calcul du périmètre et des gardiens à partir du graphe en base, mis en cache par requête (React `cache`) et invalidé à chaque écriture de filiation.
- [x] Projection de visibilité appliquée dans les repositories / mappers : les champs masqués ne quittent jamais le serveur (vivants hors périmètre, mineurs, `visibility = cercle`). Fait en phase 3, lot 5 : projection au service (`viewTreeAs`), avant sérialisation.
- [x] Journal des consultations admin de fiches restreintes. Fait en phase 3 (lot 5, `admin_record_views`).
- [ ] Actions : `defineAction` / `defineFormAction` avec Zod, erreurs typées (`hors_perimetre`, `invariant`, `source_requise`, `conflit`). Partiel : Zod et `AppError` codés par action ; reste l'enveloppe commune et le code `conflit`.

### Lot 2 : éditeur intégré

- [x] Version minimale avancée (2026-10-13) : « + Parent », « + Enfant », « + Conjoint » sur la fiche, dans le périmètre seulement (policy `editableIds`, revérifiée à l'écriture), invariants du graphe, dates en saisie libre, lieu réutilisé, verrou contre un troisième parent. Pas encore : modification, suppression, recherche anti doublon, photos, ligne `activity` (lot 4, migration à valider).

- [ ] Actions rapides sur le nœud (survol desktop, appui long mobile) : "+ Parent", "+ Enfant", "+ Conjoint", "Modifier" ou "Suggérer" selon la policy (maquette Arbre). Fait (2026-10-14) : appui long, clic droit, Maj + F10, ajouts selon la policy ; reste « Modifier » et « Suggérer ».
- [ ] `components/EditDrawer/` : tiroir desktop, bottom sheet mobile, react-hook-form + Zod, raison affichée ("Ta lignée directe", "Fiche ouverte") ou destinataire de la suggestion. Remplacé (2026-10-14) : modification sur place dans la fiche (#124) ; reste le destinataire de la suggestion.
- [ ] Recherche d'une personne existante avant création (anti doublon), fusion de doublons réservée aux admins.
- [x] Dates à précision variable (`exacte`, `mois`, `annee`, `vers`, `avant`, `apres`, `entre`) avec saisie naturelle ("vers 1850"). Fait (2026-10-14, #128) : les 7 précisions ; saisie libre remplacée par calendrier et « Date approximative ».
- [ ] Lieux : autocomplétion BAN (France) et Nominatim (étranger), géocodage immédiat.
- [ ] Photos : glisser-déposer vers Vercel Blob (upload client signé), recadrage circulaire, suppression EXIF GPS, blur placeholder. Fait (2026-10-14, #125) : photo depuis l'appareil, EXIF et GPS retirés, aperçu flou ; reste le glisser-déposer, le recadrage et l'upload client signé.
- [ ] Après enregistrement : re-layout ELK et apparition animée du nœud (phase 4 et 5). Mécanisme en place (`use-relayout.ts`) ; reste à vérifier et à tester sur un ajout.
- [x] Suppression : fiche sans descendants uniquement, sinon passage par un admin ; confirmation explicite. Fait (2026-10-14, #126) : corbeille restaurable par un admin plutôt qu'un effacement.

### Lot 3 : faits sourcés

- [ ] `sources` liées aux événements ; badge "Sourcé" sur la fiche. Badge fait (phase 5) ; reste la source affichée et saisie.
- [ ] Modifier un fait sourcé exige une nouvelle source, sinon la modification devient une suggestion. Garde-fou posé (modification refusée) ; reste la source exigée ou la suggestion.

### Lot 4 : journal d'activité, historique et restauration

- [ ] Toute écriture produit une ligne `activity` (acteur, action, entité, avant / après en JSON, date) dans la même transaction.
- [ ] Historique par fiche : liste chronologique, restauration de n'importe quelle version (nouvelle écriture, jamais de réécriture du passé).

### Lot 5 : veille de lignée et annulation

- [ ] Calcul des destinataires : membres dont le périmètre contient la fiche modifiée, hors auteur.
- [ ] Notification immédiate ou résumé quotidien selon la préférence ("Me prévenir : tout de suite / résumé quotidien").
- [ ] Annulation en un clic depuis l'app ou l'email (lien signé à usage unique, expiration).
- [ ] Anti guerre d'édition : une modification annulée ne peut pas être réappliquée directement par la même personne ; la tentative crée une suggestion aux gardiens.

### Lot 6 : suggestions et escalade

- [ ] Écran Suggestion (maquette) : valeurs actuelles et nouvelles par champ, justificatif optionnel, message au gardien, confirmation "Envoyé à Anne. Sans réponse sous 14 jours, un admin prendra le relais."
- [ ] Payload de suggestion = diff validé par Zod, rejoué dans une transaction à l'acceptation (revalidation de la policy et des invariants au moment de l'acceptation).
- [ ] Plusieurs gardiens : la première réponse tranche, les autres voient la décision.
- [ ] Escalade : cron Vercel quotidien (`vercel.ts` `crons`) qui passe aux admins les suggestions sans réponse depuis 14 jours, idempotent.
- [ ] Encart de droits (`rightsNotice`, `src/server/access/access.rights.ts`) remis au présent une fois les suggestions et la veille de lignée livrées (« ta suggestion ira à X », « toute sa lignée est prévenue et peut annuler »), avec les refus « arrivent bientôt » des services d'ajout et de modification.

### Lot 7 : écran Activité

- [ ] Onglets "À décider", "Veille de lignée", "Mes suggestions" avec compteurs (maquette Activite), actions Accepter / Refuser / Annuler qui mettent à jour la ligne, barre d'escalade restante, réglage de notification.
- [ ] Pastille de la cloche dans le header.

### Lot 8 : membres, invitations, demandes d'accès

- [x] Écran Famille connectée (maquette Membres) : liste des membres avec fiche liée et statut, invitations en cours. Fait (#76, 2026-10-16 #157) : membres, statut, invitations en attente (admins) avec Annuler et Renvoyer.
- [x] Inviter un proche : tout membre, pour une fiche de son cercle proche ou de ses descendants sans compte ; email avec lien d'acceptation qui lie le compte à la fiche. Fait (phase 3, #76 ; complété par #155 et #157 le 2026-10-16).
- [ ] Vue admin : demandes d'accès à valider en reliant à une fiche, suggestions escaladées, "Nommer admin" / "Retirer admin" ; le propriétaire ne peut pas être rétrogradé, impossible de retirer le dernier admin. Fait sauf les suggestions escaladées.

### Lot 9 : emails

- [ ] React Email + Resend depuis `famille@mail.folpe.me` : invitation, magic link (phase 3), veille de lignée (maquette EmailVeille : avant / après, source, "C'est bon", "Annuler la modification"), suggestion reçue, décision sur ma suggestion, escalade, résumé quotidien. Fait : connexion, invitation, demande d'accès ; reste veille, suggestion, décision, escalade, résumé.
- [ ] Liens d'action signés, désinscription et passage au résumé quotidien en un clic.

### Lot 10 : GEDCOM

- [ ] Export GEDCOM 5.5.1 (et 7.0 si l'outil cible le demande) réservé aux admins, vivants filtrés selon la spec 13.
- [ ] Import GEDCOM : aperçu, rapport d'anomalies et de doublons probables, fusion manuelle, dans une transaction ; jamais d'écrasement silencieux.

## Tests

- Unitaires : policy (déjà en phase 2) étendue aux cas d'écriture, calcul des destinataires de la veille, anti guerre d'édition, escalade (horloge simulée), diff de suggestion, parseur et générateur GEDCOM (aller-retour sur fichiers d'exemple).
- Intégration (Postgres CI) : transactions d'écriture + activité, acceptation de suggestion qui revalide la policy, restauration de version.
- Playwright (section 16) : modification dans le périmètre, suggestion hors périmètre, acceptation par le gardien, annulation depuis la veille de lignée, invitation et acceptation, demande d'accès validée par un admin.

## Critères d'acceptation

- [ ] Le scénario de la spec 6.6 passe de bout en bout : Hugo modifie Henri, Isabelle suggère sur Luc, Luc accepte, Isabelle corrige Henri et Hugo annule depuis l'email.
- [ ] Aucune donnée masquée dans les réponses réseau d'un membre hors périmètre (test e2e qui inspecte les payloads). Partiel : document servi contrôlé en e2e ; reste les réponses des server actions.
- [ ] Toute écriture a sa ligne d'activité, toute version est restaurable.
- [ ] Suggestion sans réponse escaladée à J+14 exactement une fois.

## Risques

- **Calcul du périmètre coûteux** sur grands graphes : cache par requête, index sur `parent_child` et `unions`, précalcul si nécessaire.
- **Conflits d'écriture simultanés** : verrou optimiste (colonne `version`), message clair en cas de conflit.
- **Délivrabilité des emails** : SPF / DKIM / DMARC sur `folpe.me`, tests sur Gmail, Outlook et iCloud.
- **GEDCOM hétérogène** selon les logiciels : jeu de fichiers d'exemple (Geneanet, Gramps, MyHeritage) dans les tests.

## Hors périmètre

- Fusion automatique de doublons, modération par IA, notifications push (PWA en phase 9).

## Définition de terminé

CI verte avec e2e des parcours de contribution, scénario 6.6 démontré sur la preview, emails reçus et cliqués sur de vraies boîtes, Folpe valide les écrans Suggestion, Activité et Membres face aux maquettes.

## Découpage en PR

1. `feat(access): autorisation et projection de visibilité serveur` (lot 1)
2. `feat(editor): tiroir d'édition, dates, lieux, photos` (lots 2 et 3)
3. `feat(activity): journal, historique et restauration` (lot 4)
4. `feat(activity): veille de lignée et annulation` (lot 5)
5. `feat(suggestions): suggestions, gardiens et escalade` (lot 6)
6. `feat(inbox): écran Activité` (lot 7)
7. `feat(members): invitations, demandes d'accès, admins` (lot 8)
8. `feat(notifications): emails React Email` (lot 9)
9. `feat(gedcom): import et export` (lot 10)
