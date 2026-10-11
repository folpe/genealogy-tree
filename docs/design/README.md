# Design

- [DESIGN.md](DESIGN.md) : tokens, typographie, composants, règles de l'arbre, écrans, motion. Référence pour implémenter.
- [maquettes/](maquettes/) : copie versionnée des maquettes validées le 2026-10-09.

## Ouvrir les maquettes

La version vivante et interactive est le canvas : https://claude.ai/artifact/72o5WKvd2GawZpMCfdKKD2 (page "Parcours, thème clair", page "Thème sombre").

Les fichiers `.dc.html` du dossier `maquettes/` sont au format du canvas (gabarit `<x-dc>` et classe `DCLogic`) : ils ne s'exécutent pas seuls dans un navigateur. Ils servent de référence lisible (valeurs exactes de couleurs, tailles, textes, données de démonstration) et d'archive.

## Règle

Toute modification visuelle passe d'abord par le canvas, puis est reportée ici : maquette recopiée dans `maquettes/`, valeur ou règle mise à jour dans `DESIGN.md`. Le code suit ces deux sources, jamais l'inverse.
