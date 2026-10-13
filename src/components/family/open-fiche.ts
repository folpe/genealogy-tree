'use client';

import { useEffect, useRef } from 'react';

// La recherche (en-tête) demande à l'arbre (page) d'ouvrir une fiche, comme un tap sur
// sa bulle. Un événement de fenêtre suffit : pas d'état partagé entre la coque et la
// page, et sans arbre à l'écran personne ne répond, la recherche navigue alors.

const OPEN_FICHE = 'ances-tree:open-fiche';

type Request = { id: string; handled: boolean };

function isRequest(value: unknown): value is Request {
  return (
    typeof value === 'object' &&
    value !== null && // allow-null: typeof null vaut « object »
    'id' in value &&
    typeof value.id === 'string' &&
    'handled' in value
  );
}

/** Rend `true` si l'arbre à l'écran a ouvert la fiche. */
export function requestOpenFiche(id: string): boolean {
  const detail: Request = { id, handled: false };
  window.dispatchEvent(new CustomEvent(OPEN_FICHE, { detail }));
  return detail.handled;
}

/** `open` rend `true` quand il a ouvert la fiche (personne dessinée). */
export function useOpenFicheRequests(open: (id: string) => boolean) {
  const latest = useRef(open);
  useEffect(() => {
    latest.current = open;
  });
  useEffect(() => {
    const onRequest = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isRequest(event.detail)) return;
      if (latest.current(event.detail.id)) event.detail.handled = true;
    };
    window.addEventListener(OPEN_FICHE, onRequest);
    return () => window.removeEventListener(OPEN_FICHE, onRequest);
  }, []);
}
