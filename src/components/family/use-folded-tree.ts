// tdd-cover: e2e tests/e2e/tree-fold.spec.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { branchesOf, branchKeys, foldGraph } from '@/lib/tree/tree.fold';
import { defaultFolds, revealing } from '@/lib/tree/tree.lineage';
import type { DisplayedGraph } from '@/server/family/family.display';
import { drawFolded, type TreeDrawing } from './tree-drawing';
import { createLayoutClient, type LayoutClient } from './tree-layout.client';

// Plis du canevas : lignées dépliées et collatéraux repliés au départ (retour de Folpe,
// 2026-10-17), puis chaque fratrie, branche ou famille se replie et se redéplie.
// L'arbre est dessiné serré sur ce qui est affiché : chaque pli redemande un placement
// au worker ELK, et la bulle touchée reste à sa place à l'écran pendant que le reste
// glisse (`use-relayout.ts`). Remplace la règle du 2026-10-13, où plier ne déplaçait
// rien (journal des décisions, 2026-10-17 « Lignées seules, arbre resserré »). Les
// dessins déjà calculés restent en cache ; seule la dernière demande compte.

export type FoldedTree = {
  drawing: TreeDrawing;
  /** Bulle du dernier pli : la caméra la garde en place. */
  anchorId: string | undefined;
  /**
   * Plis demandés (tree.fold.ts) : les poignées et le menu suivent la demande, le dessin
   * suit au calcul.
   */
  folded: ReadonlySet<string>;
  /** Plis de départ : « Lignées seules ». */
  defaults: readonly string[];
  /** Branches qui partent de chaque personne. */
  branchesOf: ReadonlyMap<string, string[]>;
  /** Personnes cachées sous une branche pliée, pour son libellé. */
  hiddenBelow: (key: string) => number;
  pending: boolean;
  failed: boolean;
  /** Plie (`fold`) ou déplie des clés ; `anchorId` reste en place à l'écran. */
  setFolded: (keys: string[], fold: boolean, anchorId: string | undefined) => void;
  /** Remplace tous les plis (« Lignées seules », « Tout afficher », mémoire). */
  replaceFolded: (keys: readonly string[], anchorId: string | undefined) => void;
  /** Lève les plis qui cachent ces personnes (fiche, recherche, « Notre lien »). */
  reveal: (persons: string[], anchorId: string | undefined) => void;
};

const keyOf = (folded: Iterable<string>) => [...folded].sort().join(' ');

type State = {
  initial: TreeDrawing;
  drawing: TreeDrawing;
  /** Dernière demande, pour l'affichage ; `requested` en est le miroir synchrone. */
  asked: ReadonlySet<string>;
  anchorId: string | undefined;
  pending: boolean;
  failed: boolean;
};

const fresh = (initial: TreeDrawing): State => ({
  initial,
  drawing: initial,
  asked: new Set(initial.folded),
  anchorId: undefined,
  pending: false,
  failed: false,
});

export function useFoldedTree(
  initial: TreeDrawing,
  graph: DisplayedGraph,
  focusId: string | undefined,
): FoldedTree {
  const [state, setState] = useState<State>(() => fresh(initial));
  const cache = useRef(new Map<string, TreeDrawing>());
  const latest = useRef(0);
  const client = useRef<LayoutClient>(undefined);
  /** Base de la demande suivante : un pli lancé pendant un calcul s'ajoute au précédent. */
  const requested = useRef<ReadonlySet<string>>(new Set(initial.folded));
  /** Dessin à l'écran, pour repartir de lui après un échec. */
  const displayed = useRef(state.drawing);
  displayed.current = state.drawing;
  const keys = useMemo(() => branchKeys(graph), [graph]);
  const byPerson = useMemo(() => branchesOf(graph), [graph]);
  const defaults = useMemo(() => (focusId ? defaultFolds(graph, focusId) : []), [graph, focusId]);
  /** Une clé qui vaut encore dans ce graphe (une personne a pu partir). */
  const valid = useCallback(
    (key: string) => {
      const person = key.replace(/^(hide|origin):/, '');
      return keys.has(key) || (person !== key && graph.personIds.includes(person));
    },
    [keys, graph],
  );

  const request = useCallback(
    (next: ReadonlySet<string>, anchorId: string | undefined, force = false) => {
      if (!force && keyOf(next) === keyOf(requested.current)) return;
      requested.current = next;
      const ticket = ++latest.current;
      const cached = cache.current.get(keyOf(next));
      if (cached) {
        setState((s) => ({ ...s, drawing: cached, asked: next, anchorId, pending: false }));
        return;
      }
      setState((s) => ({ ...s, asked: next, pending: true, failed: false }));
      client.current ??= createLayoutClient();
      const layoutClient = client.current;
      drawFolded(graph, [...next], focusId, initial.people, (shown, options) =>
        layoutClient.layout(shown, options),
      ).then(
        (drawing) => {
          cache.current.set(keyOf(next), drawing);
          if (ticket !== latest.current) return;
          setState((s) => ({ ...s, drawing, anchorId, pending: false }));
        },
        () => {
          if (ticket !== latest.current) return;
          // La demande a échoué : la suivante repart de ce qui est affiché.
          requested.current = new Set(displayed.current.folded);
          setState((s) => ({
            ...s,
            asked: new Set(s.drawing.folded),
            pending: false,
            failed: true,
          }));
        },
      );
    },
    [graph, focusId, initial.people],
  );

  // Nouveau rendu serveur (données changées) : ses plis de départ, sauf si l'on avait
  // déplié ou replié autre chose, qu'on garde (une fiche ajoutée chez un oncle déplié).
  const shown = useRef(initial);
  useEffect(() => {
    if (shown.current === initial) return;
    const before = shown.current;
    shown.current = initial;
    cache.current = new Map([[keyOf(initial.folded), initial]]);
    const kept = new Set([...requested.current].filter(valid));
    if (
      keyOf(requested.current) === keyOf(before.folded) ||
      keyOf(kept) === keyOf(initial.folded)
    ) {
      requested.current = new Set(initial.folded);
      latest.current += 1;
      setState(fresh(initial));
      return;
    }
    setState((s) => ({ ...s, initial }));
    request(kept, undefined, true);
  }, [initial, valid, request]);
  useEffect(() => {
    cache.current.set(keyOf(initial.folded), initial);
  }, [initial]);
  useEffect(() => () => client.current?.dispose(), []);

  const setFolded = useCallback(
    (changed: string[], fold: boolean, anchorId: string | undefined) => {
      const next = new Set(requested.current);
      for (const key of changed) {
        if (!valid(key)) continue;
        if (fold) next.add(key);
        else next.delete(key);
      }
      request(next, anchorId);
    },
    [valid, request],
  );
  const replaceFolded = useCallback(
    (all: readonly string[], anchorId: string | undefined) =>
      request(new Set(all.filter(valid)), anchorId),
    [valid, request],
  );

  const reveal = useCallback(
    (persons: string[], anchorId: string | undefined) => {
      const lifted = new Set(revealing(graph, requested.current, focusId, persons));
      if (lifted.size === 0) return;
      request(new Set([...requested.current].filter((k) => !lifted.has(k))), anchorId);
    },
    [graph, focusId, request],
  );

  const hiddenBelow = useCallback(
    (key: string) => graph.personIds.length - foldGraph(graph, new Set([key])).personIds.length,
    [graph],
  );

  return {
    drawing: state.drawing,
    anchorId: state.anchorId,
    folded: state.asked,
    defaults,
    branchesOf: byPerson,
    hiddenBelow,
    pending: state.pending,
    failed: state.failed,
    setFolded,
    replaceFolded,
    reveal,
  };
}
