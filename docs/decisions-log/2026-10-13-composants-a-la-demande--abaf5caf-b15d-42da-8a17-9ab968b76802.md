---
schemaVersion: 1
id: "adr:abaf5caf-b15d-42da-8a17-9ab968b76802"
createdAt: "2026-10-13T15:02:53.000Z"
title: "Composants d'interface à la demande"
status: accepted
deciders: ["claude"]
supersedes: []
---

# Composants d'interface à la demande

## Context

Le lot 2 de la phase 5 prévoyait une bibliothèque `components/ui/` complète (Button, IconButton, Pill, Chip, Switch, Input, Select, Tabs, Badge, Kicker, Card, Sheet, Dialog, Toast, Tooltip), avec cva, `cn` (clsx + tailwind-merge), lucide et une page `/dev/ui` de démonstration. Au début de la phase, l'app a déjà ses écrans (arbre, fiche, éventail, membres, ajout de proches) construits sur Radix et les tokens de `globals.css`, sans ces dépendances.

## Decision

Les composants se créent quand un écran en a besoin, et seulement à ce moment : un composant partagé naît au deuxième usage réel, pas avant. Pas de cva, de tailwind-merge ni de page `/dev/ui` tant qu'aucun besoin concret ne les justifie. Les dépendances du plan qui portent une fonction (cmdk pour ⌘K, vaul pour la feuille mobile) arrivent avec leur lot.

## Consequences

Positive:

- Pas de code ni de dépendance sans usage ; chaque composant est façonné par un écran réel.
- La revue visuelle se fait sur les écrans eux-mêmes, en clair et en sombre, plutôt que sur une page de démonstration.

Negative:

- Des classes Tailwind se répètent entre écrans tant qu'un composant n'a pas été extrait ; à surveiller dans les revues.
