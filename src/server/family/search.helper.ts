import type { RedactedPerson } from '../access/access.redact';

// Recherche du ⌘K. L'index est construit à partir des fiches déjà projetées selon
// la visibilité du membre : un champ masqué n'est jamais indexé.

/** Mots ignorés dans une requête. */
const STOP_WORDS = new Set(['de', 'du', 'la', 'le']);
/** « née Roux » : les mots qui suivent portent sur le nom de naissance. */
const BIRTH_MARKERS = new Set(['ne', 'nee']);

export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-'’.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type Entry = {
  id: string;
  label: string;
  words: string[];
  birthWords: string[];
  proximity: number;
};

export type SearchIndex = Entry[];
export type SearchResult = { id: string; score: number };

function searchableNames(person: RedactedPerson): string[] {
  if (person.level === 'minor') return [person.firstName];
  return [person.firstName, person.lastName, person.birthName ?? ''].filter(Boolean);
}

export function buildSearchIndex(
  persons: RedactedPerson[],
  { proximity = new Map<string, number>() }: { proximity?: Map<string, number> } = {},
): SearchIndex {
  return persons.map((person) => {
    const names = searchableNames(person);
    return {
      id: person.id,
      label: normalizeForSearch(names.join(' ')),
      words: normalizeForSearch(names.join(' ')).split(' '),
      birthWords:
        person.level === 'minor' || !person.birthName
          ? []
          : normalizeForSearch(person.birthName).split(' '),
      proximity: proximity.get(person.id) ?? Number.POSITIVE_INFINITY,
    };
  });
}

/** 0 : mot identique ; 1 : début de mot ; 2 : contenu dans un mot ; `null` : absent. */
function tokenScore(token: string, words: string[]): number | null {
  if (words.includes(token)) return 0;
  if (words.some((w) => w.startsWith(token))) return 1;
  if (words.some((w) => w.includes(token))) return 2;
  return null;
}

export function search(
  index: SearchIndex,
  query: string,
  { limit = 8 }: { limit?: number } = {},
): SearchResult[] {
  const all = normalizeForSearch(query)
    .split(' ')
    .filter((t) => t && !STOP_WORDS.has(t));
  const marker = all.findIndex((t) => BIRTH_MARKERS.has(t));
  const tokens = all
    .filter((t) => !BIRTH_MARKERS.has(t))
    .map((t, i) => ({ t, birth: marker >= 0 && i >= marker }));
  if (tokens.length === 0) return [];

  const matches: (SearchResult & { entry: Entry })[] = [];
  for (const entry of index) {
    let score = 0;
    for (const { t: token, birth } of tokens) {
      const s = tokenScore(token, birth ? entry.birthWords : entry.words);
      if (s === null) {
        score = -1;
        break;
      }
      score = Math.max(score, s);
    }
    if (score >= 0) matches.push({ id: entry.id, score, entry });
  }
  return matches
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.entry.proximity - b.entry.proximity ||
        a.entry.label.localeCompare(b.entry.label),
    )
    .slice(0, limit)
    .map(({ id, score }) => ({ id, score }));
}
