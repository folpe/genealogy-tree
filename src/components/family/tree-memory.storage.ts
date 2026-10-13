// tdd-cover: e2e tests/e2e/tree.spec.ts
import { parseMemory, type TreeMemory } from '@/lib/tree/tree.memory';

// Mémoire de l'arbre pour l'onglet (sessionStorage) : une commodité, jamais une
// donnée à garder. Navigation privée ou stockage bloqué : l'arbre s'ouvre au départ.

const KEY = 'ances-tree:tree';

export function readTreeMemory(): TreeMemory | undefined {
  try {
    return parseMemory(window.sessionStorage.getItem(KEY) ?? undefined);
  } catch {
    return undefined;
  }
}

export function writeTreeMemory(memory: TreeMemory): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Stockage plein ou refusé : on perd seulement le retour à la même place.
  }
}
