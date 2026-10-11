---
date: 2026-10-09
title: "Fiches ouvertes définies par le périmètre, pas par le cercle proche"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: Fiches ouvertes définies par le périmètre, pas par le cercle proche

- **Date :** 2026-10-09
- **Décision :** une fiche est ouverte (modifiable par tous) seulement si aucun membre inscrit ne l'a dans son périmètre (cercle proche, ascendance et descendance avec conjoints), ni comme ancien conjoint d'une personne de ce périmètre. Précise l'ADR 08.
- **Pourquoi :** avec la définition initiale (« aucun membre ne l'a dans son cercle proche »), Odette, grand-mère de Hugo, aurait été modifiable par Isabelle, et Claire, ancienne compagne de Luc, par Luc lui-même : contraire à « protéger sa lignée » et à la règle des anciens conjoints. Les cas de la spec (Claude ouvert, Marie et Jacques gardés par Isabelle) sont inchangés.
- **Alternatives écartées :** définition par le cercle proche (trop permissive).
- **À réexaminer si :** trop de fiches restent bloquées en suggestion faute de gardien actif.
