// tdd-cover: e2e tests/e2e/tree.spec.ts
import { parseMemory, type TreeMemory } from '@/lib/tree/tree.memory';

// Mémoire de l'arbre pour l'onglet (sessionStorage) : une commodité, jamais une
// donnée à garder. Navigation privée ou stockage bloqué : l'arbre s'ouvre au départ.

const KEY = 'ances-tree:tree';

/**
 * Passé ce délai depuis le chargement, l'arbre masqué se montre seul (repli de
 * `globals.css`, même valeur) : une entrée plus tardive le ferait disparaître à nouveau.
 */
export const TREE_ENTRY_FALLBACK_MS = 2500;

/** Posé sur `<html>` avant le premier affichage : l'onglet n'a encore jamais vu l'arbre. */
export const TREE_ENTRY_ATTRIBUTE = 'data-tree-entry';

/**
 * Lu avant le premier affichage (script en ligne, sous nonce) : sans mémoire dans
 * l'onglet, l'arbre rendu au serveur attend son entrée au lieu d'apparaître, de
 * s'effacer, puis de repousser. Texte fixe, sans donnée de la page.
 */
export const TREE_ENTRY_SCRIPT = `try{if(!sessionStorage.getItem(${JSON.stringify(KEY)}))document.documentElement.setAttribute(${JSON.stringify(TREE_ENTRY_ATTRIBUTE)},'')}catch(e){}`;

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
