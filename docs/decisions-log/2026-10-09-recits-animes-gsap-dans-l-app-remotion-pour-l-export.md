---
date: 2026-10-09
title: "Récits animés : GSAP dans l'app, Remotion pour l'export"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: Récits animés : GSAP dans l'app, Remotion pour l'export

- **Date :** 2026-10-09
- **Décision :** les récits animés sont composés de scènes paramétrées, jouées avec GSAP dans l'app ; l'export vidéo passe par Remotion.
- **Pourquoi :** un seul langage visuel entre l'app et les vidéos, scènes générées à partir des données plutôt que montées à la main.
- **Alternatives écartées :** montage vidéo manuel (ne passe pas à l'échelle, style incohérent) ; génération vidéo par IA (rendu non maîtrisé, invente des images).
- **À réexaminer si :** la licence Remotion ne convient pas à l'usage, ou si l'export vidéo n'est finalement pas utilisé.
