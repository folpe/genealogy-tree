# Phase 9 : récits animés, export vidéo, poster et PWA

- **Date :** 2026-10-09
- **Spec :** [refonte Ances-Tree](../specs/2026-10-09-refonte-ances-tree.md), sections 9, 10 ("Plus tard"), 11
- **Visuels :** [DESIGN.md](../design/DESIGN.md), maquette `docs/design/maquettes/Recits.dc.html` (scène 16:9, sous-titres, chapitres)
- **Statut :** à faire

## Objectif et sortie attendue

Transformer un récit en court film dans le langage visuel de l'app, le partager hors de l'app, imprimer l'arbre en poster et installer l'app sur le téléphone. Sortie : un récit se joue en motion design dans l'app et s'exporte en MP4 ; un poster PDF haute définition se télécharge ; l'app est installable.

## Prérequis

Phase 8 (récits structurés), phases 4 et 7 (rendu de l'arbre, carte, frise réutilisés comme scènes).

## Décisions prises

ADR 10 : scènes paramétrées jouées en GSAP dans l'app, export vidéo via Remotion.

## Lots

- [ ] **Scènes** (`src/motion/scenes/`) : types paramétrés (carton titre SplitText, arc sur la carte, photo avec citation, branche de l'arbre qui pousse, frise), table `story_scenes` (type, paramètres, ordre), génération initiale à partir des segments, édition simple de l'ordre et des textes.
- [ ] **Lecteur animé** : timeline GSAP maîtresse synchronisée sur l'audio du témoin, sous-titres issus de la transcription, mode plein écran, reduced motion (diaporama en fondus).
- [ ] **Export vidéo** : Remotion (rendu serveur sur Vercel Sandbox ou Remotion Lambda), mêmes composants de scène que l'app, file d'attente et notification à la fin du rendu.
- [ ] **Poster** : export PNG / PDF haute définition de l'arbre ou de l'éventail (rendu SVG serveur, formats A3 / A2 / A1, choix du thème), sans données de vivants masquées.
- [ ] **PWA** : manifeste, icônes, service worker (Serwist), consultation hors ligne de l'arbre et des fiches déjà vues, notifications push optionnelles pour la veille de lignée.

## Tests

Unitaires (paramétrage des scènes, synchronisation audio / timeline), rendu Remotion d'une scène témoin en CI (court), Playwright (lecture d'un récit, export poster, installation PWA en chromium), Lighthouse PWA.

## Critères d'acceptation

- [ ] Un récit réel exporté en MP4 identique à la lecture dans l'app.
- [ ] Poster A2 lisible imprimé, sans fuite de données masquées.
- [ ] App installable sur iOS et Android, arbre consultable hors ligne.

## Risques

Coût et durée du rendu vidéo, divergence entre rendu GSAP navigateur et rendu Remotion (Remotion pilote le temps image par image : les scènes doivent être pilotables par un temps arbitraire), limites du service worker sur iOS.

## Hors périmètre

Montage vidéo libre, génération d'images ou de voix par IA.

## Questions à trancher

- **Licence Remotion** : gratuite pour les particuliers et petites structures, payante au-delà ; vérifier l'usage (projet personnel familial) avant de démarrer.
- Hébergement du rendu vidéo (Vercel Sandbox, Remotion Lambda ou rendu local à la demande).

## Définition de terminé

CI verte, un récit familial exporté et partagé, un poster imprimé, PWA installée sur le téléphone de Folpe.

## Découpage en PR

1. `feat(stories): scènes et lecteur animé` 2. `feat(stories): export vidéo Remotion` 3. `feat(poster): export poster` 4. `feat(pwa): app installable et hors ligne`
