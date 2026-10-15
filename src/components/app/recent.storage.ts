// Fiches récemment consultées dans la recherche : une commodité de l'appareil, jamais
// une donnée à garder. Stockage refusé ou illisible : la liste est vide.

const KEY = 'racines:recent';
/** Clé d'avant le renommage (2026-10-15) : reprise une fois, puis effacée. */
const LEGACY_KEY = 'ances-tree:recent';

function adoptLegacy(storage: Storage): string | undefined {
  const legacy = storage.getItem(LEGACY_KEY) ?? undefined;
  if (legacy !== undefined) {
    storage.setItem(KEY, legacy);
    storage.removeItem(LEGACY_KEY);
  }
  return legacy;
}

export function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY) ?? adoptLegacy(window.localStorage) ?? '[]';
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function writeRecent(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Stockage refusé : on perd seulement la liste des récents.
  }
}
