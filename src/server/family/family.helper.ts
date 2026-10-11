import type { FamilyGraph, ParentChild, ParentChildKind, Person, Union } from './family.types';

/** Filiations qui font un parent ; `a_eleve` (beau-parent) n'en fait jamais partie. */
export const FILIATION_KINDS: readonly ParentChildKind[] = ['biologique', 'adoptive', 'inconnue'];

export type FamilyIndex = {
  persons: Map<string, Person>;
  unions: Map<string, Union>;
  linksByChild: Map<string, ParentChild[]>;
  linksByParent: Map<string, ParentChild[]>;
  unionsByPerson: Map<string, Union[]>;
};

export type Relative = { id: string; kind: ParentChildKind };
export type Partner = { unionId: string; partnerId: string | null; ongoing: boolean };
export type Sibling = { id: string; half: boolean };

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/** Index d'adjacence construit une fois ; toutes les requêtes sont en O(degré). */
export function buildFamilyIndex(graph: FamilyGraph): FamilyIndex {
  const index: FamilyIndex = {
    persons: new Map(graph.persons.map((p) => [p.id, p])),
    unions: new Map(graph.unions.map((u) => [u.id, u])),
    linksByChild: new Map(),
    linksByParent: new Map(),
    unionsByPerson: new Map(),
  };
  for (const link of graph.parentChildren) {
    push(index.linksByChild, link.childId, link);
    push(index.linksByParent, link.parentId, link);
  }
  for (const union of graph.unions) {
    for (const partnerId of union.partnerIds) {
      if (partnerId !== null) push(index.unionsByPerson, partnerId, union);
    }
  }
  return index;
}

export const isOngoing = (union: Union) => union.end === undefined;

type KindFilter = { kinds?: readonly ParentChildKind[] };

export function parentsOf(
  index: FamilyIndex,
  childId: string,
  { kinds = FILIATION_KINDS }: KindFilter = {},
): Relative[] {
  return (index.linksByChild.get(childId) ?? [])
    .filter((l) => kinds.includes(l.kind))
    .map((l) => ({ id: l.parentId, kind: l.kind }));
}

export function childrenOf(
  index: FamilyIndex,
  parentId: string,
  { kinds = FILIATION_KINDS }: KindFilter = {},
): Relative[] {
  return (index.linksByParent.get(parentId) ?? [])
    .filter((l) => kinds.includes(l.kind))
    .map((l) => ({ id: l.childId, kind: l.kind }));
}

/** Beaux-parents qui ont élevé la personne (filiation `a_eleve`). */
export function raisedBy(index: FamilyIndex, childId: string): string[] {
  return parentsOf(index, childId, { kinds: ['a_eleve'] }).map((r) => r.id);
}

export function partnersOf(
  index: FamilyIndex,
  personId: string,
  { ongoingOnly = false }: { ongoingOnly?: boolean } = {},
): Partner[] {
  return (index.unionsByPerson.get(personId) ?? [])
    .filter((u) => !ongoingOnly || isOngoing(u))
    .map((u) => ({
      unionId: u.id,
      partnerId: u.partnerIds[0] === personId ? u.partnerIds[1] : u.partnerIds[0],
      ongoing: isOngoing(u),
    }));
}

/** Frères et sœurs, demi compris (au moins un parent commun), triés par identifiant. */
export function siblingsOf(index: FamilyIndex, personId: string): Sibling[] {
  const own = new Set(parentsOf(index, personId).map((p) => p.id));
  const candidates = new Set<string>();
  for (const parentId of own) {
    for (const child of childrenOf(index, parentId)) {
      if (child.id !== personId) candidates.add(child.id);
    }
  }
  return [...candidates].sort().map((id) => {
    const theirs = new Set(parentsOf(index, id).map((p) => p.id));
    const same = theirs.size === own.size && [...own].every((p) => theirs.has(p));
    return { id, half: !same };
  });
}

/** Parcours en largeur ; la génération retenue est la plus proche. */
function walk(start: string, next: (id: string) => Relative[]): Map<string, number> {
  const generations = new Map<string, number>();
  let frontier = [start];
  let generation = 0;
  while (frontier.length > 0) {
    generation += 1;
    const following: string[] = [];
    for (const id of frontier) {
      for (const relative of next(id)) {
        if (relative.id !== start && !generations.has(relative.id)) {
          generations.set(relative.id, generation);
          following.push(relative.id);
        }
      }
    }
    frontier = following;
  }
  return generations;
}

/** Ascendance sans limite : identifiant -> génération (1 = parents). */
export function ancestorsOf(index: FamilyIndex, personId: string): Map<string, number> {
  return walk(personId, (id) => parentsOf(index, id));
}

/** Descendance sans limite : identifiant -> génération (1 = enfants). */
export function descendantsOf(index: FamilyIndex, personId: string): Map<string, number> {
  return walk(personId, (id) => childrenOf(index, id));
}
