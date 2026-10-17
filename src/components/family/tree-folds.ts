// tdd-cover: e2e tests/e2e/tree-fold.spec.ts
'use client';

import { useEffect, useRef } from 'react';

// Les réglages (rangée des vues) demandent au canevas de tout replier ou de tout
// afficher. Un événement de fenêtre, comme la recherche (`open-fiche.ts`) : les plis
// vivent dans le canevas, sans état partagé avec les réglages.

const TREE_FOLDS = 'racines:tree-folds';

/** « Lignées seules » : les plis de départ ; « Tout afficher » : aucun pli. */
export type FoldsRequest = 'lineages' | 'all';

const isRequest = (value: unknown): value is FoldsRequest =>
  value === 'lineages' || value === 'all';

export function requestTreeFolds(request: FoldsRequest) {
  window.dispatchEvent(new CustomEvent(TREE_FOLDS, { detail: request }));
}

export function useTreeFoldsRequests(apply: (request: FoldsRequest) => void) {
  const latest = useRef(apply);
  useEffect(() => {
    latest.current = apply;
  });
  useEffect(() => {
    const onRequest = (event: Event) => {
      if (event instanceof CustomEvent && isRequest(event.detail)) latest.current(event.detail);
    };
    window.addEventListener(TREE_FOLDS, onRequest);
    return () => window.removeEventListener(TREE_FOLDS, onRequest);
  }, []);
}
