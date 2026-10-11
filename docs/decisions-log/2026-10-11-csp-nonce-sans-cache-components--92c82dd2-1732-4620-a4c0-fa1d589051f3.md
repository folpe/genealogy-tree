---
schemaVersion: 1
id: "adr:92c82dd2-1732-4620-a4c0-fa1d589051f3"
createdAt: "2026-10-11T14:29:39.584Z"
title: "CSP à nonce, sans cacheComponents"
status: proposed
deciders: ["folpe"]
supersedes: []
---

# CSP à nonce, sans cacheComponents

## Context

Le plan de la phase 3 (lot 1) demandait à la fois `cacheComponents: true`, repris de void-starter, et une CSP stricte. La doc de Next 16 (`content-security-policy.md`) l'écrit explicitement : le Partial Prerendering, qu'active `cacheComponents`, est incompatible avec une CSP à nonce. Les scripts du shell statique sont générés au build et ne peuvent pas porter le nonce de la requête. Vérifié sur le build : une page prérendue sort 14 scripts sans nonce, que la CSP bloquerait tous.

L'app contient des données personnelles de vivants et de mineurs. Chaque page dépend de la session et de la policy de visibilité, donc rien n'est partageable en cache entre membres.

## Decision

On garde la CSP à nonce (`script-src 'self' 'nonce-…' 'strict-dynamic'`, posée par `src/proxy.ts`), on n'active pas `cacheComponents`, et le layout racine force le rendu à la requête (`await connection()`).

## Consequences

Positive:

- Aucun script inline injecté ne peut s'exécuter, ce qui est la meilleure défense contre une XSS qui exfiltrerait l'arbre.
- Vérifié : 8 scripts sur 8 portent le nonce, aucune violation dans la console.

Negative:

- Pas de `'use cache'` ni de shell statique. Le cache de données passera par les primitives de Next hors Cache Components, ou par un cache applicatif, si une mesure le justifie un jour (graphe complet chargé en quelques requêtes pour une centaine de fiches).
- Écart avec void-starter, qui active `cacheComponents`.

## Alternatives considered

- `cacheComponents` avec une CSP sans nonce (`script-src 'self' 'unsafe-inline'`) : écartée, car un script inline injecté s'exécuterait.
- `cacheComponents` avec CSP par hachage via SRI (`experimental.sri`) : écartée pour l'instant. La fonction est expérimentale et ne couvre que les fichiers ; les scripts inline du flux RSC resteraient à autoriser.

## Reversal cost

Low : une option dans `next.config.ts`, une ligne dans le layout et la directive `script-src`. À réexaminer si Next rend PPR compatible avec les nonces.
