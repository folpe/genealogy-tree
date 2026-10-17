// Plis de l'arbre, par appareil (revue de la PR #159) : `localStorage`, une clé par vue
// (son URL). Une commodité, jamais une donnée à garder : format versionné, une mémoire
// d'une autre version ou abîmée est ignorée et l'arbre repart des plis de départ ;
// stockage bloqué ou plein, rien ne lève.

const PREFIX = 'racines:tree-folds:';
const VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value); // allow-null: typeof null vaut 'object'

/** Les plis retenus pour cette vue ; `undefined` sans mémoire valable (pas « tout afficher »). */
export function readFolds(view: string): string[] | undefined {
  let raw: string | null; // allow-null: contrat de Storage.getItem
  try {
    raw = window.localStorage.getItem(PREFIX + view);
  } catch {
    return undefined;
  }
  if (!raw) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isRecord(value) || value['v'] !== VERSION) return undefined;
  const folded = value['folded'];
  if (!Array.isArray(folded)) return undefined;
  const keys = folded.filter((key): key is string => typeof key === 'string');
  return keys.length === folded.length ? keys : undefined;
}

export function writeFolds(view: string, folded: string[]): void {
  try {
    window.localStorage.setItem(PREFIX + view, JSON.stringify({ v: VERSION, folded }));
  } catch {
    // Stockage plein ou refusé : on perd seulement les plis au prochain affichage.
  }
}
