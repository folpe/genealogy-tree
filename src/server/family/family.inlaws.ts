import {
  ancestorsOf,
  buildFamilyIndex,
  childrenOf,
  descendantsOf,
  type FamilyIndex,
  parentsOf,
  partnersOf,
} from './family.helper';
import type { FamilyGraph } from './family.types';

// Familles par zones (choix de Folpe, 2026-10-16) : dans Toute la famille, la famille
// d'origine d'un conjoint venu d'ailleurs se replie derrière lui (« + sa famille »).
// « Les nôtres » : la parenté de sang de la personne au centre (ses ascendants et tous
// leurs descendants) et leurs conjoints, toujours visibles. La famille d'un conjoint :
// ses parents et tout ce qui s'y rattache, sans repasser par lui ni par les nôtres.

const partnerIds = (index: FamilyIndex, id: string) =>
  partnersOf(index, id).flatMap((p) => (typeof p.partnerId === 'string' ? [p.partnerId] : []));

/** Parenté de sang : les ascendants de la personne au centre et tous leurs descendants. */
function bloodOf(index: FamilyIndex, centerId: string): Set<string> {
  const ancestors = [centerId, ...ancestorsOf(index, centerId).keys()];
  return new Set(ancestors.flatMap((id) => [id, ...descendantsOf(index, id).keys()]));
}

/** Pour chaque conjoint venu avec sa famille : les personnes de cette famille. */
export function inLawFamilies(graph: FamilyGraph, centerId: string): Map<string, Set<string>> {
  const index = buildFamilyIndex(graph);
  if (!index.persons.has(centerId)) return new Map();
  const blood = bloodOf(index, centerId);
  const spouses = new Set(
    [...blood].flatMap((id) => partnerIds(index, id)).filter((id) => !blood.has(id)),
  );
  const ours = new Set([...blood, ...spouses]);

  const families = new Map<string, Set<string>>();
  for (const spouse of spouses) {
    const family = new Set<string>();
    const pending = parentsOf(index, spouse)
      .map((p) => p.id)
      .filter((id) => !ours.has(id));
    for (let person = pending.pop(); person !== undefined; person = pending.pop()) {
      if (family.has(person)) continue;
      family.add(person);
      const around = [
        ...parentsOf(index, person).map((p) => p.id),
        ...childrenOf(index, person).map((c) => c.id),
        ...partnerIds(index, person),
      ];
      pending.push(...around.filter((id) => !ours.has(id) && !family.has(id)));
    }
    if (family.size > 0) families.set(spouse, family);
  }
  return families;
}

/** Les conjoints dont la famille contient cette personne : à ouvrir pour la montrer. */
export function familiesRevealing(
  families: ReadonlyMap<string, ReadonlySet<string>>,
  personId: string | undefined,
): string[] {
  if (!personId) return [];
  return [...families].flatMap(([spouse, family]) => (family.has(personId) ? [spouse] : []));
}

/**
 * Le graphe sans les familles de conjoints repliées. `opened` : les conjoints dont on a
 * déplié la famille ; une personne partagée par deux familles reste si l'une est ouverte.
 */
export function withoutInLawFamilies(
  graph: FamilyGraph,
  families: ReadonlyMap<string, ReadonlySet<string>>,
  opened: readonly string[],
): FamilyGraph {
  const shown = new Set(opened.flatMap((id) => [...(families.get(id) ?? [])]));
  const hidden = new Set(
    [...families.values()].flatMap((family) => [...family]).filter((id) => !shown.has(id)),
  );
  if (hidden.size === 0) return graph;
  return {
    persons: graph.persons.filter((p) => !hidden.has(p.id)),
    unions: graph.unions.filter((u) => u.partnerIds.every((id) => !id || !hidden.has(id))),
    parentChildren: graph.parentChildren.filter(
      (l) => !hidden.has(l.parentId) && !hidden.has(l.childId),
    ),
  };
}
