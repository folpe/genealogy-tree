---
date: 2026-10-09
title: "IA des récits : modèles open-weight peu chers, hébergés hors Chine"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: IA des récits : modèles open-weight peu chers, hébergés hors Chine

- **Date :** 2026-10-09
- **Décision :** la transcription et la structuration des récits passent par l'AI SDK (abstraction de fournisseur). Par défaut : Whisper large-v3 pour la transcription, DeepSeek V3 ou Kimi K2 pour la structuration, servis par un hébergeur d'inférence occidental (AI Gateway, Groq, Together, Fireworks ou équivalent) avec engagement de non-rétention et de non-entraînement. Le choix final se fait en phase 8 sur un même échantillon.
- **Pourquoi :** coût très inférieur aux modèles propriétaires pour une tâche d'extraction structurée, validée de toute façon par un humain ; l'abstraction permet de changer de modèle sans toucher au code métier.
- **Alternatives écartées :** API officielles DeepSeek ou Moonshot (données personnelles de la famille, dont des vivants et des mineurs, stockées en Chine : incompatible RGPD) ; modèle Claude par défaut (meilleure qualité mais plus cher, gardé comme étalon de comparaison).
- **À réexaminer si :** la qualité de structuration ne passe pas la relecture, ou si un hébergeur européen devient compétitif en prix.
