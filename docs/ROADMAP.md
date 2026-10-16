# Feuille de route

Point d'entrée pour savoir où en est la refonte et ce qu'il reste à faire. Le détail de chaque phase vit dans son plan ; la spec reste la référence fonctionnelle, `DESIGN.md` la référence visuelle.

| Document | Rôle |
|---|---|
| [Spec de la refonte](specs/2026-10-09-refonte-racines.md) | Ce qu'on construit et pourquoi |
| [Journal de décisions](decisions-log/) | Un fichier immuable par décision ; [DECISIONS.md](DECISIONS.md) figé pour les ADR 01 à 14 |
| [Design](design/DESIGN.md) | Tokens, composants, écrans, animations |
| [Maquettes](design/README.md) | Canvas en ligne et copies `.dc.html` |

## Phases

| Phase | Plan | Statut | Sortie |
|---|---|---|---|
| 0 | Hotfix sécurité | Écartée le 2026-10-09 (risque accepté jusqu'à la phase 3) | - |
| 1 | [Fondations](plans/2026-10-09-phase-1-fondations.md) | Faite | CI verte |
| 2 | [Domaine en TDD](plans/2026-10-09-phase-2-domaine.md) | Faite | Graphe, parenté, policies couverts |
| 3 | [Socle Next, Neon, auth, migration Notion](plans/2026-10-09-phase-3-socle-next-neon.md) | Faite, bascule reportée | App en ligne sur `famille.folpe.me` avec comptes et données migrées |
| 4 | [Moteur de rendu](plans/2026-10-09-phase-4-moteur-rendu.md) | En cours | Arbre complet et fluide |
| 5 | [Design et animations](plans/2026-10-09-phase-5-design-animations.md) | Terminée, validée par Folpe le 2026-10-16 (reste : vérifications sur iPhone réel) | Maquettes implémentées |
| 6 | [Édition et droits](plans/2026-10-09-phase-6-edition-droits.md) | À faire | La famille contribue |
| 7 | [Vues éventail, frise, carte](plans/2026-10-09-phase-7-vues.md) | À faire | Effet waouh |
| 8 | [Récits](plans/2026-10-09-phase-8-recits.md) | À faire | Mémoire collectée |
| 9 | [Récits animés, poster, PWA](plans/2026-10-09-phase-9-recits-animes-pwa.md) | À faire | |

**Bascule** : l'ancienne app (Netlify, Notion) reste en ligne jusqu'à ce que la nouvelle soit à parité, arbre graphique et édition compris ([décision du 2026-10-12](decisions-log/2026-10-12-bascule-apres-parite--c78945f9-9b5c-4ac6-859b-e34d3403431b.md)). D'ici là, Notion reste la source et Neon est resynchronisé à la demande.

## Règles de suivi

- Une phase commence par la relecture de son plan ; on coche les cases au fil des PR, dans la même PR que le code.
- Toute décision structurante prise en route rejoint `docs/decisions-log/` ; tout changement visuel passe d'abord par le canvas puis par `DESIGN.md`.
- Opérations irréversibles (migration de schéma en production, écriture de données réelles, suppression de Notion ou de Netlify, DNS) : validation explicite de Folpe avant exécution.

## Actions qui reviennent à Folpe

- [x] Protection de branche `main` sur GitHub (check `quality`) : posée le 2026-10-16 (PR obligatoire, `quality` exigé, admins compris, ni force-push ni suppression).
- [ ] Phase 3 : comptes et accès Neon, Vercel, Resend ; enregistrements DNS de `folpe.me` (CNAME `famille`, SPF, DKIM, DMARC) ; secrets Notion pour l'extraction.
- [x] Phase 3 : relecture du rapport d'anomalies de la migration avant la production (chargement validé le 2026-10-12).
- [ ] Bascule, après parité : feu vert pour couper Notion et Netlify.
- [ ] Questions ouvertes de la spec (section 18) au moment de leur phase.
