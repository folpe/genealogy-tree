# Feuille de route

Point d'entrée pour savoir où en est la refonte et ce qu'il reste à faire. Le détail de chaque phase vit dans son plan ; la spec reste la référence fonctionnelle, `DESIGN.md` la référence visuelle.

| Document | Rôle |
|---|---|
| [Spec de la refonte](specs/2026-10-09-refonte-ances-tree.md) | Ce qu'on construit et pourquoi |
| [Journal de décisions](DECISIONS.md) | Choix structurants, ajout uniquement |
| [Design](design/DESIGN.md) | Tokens, composants, écrans, animations |
| [Maquettes](design/README.md) | Canvas en ligne et copies `.dc.html` |

## Phases

| Phase | Plan | Statut | Sortie |
|---|---|---|---|
| 0 | Hotfix sécurité | Écartée le 2026-10-09 (risque accepté jusqu'à la phase 3) | - |
| 1 | [Fondations](plans/2026-10-09-phase-1-fondations.md) | Faite, PR à merger | CI verte |
| 2 | [Domaine en TDD](plans/2026-10-09-phase-2-domaine.md) | En cours (lots 1 et 2) | Graphe, parenté, policies couverts |
| 3 | [Socle Next, Neon, auth, migration Notion](plans/2026-10-09-phase-3-socle-next-neon.md) | À faire | App en ligne sur `famille.folpe.me` avec comptes et données migrées |
| 4 | [Moteur de rendu](plans/2026-10-09-phase-4-moteur-rendu.md) | À faire | Arbre complet et fluide |
| 5 | [Design et animations](plans/2026-10-09-phase-5-design-animations.md) | À faire | Maquettes implémentées |
| 6 | [Édition et droits](plans/2026-10-09-phase-6-edition-droits.md) | À faire | La famille contribue |
| 7 | [Vues éventail, frise, carte](plans/2026-10-09-phase-7-vues.md) | À faire | Effet waouh |
| 8 | [Récits](plans/2026-10-09-phase-8-recits.md) | À faire | Mémoire collectée |
| 9 | [Récits animés, poster, PWA](plans/2026-10-09-phase-9-recits-animes-pwa.md) | À faire | |

## Règles de suivi

- Une phase commence par la relecture de son plan ; on coche les cases au fil des PR, dans la même PR que le code.
- Toute décision structurante prise en route rejoint `DECISIONS.md` ; tout changement visuel passe d'abord par le canvas puis par `DESIGN.md`.
- Opérations irréversibles (migration de schéma en production, écriture de données réelles, suppression de Notion ou de Netlify, DNS) : validation explicite de Folpe avant exécution.

## Actions qui reviennent à Folpe

- [ ] Protection de branche `main` sur GitHub (check `quality`).
- [ ] Phase 3 : comptes et accès Neon, Vercel, Resend ; enregistrements DNS de `folpe.me` (CNAME `famille`, SPF, DKIM, DMARC) ; secrets Notion pour l'extraction.
- [ ] Phase 3 : relecture du rapport d'anomalies de la migration avant la production ; feu vert pour couper Notion et Netlify.
- [ ] Questions ouvertes de la spec (section 18) au moment de leur phase.
