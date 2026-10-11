---
date: 2026-10-09
title: "GSAP pour les animations, d3 / ELK pour le calcul"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: GSAP pour les animations, d3 / ELK pour le calcul

- **Date :** 2026-10-09
- **Décision :** GSAP 3.13+ anime (caméra, transitions de layout, DrawSVG, Flip, SplitText) ; ELK.js et `d3-hierarchy` calculent les positions ; React rend.
- **Pourquoi :** GSAP est désormais entièrement gratuit et bien supérieur pour orchestrer des timelines ; séparer calcul et animation supprime les manipulations DOM concurrentes de React et d3.
- **Alternatives écartées :** transitions d3 (impératives, en conflit avec React) ; Motion (moins adapté au SVG complexe et aux timelines).
- **À réexaminer si :** le poids du bundle GSAP pèse sur le LCP malgré le chargement différé.
