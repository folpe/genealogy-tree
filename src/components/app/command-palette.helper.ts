import type { RedactedPerson } from '@/server/access/access.redact';
import type { SearchDirectory } from '@/server/family/family.service';
import { buildSearchIndex, search } from '@/server/family/search.helper';
import { lifeYears, personLabel } from '../family/person.helper';

// Résultats du ⌘K (DESIGN.md, `CommandPalette`) : bulle, nom, « née X » et années, lien
// de parenté en accent. La recherche elle-même est celle du domaine (phase 2).

const RECENT_MAX = 5;
const RESULTS_MAX = 8;

export type PaletteItem = {
  id: string;
  person: RedactedPerson;
  name: string;
  /** « née Roux, 1934 - 2019 » ; ce que la visibilité laisse voir. */
  detail: string | undefined;
  /** « ta grand-mère », pour une fiche reliée au lecteur. */
  relation: string | undefined;
};

function toItem(directory: SearchDirectory, person: RedactedPerson): PaletteItem {
  const born =
    person.level !== 'minor' && person.birthName && person.birthName !== person.lastName
      ? `${person.gender === 'femme' ? 'née' : 'né'} ${person.birthName}`
      : undefined;
  const detail = [born, lifeYears(person)].filter(Boolean).join(', ');
  return {
    id: person.id,
    person,
    name: personLabel(person),
    detail: detail || undefined,
    relation: directory.relations[person.id],
  };
}

export function paletteItems(directory: SearchDirectory, query: string): PaletteItem[] {
  if (query.trim() === '') return [];
  const index = buildSearchIndex(directory.persons, {
    proximity: new Map(Object.entries(directory.proximity)),
  });
  const byId = new Map(directory.persons.map((p) => [p.id, p]));
  return search(index, query, { limit: RESULTS_MAX }).flatMap(({ id }) => {
    const person = byId.get(id);
    return person ? [toItem(directory, person)] : [];
  });
}

export function recentItems(directory: SearchDirectory, ids: string[]): PaletteItem[] {
  const byId = new Map(directory.persons.map((p) => [p.id, p]));
  return ids.flatMap((id) => {
    const person = byId.get(id);
    return person ? [toItem(directory, person)] : [];
  });
}

export function pushRecent(recent: string[], id: string): string[] {
  return [id, ...recent.filter((r) => r !== id)].slice(0, RECENT_MAX);
}
