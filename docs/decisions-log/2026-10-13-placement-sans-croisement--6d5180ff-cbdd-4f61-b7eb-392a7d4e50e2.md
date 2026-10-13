---
schemaVersion: 1
id: "adr:6d5180ff-cbdd-4f61-b7eb-392a7d4e50e2"
createdAt: "2026-10-13T17:05:08.000Z"
title: "Placement sans croisement : couples orientés et graines essayées"
status: accepted
deciders: ["folpe", "claude"]
supersedes: []
---

# Placement sans croisement : couples orientés et graines essayées

## Context

Sur la famille réelle (112 fiches, vue « toute la famille »), des cousins de la compagne de Folpe s'intercalaient entre lui et ses propres frères et cousins : 2 traits de filiation se croisaient. La forme est reproduite en famille fictive (`tree.crossings.test.ts`) : deux familles reliées par un couple, des oncles et cousins de chaque côté. Deux causes : l'ordre des partenaires d'un couple est fixé avant ELK, qui ne retourne jamais un bloc ; et la minimisation des croisements d'ELK (heuristique par balayage de couches) s'arrête sur un optimum local qui dépend de sa graine.

## Decision

Le placement mesure ses croisements (`countCrossings`). Il essaie jusqu'à trois graines d'ELK et garde le placement le moins croisé, en s'arrêtant au premier sans croisement. Pour chaque graine, un premier passage situe les familles d'origine ; chaque couple de deux est alors tourné pour que chaque partenaire soit du côté de ses parents, et un second passage replace. Minimisation renforcée : `thoroughness` 50 et échanges gloutons des deux côtés.

Rejetés : `considerModelOrder` et ses variantes, ainsi qu'une minutie portée à 100 (aucun effet sur la forme fautive) ; un ordre de lecture calculé par nous et imposé à ELK (`forceNodeModelOrder`), qui reviendrait à réécrire la minimisation des croisements.

## Consequences

Positive:

- 0 croisement sur la famille réelle dans toutes les vues, et sur les cinq formes fictives.
- La mesure de lisibilité est testée : une régression de placement se voit en CI.

Negative:

- Jusqu'à six passages d'ELK dans le pire cas (trois graines, deux passes chacune) ; 119 ms pour toute la famille réelle contre 91 auparavant. À surveiller si l'arbre grandit beaucoup.
