// tdd-cover: e2e src/components/family/family-tree.test.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { branchesOf, branchKeys, foldGraph } from '@/lib/tree/tree.fold';
import type { DisplayedGraph } from '@/server/family/family.display';
import { assembleDrawing, peopleOf, type TreeDrawing } from './tree-drawing';
import { createLayoutClient, type LayoutClient } from './tree-layout.client';

// Branches pliées du canevas. Le premier dessin vient du serveur ; chaque pliage
// demande un nouveau placement au worker, gardé en cache par ensemble de branches
// pliées. Seule la dernière demande compte : une réponse dépassée est ignorée.

export type FoldedTree = {
  drawing: TreeDrawing;
  /** Bulle de la dernière branche pliée ou dépliée : la caméra la garde en place. */
  anchorId: string | undefined;
  /** Branches pliées (clés : union d'un couple, ou parent seul). */
  folded: ReadonlySet<string>;
  /** Branches qui partent de chaque personne. */
  branchesOf: ReadonlyMap<string, string[]>;
  /** Personnes cachées sous une branche pliée, pour son libellé. */
  hiddenBelow: (key: string) => number;
  pending: boolean;
  failed: boolean;
  /** Plie (`fold`) ou déplie des branches ; `anchorId` reste en place à l'écran. */
  setFolded: (keys: string[], fold: boolean, anchorId: string) => void;
};

const keyOf = (folded: ReadonlySet<string>) => [...folded].sort().join(' ');

export function useFoldedTree(initial: TreeDrawing, graph: DisplayedGraph): FoldedTree {
  const [state, setState] = useState<{
    initial: TreeDrawing;
    drawing: TreeDrawing;
    folded: ReadonlySet<string>;
    anchorId: string | undefined;
    pending: boolean;
    failed: boolean;
  }>({
    initial,
    drawing: initial,
    folded: new Set(),
    anchorId: undefined,
    pending: false,
    failed: false,
  });
  const cache = useRef(new Map<string, TreeDrawing>());
  const latest = useRef(0);
  const client = useRef<LayoutClient>(undefined);

  // Nouveau rendu serveur (données changées) : on repart de son dessin, tout déplié.
  if (state.initial !== initial) {
    setState({ ...state, initial, drawing: initial, folded: new Set(), anchorId: undefined });
  }
  useEffect(() => {
    cache.current = new Map([['', initial]]);
  }, [initial]);
  useEffect(() => () => client.current?.dispose(), []);

  const people = useMemo(() => peopleOf(initial.nodes), [initial.nodes]);
  const keys = useMemo(() => branchKeys(graph), [graph]);
  const byPerson = useMemo(() => branchesOf(graph), [graph]);
  const folded = state.folded;

  const setFolded = useCallback(
    (changed: string[], fold: boolean, id: string) => {
      const next = new Set(folded);
      for (const key of changed) {
        if (!keys.has(key)) continue;
        if (fold) next.add(key);
        else next.delete(key);
      }
      if (keyOf(next) === keyOf(folded)) return;
      const request = ++latest.current;
      const cached = cache.current.get(keyOf(next));
      if (cached) {
        setState((s) => ({ ...s, drawing: cached, folded: next, anchorId: id, failed: false }));
        return;
      }
      setState((s) => ({ ...s, pending: true, failed: false }));
      const shown = foldGraph(graph, next);
      client.current ??= createLayoutClient();
      client.current.layout(shown).then(
        (layout) => {
          const drawing = assembleDrawing(shown, layout, people, keys);
          cache.current.set(keyOf(next), drawing);
          if (request !== latest.current) return;
          setState((s) => ({ ...s, drawing, folded: next, anchorId: id, pending: false }));
        },
        () => {
          if (request !== latest.current) return;
          setState((s) => ({ ...s, pending: false, failed: true }));
        },
      );
    },
    [folded, keys, graph, people],
  );

  const hiddenBelow = useCallback(
    (key: string) => graph.personIds.length - foldGraph(graph, new Set([key])).personIds.length,
    [graph],
  );

  return {
    drawing: state.drawing,
    anchorId: state.anchorId,
    folded,
    branchesOf: byPerson,
    hiddenBelow,
    pending: state.pending,
    failed: state.failed,
    setFolded,
  };
}
