// tdd-cover: e2e tests/e2e/tree.spec.ts
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readTreeMemory } from './tree-memory.storage';

// « Retour à l'arbre » : la vue que l'on quittait (retenue pour l'onglet avec la
// position), pas la vue par défaut. Sans mémoire, l'arbre s'ouvre sur sa vue par défaut.

export function BackToTree() {
  const [href, setHref] = useState('/tree');
  useEffect(() => {
    const view = readTreeMemory()?.view;
    if (view?.startsWith('/tree')) setHref(view);
  }, []);
  return <Link href={href}>Retour à l’arbre</Link>;
}
