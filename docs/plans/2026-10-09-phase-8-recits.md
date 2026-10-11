# Phase 8 : récits et témoignages

- **Date :** 2026-10-09
- **Spec :** [refonte Ances-Tree](../specs/2026-10-09-refonte-ances-tree.md), section 11
- **Visuels :** [DESIGN.md](../design/DESIGN.md), maquettes `docs/design/maquettes/Recits.dc.html` et `RecitsSombre.dc.html`
- **Statut :** à faire

## Objectif et sortie attendue

Collecter la mémoire des anciens : enregistrer un témoignage pendant une visite, le transcrire, le structurer en chapitres reliés aux personnes, lieux et dates de l'arbre, et le relire dans l'écran Récits. Sortie : un récit enregistré sur mobile est consultable avec sa transcription synchronisée et ses liens confirmés vers l'arbre.

## Prérequis

Phases 6 (faits sourcés, activité, droits) et 7 (carte, frise pour les liens de lieux et de dates).

## Décisions prises

ADR 10 (récits GSAP dans l'app, export Remotion en phase 9). Les liens proposés par l'IA sont toujours confirmés par un humain ; les nouvelles informations deviennent des faits sourcés de type "témoignage".

## Lots

- [ ] **Modèle** : `stories` (titre, témoin, intervieweur, date, consentement, audio, transcription, statut), `story_segments` (chapitre, horodatages, texte, personnes, lieux, dates liés), migration Drizzle.
- [ ] **Enregistrement** : MediaRecorder (Opus / WebM, repli AAC sur Safari), reprise après interruption, upload fractionné vers Vercel Blob, import de fichier audio existant. Consentement du témoin enregistré avant le début (texte et horodatage).
- [ ] **Pipeline asynchrone** : Vercel Workflow (ou Queues) pour transcription puis structuration, étapes visibles dans la bibliothèque ("Transcription...", barre en 3 étapes de la maquette), reprise sur erreur, idempotence.
- [ ] **Transcription** : fournisseur speech-to-text à choisir (voir questions), horodatage par mot ou par phrase, français et accents régionaux, relecture et correction manuelles.
- [ ] **Structuration** : un LLM derrière l'abstraction AI SDK (ADR 13), par défaut un modèle open-weight peu cher (DeepSeek V3 ou Kimi K2) servi par un hébergeur hors Chine sans rétention, découpe en chapitres, propose titres, personnes, lieux et dates avec citations exactes ; sortie structurée validée par Zod ; chaque proposition de lien est confirmée ou rejetée par un humain.
- [ ] **Écran Récits** : bibliothèque (témoin, durée, statut), lecteur avec chapitres, lecture / pause, transcription défilante (phrase en cours en encre), chips des personnes et lieux cités qui ouvrent l'arbre et la carte, bouton "Enregistrer un récit".
- [ ] **Droits** : un récit hérite de la visibilité la plus restrictive des personnes vivantes citées ; le témoin peut retirer son récit.

## Tests

Unitaires (découpage, mapping de la sortie du modèle, synchronisation transcription / audio), intégration (pipeline avec fournisseurs simulés), Playwright (enregistrer, voir l'étape de traitement, confirmer un lien, relire), évaluation qualité de la structuration sur 3 témoignages réels relus par Folpe.

## Critères d'acceptation

- [ ] Un enregistrement de 30 min sur iPhone aboutit sans perte, même avec une coupure réseau.
- [ ] Aucun lien vers l'arbre créé sans confirmation humaine.
- [ ] Consentement présent pour chaque récit ; suppression complète (audio, transcription, segments) à la demande du témoin.

## Risques

Qualité de transcription sur voix âgées et accents, coût par heure d'audio, données personnelles sensibles envoyées à des tiers (choisir des fournisseurs sans rétention ni entraînement, documenter dans la spec sécurité).

## Hors périmètre

Récits animés et export vidéo (phase 9).

## Questions à trancher

- **Fournisseur de transcription** : critères qualité en français, horodatage, coût, absence de rétention. Candidat par défaut : Whisper large-v3 (open-weight) chez un hébergeur d'inférence bon marché. Comparer sur un même échantillon réel avant de choisir.
- **Modèle de structuration** : DeepSeek V3 vs Kimi K2 (et un modèle Claude comme étalon de qualité) sur les mêmes 3 témoignages ; retenir le moins cher qui passe la relecture de Folpe.
- Stockage de l'audio original : durée de conservation et accès (cercle proche du témoin ou toute la famille).

## Définition de terminé

CI verte, un vrai témoignage familial collecté et relié de bout en bout, validé par Folpe.

## Découpage en PR

1. `feat(stories): modèle et enregistrement` 2. `feat(stories): pipeline transcription et structuration` 3. `feat(stories): écran Récits et liens à l'arbre`
