---
schemaVersion: 1
id: "adr:781b8b27-f6b1-490b-b879-4419895ecec7"
createdAt: "2026-10-15T14:00:00.000Z"
title: "GSAP chargé avec l'arbre et l'éventail, sans import différé"
status: accepted
deciders: ["folpe", "claude"]
supersedes: []
---

# GSAP chargé avec l'arbre et l'éventail, sans import différé

## Context

Le plan de phase 5 (lot 3) demandait de charger GSAP et ses plugins hors du chemin critique, par import dynamique après le premier rendu. Mesure du build du 2026-10-15 : GSAP, DrawSVG et Inertia tiennent dans un morceau d'environ 32 Ko gzip, sur environ 190 Ko gzip de JS client pour `/tree`. Le découpage par route de Next ne le charge que sur `/tree` et `/ancestors` ; connexion, fiche, membres et admin ne le chargent pas.

Pour refaire la mesure : `bun run build`, puis la taille gzip (`gzip -c | wc -c`) des morceaux de `.next/static/chunks` qui contiennent GSAP, et les routes qui les citent dans leur `page_client-reference-manifest.js` sous `.next/server/app`.

Sur ces deux pages, GSAP porte l'interaction principale dès le montage : la caméra (gestes, inertie, vols), l'entrée de l'arbre au premier affichage (pendant laquelle l'arbre rendu au serveur est masqué) et l'éventail.

## Decision

GSAP reste importé statiquement par `src/motion/gsap.ts`, donc chargé avec les pages qui l'utilisent. Pas d'import dynamique.

## Consequences

Positive:

- Les autres pages ne paient rien : le découpage par route suffit.
- La caméra et l'entrée de l'arbre ne commencent pas après un aller-retour réseau de plus.

Negative:

- Sur `/tree` et `/ancestors`, environ 32 Ko gzip restent dans le JS initial.

## Alternatives

- Import dynamique après le premier rendu : écarté. Sur ces pages, la caméra n'aurait ni gestes ni inertie avant le chargement, et l'arbre masqué de la première visite attendrait plus longtemps son entrée, pour un gain d'environ 32 Ko gzip.
- Caméra sans GSAP pour les gestes, GSAP différé pour les vols et l'entrée : écarté pour l'instant. C'est une refonte de `src/motion/camera.ts` pour le même gain.
