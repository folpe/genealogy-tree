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
  /** Branche pliée dans la dernière demande, même pas encore affichée (clavier). */
  isRequested: (key: string) => boolean;
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
  /**
   * Dernier ensemble demandé, base de la demande suivante : un pliage lancé pendant
   * un calcul s'ajoute au précédent au lieu de repartir de ce qui est affiché.
   */
  const requested = useRef<ReadonlySet<string>>(new Set());

  // Nouveau rendu serveur (données changées) : on repart de son dessin, tout déplié,
  // et une réponse encore attendue pour l'ancien graphe ne s'appliquera pas.
  if (state.initial !== initial) {
    latest.current += 1;
    requested.current = new Set();
    setState({
      initial,
      drawing: initial,
      folded: new Set(),
      anchorId: undefined,
      pending: false,
      failed: false,
    });
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
      const base = requested.current;
      const next = new Set(base);
      for (const key of changed) {
        if (!keys.has(key)) continue;
        if (fold) next.add(key);
        else next.delete(key);
      }
      if (keyOf(next) === keyOf(base)) return;
      requested.current = next;
      const request = ++latest.current;
      const cached = cache.current.get(keyOf(next));
      if (cached) {
        setState((s) => ({
          ...s,
          drawing: cached,
          folded: next,
          anchorId: id,
          pending: false,
          failed: false,
        }));
        return;
      }
      setState((s) => ({ ...s, pending: true, failed: false }));
      const shown = foldGraph(graph, next);
      client.current ??= createLayoutClient();
      client.current.layout(shown).then(
        (layout) => {
          if (request !== latest.current) return;
          const drawing = assembleDrawing(shown, layout, people, keys);
          cache.current.set(keyOf(next), drawing);
          setState((s) => ({ ...s, drawing, folded: next, anchorId: id, pending: false }));
        },
        () => {
          if (request !== latest.current) return;
          // La demande a échoué : la suivante repart de ce qui est affiché.
          requested.current = folded;
          setState((s) => ({ ...s, pending: false, failed: true }));
        },
      );
    },
    [folded, keys, graph, people],
  );

  const isRequested = useCallback((key: string) => requested.current.has(key), []);

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
    isRequested,
    setFolded,
  };
}
