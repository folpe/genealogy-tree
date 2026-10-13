// tdd-cover: e2e src/components/family/family-tree.test.tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { branchesOf, branchKeys, foldGraph } from '@/lib/tree/tree.fold';
import type { DisplayedGraph } from '@/server/family/family.display';
import { assembleDrawing, peopleOf, type TreeDrawing } from './tree-drawing';

// Branches pliées du canevas. Plier retire la branche sans rien déplacer : le dessin
// plié reprend le placement d'origine (retour de Folpe, 2026-10-13 : un arbre qui se
// réorganise à chaque pli fait perdre ses repères). Calcul synchrone, sans worker.

export type FoldedTree = {
  drawing: TreeDrawing;
  /** Branches pliées (clés : union d'un couple, ou parent seul). */
  folded: ReadonlySet<string>;
  /** Branches qui partent de chaque personne. */
  branchesOf: ReadonlyMap<string, string[]>;
  /** Personnes cachées sous une branche pliée, pour son libellé. */
  hiddenBelow: (key: string) => number;
  /** Plie (`fold`) ou déplie des branches. */
  setFolded: (keys: string[], fold: boolean) => void;
};

export function useFoldedTree(initial: TreeDrawing, graph: DisplayedGraph): FoldedTree {
  const [state, setState] = useState<{ initial: TreeDrawing; folded: ReadonlySet<string> }>({
    initial,
    folded: new Set(),
  });
  // Nouveau rendu serveur (données changées) : on repart de son dessin, tout déplié.
  if (state.initial !== initial) setState({ initial, folded: new Set() });
  const { folded } = state;

  const people = useMemo(() => peopleOf(initial.nodes), [initial.nodes]);
  const keys = useMemo(() => branchKeys(graph), [graph]);
  const byPerson = useMemo(() => branchesOf(graph), [graph]);

  const drawing = useMemo(
    () =>
      folded.size === 0
        ? initial
        : assembleDrawing(foldGraph(graph, folded), initial.layout, people, keys),
    [folded, initial, graph, people, keys],
  );

  const setFolded = useCallback(
    (changed: string[], fold: boolean) =>
      setState((s) => {
        const next = new Set(s.folded);
        for (const key of changed) {
          if (!keys.has(key)) continue;
          if (fold) next.add(key);
          else next.delete(key);
        }
        return next.size === s.folded.size && [...next].every((k) => s.folded.has(k))
          ? s
          : { ...s, folded: next };
      }),
    [keys],
  );

  const hiddenBelow = useCallback(
    (key: string) => graph.personIds.length - foldGraph(graph, new Set([key])).personIds.length,
    [graph],
  );

  return { drawing, folded, branchesOf: byPerson, hiddenBelow, setFolded };
}
