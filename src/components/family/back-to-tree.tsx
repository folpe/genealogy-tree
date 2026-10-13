// tdd-cover: e2e tests/e2e/tree.spec.ts
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { readTreeMemory } from './tree-memory.storage';

// « Retour à l'arbre » : la vue que l'on quittait (retenue pour l'onglet avec la
// position), pas la vue par défaut. Sans mémoire, l'arbre s'ouvre sur sa vue par défaut.

/** Adresse de l'arbre tel qu'on l'a quitté ; `/tree` avant l'hydratation ou sans mémoire. */
export function useTreeHref(): string {
  const [href, setHref] = useState('/tree');
  useEffect(() => {
    const view = readTreeMemory()?.view;
    if (view?.startsWith('/tree')) setHref(view);
  }, []);
  return href;
}

/**
 * Depuis une fiche : l'arbre revient centré sur sa bulle, cerclée, zoom et plis
 * gardés (`?focus=`), sans rouvrir la fiche : sur mobile, elle cacherait la lignée
 * qu'on vient chercher. La fiche se lit dans l'URL : le lien vaut aussi pendant le
 * chargement.
 */
export function BackToTree() {
  const href = useTreeHref();
  const personId = usePathname().match(/^\/people\/([^/]+)$/)?.[1];
  if (!personId) return <Link href={href}>Retour à l’arbre</Link>;
  const [path = '/tree', search = ''] = href.split('?');
  const query = new URLSearchParams(search);
  query.delete('fiche');
  query.set('focus', decodeURIComponent(personId));
  return <Link href={`${path}?${query.toString()}`}>Retour à l’arbre</Link>;
}
