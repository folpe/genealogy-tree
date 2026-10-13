import type { DisplayedGraph } from '../../server/family/family.display';

// Plier une branche (plan phase 4, lot 5). Une branche part d'un couple (ses enfants
// communs, clé : l'union) ou d'un parent seul (ses enfants sans union dessinée, clé :
// la personne). Plier cache ces enfants, toute leur descendance, et ceux qui ne
// tenaient à l'arbre que par eux (un conjoint venu par la branche, un enfant élevé
// dans la branche). Un enfant élevé qui a ses propres parents ailleurs garde sa place.

const ownersOf = (drawn: DisplayedGraph) =>
  new Map(drawn.unions.map((u) => [u.id, u.partnerIds.filter((p) => typeof p === 'string')]));

/** Départs de branche : unions qui ont des enfants, parents d'enfants sans union dessinée. */
export function branchKeys(drawn: DisplayedGraph): Set<string> {
  const keys = new Set<string>();
  for (const edge of drawn.edges) {
    if (edge.kind === 'child' || edge.kind === 'parent') keys.add(edge.from);
  }
  return keys;
}

/** Branches qui partent de chaque personne : ses couples avec enfants, puis elle seule. */
export function branchesOf(drawn: DisplayedGraph): Map<string, string[]> {
  const keys = branchKeys(drawn);
  const result = new Map<string, string[]>();
  const add = (person: string, key: string) =>
    result.set(person, [...(result.get(person) ?? []), key]);
  for (const union of drawn.unions) {
    if (!keys.has(union.id)) continue;
    for (const partner of union.partnerIds) if (typeof partner === 'string') add(partner, union.id);
  }
  for (const id of drawn.personIds) if (keys.has(id)) add(id, id);
  return result;
}

export function foldGraph(drawn: DisplayedGraph, folded: ReadonlySet<string>): DisplayedGraph {
  if (folded.size === 0) return drawn;
  const owners = ownersOf(drawn);
  /** Enfants de chaque départ de branche (union ou parent seul). */
  const branch = new Map<string, string[]>();
  /** Tous les enfants d'une personne, pour descendre une branche cachée. */
  const children = new Map<string, string[]>();
  const links = new Map<string, Set<string>>();
  const push = (map: Map<string, string[]>, key: string, value: string) =>
    map.set(key, [...(map.get(key) ?? []), value]);
  const relate = (a: string, b: string) => {
    links.set(a, (links.get(a) ?? new Set()).add(b));
    links.set(b, (links.get(b) ?? new Set()).add(a));
  };
  for (const edge of drawn.edges) {
    if (edge.kind === 'child' || edge.kind === 'parent') push(branch, edge.from, edge.to);
    if (edge.kind === 'child') {
      for (const p of owners.get(edge.from) ?? []) {
        push(children, p, edge.to);
        relate(p, edge.to);
      }
    }
    if (edge.kind === 'parent') {
      push(children, edge.from, edge.to);
      relate(edge.from, edge.to);
    }
    if (edge.kind === 'raised') relate(edge.from, edge.to);
  }
  for (const partners of owners.values()) {
    const [a, b] = partners;
    if (a && b) relate(a, b);
  }

  // Les enfants des branches pliées, puis toute leur descendance.
  const hidden = new Set<string>();
  const pending = [...folded].flatMap((key) => branch.get(key) ?? []);
  for (let person = pending.pop(); person !== undefined; person = pending.pop()) {
    if (hidden.has(person)) continue;
    hidden.add(person);
    pending.push(...(children.get(person) ?? []));
  }
  // Puis, jusqu'à stabilité, ceux dont tous les liens partent avec la branche.
  for (let round = 0; round < drawn.personIds.length; round += 1) {
    const loose = drawn.personIds.filter((id) => {
      const around = links.get(id);
      return !hidden.has(id) && around && [...around].every((other) => hidden.has(other));
    });
    if (loose.length === 0) break;
    for (const id of loose) hidden.add(id);
  }

  const shown = (id: string) => !hidden.has(id);
  const unions = drawn.unions.filter((u) => (owners.get(u.id) ?? []).every(shown));
  const kept = new Set(unions.map((u) => u.id));
  const visible = (id: string) => kept.has(id) || (shown(id) && !owners.has(id));
  return {
    personIds: drawn.personIds.filter(shown),
    unions,
    edges: drawn.edges.filter((e) => visible(e.from) && visible(e.to)),
  };
}
