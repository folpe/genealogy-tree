import type { RedactedPerson } from '@/server/access/access.redact';
import type { ParentChild, ParentChildKind } from '@/server/family/family.types';
import { compareFuzzyDates } from '@/server/family/fuzzy-date.helper';

// Ancêtres en éventail (plan phase 7, maquette 03) : pour une personne, ses parents,
// grands-parents, etc., rangés comme une table d'Ahnentafel. Génération g (1 = les
// parents) : 2^g cases, le père en case paire, la mère en case impaire, la moitié
// gauche du côté du père. Lu dans l'arbre déjà filtré par la policy : une fiche
// restreinte compte comme connue mais ne livre ni date ni lieu.

export const FAN_GENERATIONS = { min: 1, max: 6, initial: 4 } as const;

export type FanSlot = {
  /** 1 = les parents. */
  generation: number;
  /** Rang dans la génération, de gauche à droite. */
  index: number;
  role: 'father' | 'mother';
  side: 'paternal' | 'maternal';
  person: RedactedPerson | undefined;
  /** Celui ou celle dont la case est le parent ; absent quand il est lui-même inconnu. */
  child: RedactedPerson | undefined;
};

type FanOrigin = { place: string; count: number };

export type Fan = {
  root: RedactedPerson;
  /** `generations[g - 1]` : les 2^g cases de la génération g. */
  generations: FanSlot[][];
  /** Cases remplies (un ancêtre présent deux fois compte deux fois, comme ses cases). */
  known: number;
  total: number;
  /** Ancêtre à la naissance la plus ancienne qu'on puisse lire. */
  oldest: RedactedPerson | undefined;
  /** Lieux de naissance des ancêtres, du plus fréquent au plus rare. */
  origins: FanOrigin[];
};

type FanSource = { persons: RedactedPerson[]; parentChildren: ParentChild[] };

/** Ordre de préférence : `a_eleve` (beau-parent) n'est jamais une ascendance (spec 8.1). */
const KIND_RANK: Partial<Record<ParentChildKind, number>> = {
  biologique: 0,
  inconnue: 1,
  adoptive: 2,
};

/** Les deux parents d'une personne, en [père, mère] ; une place vide reste `undefined`. */
function parentPair(
  persons: Map<string, RedactedPerson>,
  links: ParentChild[],
): [RedactedPerson | undefined, RedactedPerson | undefined] {
  const parents = links
    .flatMap((l) => {
      const rank = KIND_RANK[l.kind];
      const person = persons.get(l.parentId);
      return rank === undefined || !person ? [] : [{ rank, person }];
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 2)
    .map((p) => p.person);
  let father = parents.find((p) => p.gender === 'homme');
  let mother = parents.find((p) => p.gender === 'femme' && p !== father);
  for (const parent of parents) {
    if (parent === father || parent === mother) continue;
    if (!father) father = parent;
    else if (!mother) mother = parent;
  }
  return [father, mother];
}

const birthOf = (person: RedactedPerson) =>
  person.level === 'full' || person.level === 'family' ? person.birth : undefined;

export function buildFan(source: FanSource, rootId: string, generations: number): Fan | undefined {
  const persons = new Map(source.persons.map((p) => [p.id, p]));
  const root = persons.get(rootId);
  if (!root) return undefined;
  const linksByChild = new Map<string, ParentChild[]>();
  for (const link of source.parentChildren) {
    linksByChild.set(link.childId, [...(linksByChild.get(link.childId) ?? []), link]);
  }

  const rings: FanSlot[][] = [];
  let children: (RedactedPerson | undefined)[] = [root];
  for (let generation = 1; generation <= generations; generation += 1) {
    const half = 2 ** (generation - 1);
    const ring = children.flatMap((child, c): FanSlot[] => {
      const pair = child ? parentPair(persons, linksByChild.get(child.id) ?? []) : [];
      return (['father', 'mother'] as const).map((role, r) => ({
        generation,
        index: c * 2 + r,
        role,
        side: c * 2 + r < half ? 'paternal' : 'maternal',
        person: pair[r],
        child,
      }));
    });
    rings.push(ring);
    children = ring.map((slot) => slot.person);
  }

  const slots = rings.flat();
  const ancestors = [...new Set(slots.flatMap((s) => (s.person ? [s.person] : [])))];
  const dated = ancestors.flatMap((p) => {
    const date = birthOf(p)?.date;
    return date ? [{ person: p, date }] : [];
  });
  const oldest = dated.reduce<(typeof dated)[number] | undefined>(
    (best, next) => (!best || compareFuzzyDates(next.date, best.date) < 0 ? next : best),
    undefined,
  );
  const counts = new Map<string, number>();
  for (const person of ancestors) {
    const place = birthOf(person)?.place;
    if (place) counts.set(place, (counts.get(place) ?? 0) + 1);
  }
  const origins = [...counts]
    .map(([place, count]) => ({ place, count }))
    .sort((a, b) => b.count - a.count || a.place.localeCompare(b.place, 'fr'));

  return {
    root,
    generations: rings,
    known: slots.filter((s) => s.person).length,
    total: slots.length,
    oldest: oldest?.person,
    origins,
  };
}
