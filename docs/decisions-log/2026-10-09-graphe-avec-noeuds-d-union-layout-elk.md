---
date: 2026-10-09
title: "Graphe avec nœuds d'union, layout ELK"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: Graphe avec nœuds d'union, layout ELK

- **Date :** 2026-10-09
- **Décision :** modèle personnes + unions, les enfants partent de l'union ; layout ELK layered en Web Worker.
- **Pourquoi :** une généalogie n'est pas un arbre ; le modèle actuel perd conjoints, remariages et demi-fratries.
- **Alternatives écartées :** `d3.tree` seul (arbre strict) ; dagre (moins bon sur les croisements, peu maintenu).
- **À réexaminer si :** les performances du layout deviennent insuffisantes au-delà de quelques milliers de personnes.
