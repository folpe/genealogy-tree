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

/** Masque une personne avec son conjoint et ses descendants (un collatéral). */
export const hideKey = (personId: string) => `${HIDE}${personId}`;
/** Replie la famille d'origine d'une personne : ses parents et ce qui ne tient qu'à eux. */
export const originKey = (personId: string) => `${ORIGIN}${personId}`;
const HIDE = 'hide:';
const ORIGIN = 'origin:';

type Links = {
  /** Enfants de chaque départ de branche (union ou parent seul). */
  branch: Map<string, string[]>;
  /** Tous les enfants d'une personne, pour descendre une branche cachée. */
  children: Map<string, string[]>;
  /** Voisins de chaque personne : parents, enfants, partenaires, « a élevé ». */
  around: Map<string, Set<string>>;
};

/** Les liens du graphe, sans la filiation des personnes dont la famille d'origine est repliée. */
function linksOf(drawn: DisplayedGraph, cut: ReadonlySet<string>): Links {
  const owners = ownersOf(drawn);
  const links: Links = { branch: new Map(), children: new Map(), around: new Map() };
  const push = (map: Map<string, string[]>, key: string, value: string) =>
    map.set(key, [...(map.get(key) ?? []), value]);
  const relate = (a: string, b: string) => {
    links.around.set(a, (links.around.get(a) ?? new Set()).add(b));
    links.around.set(b, (links.around.get(b) ?? new Set()).add(a));
  };
  for (const edge of drawn.edges) {
    if (edge.kind === 'partner' || cut.has(edge.to)) continue;
    if (edge.kind !== 'raised') push(links.branch, edge.from, edge.to);
    const parents =
      edge.kind === 'child'
        ? (owners.get(edge.from) ?? [])
        : edge.kind === 'parent'
          ? [edge.from]
          : [];
    for (const p of parents) {
      push(links.children, p, edge.to);
      relate(p, edge.to);
    }
    if (edge.kind === 'raised') relate(edge.from, edge.to);
  }
  for (const partners of owners.values()) {
    const [a, b] = partners;
    if (a && b) relate(a, b);
  }
  return links;
}

/** Personnes atteintes depuis `start` par les liens, sans passer par `blocked`. */
function reach(
  around: Map<string, Set<string>>,
  start: string,
  blocked: ReadonlySet<string>,
): Set<string> {
  const seen = new Set([start]);
  for (const pending = [start]; pending.length > 0; ) {
    for (const next of around.get(pending.pop() ?? '') ?? []) {
      if (seen.has(next) || blocked.has(next)) continue;
      seen.add(next);
      pending.push(next);
    }
  }
  return seen;
}

function hiddenBy(
  drawn: DisplayedGraph,
  folded: ReadonlySet<string>,
  focusId: string | undefined,
): Set<string> {
  const keys = [...folded];
  const cut = new Set(keys.flatMap((k) => (k.startsWith(ORIGIN) ? [k.slice(ORIGIN.length)] : [])));
  const { branch, children, around } = linksOf(drawn, cut);
  // Les enfants des branches pliées et les personnes masquées, puis leur descendance.
  const hidden = new Set<string>();
  const pending = keys.flatMap((key) =>
    key.startsWith(HIDE) ? [key.slice(HIDE.length)] : (branch.get(key) ?? []),
  );
  for (let person = pending.pop(); person !== undefined; person = pending.pop()) {
    if (hidden.has(person)) continue;
    hidden.add(person);
    pending.push(...(children.get(person) ?? []));
  }
  // Puis, jusqu'à stabilité, ceux dont tous les liens partent avec la branche.
  for (let round = 0; round < drawn.personIds.length; round += 1) {
    const loose = drawn.personIds.filter((id) => {
      const near = around.get(id);
      return !hidden.has(id) && near && [...near].every((other) => hidden.has(other));
    });
    if (loose.length === 0) break;
    for (const id of loose) hidden.add(id);
  }
  // Avec une personne au centre : ce qui tenait à elle et n'y tient plus part aussi
  // (le conjoint d'un collatéral et sa famille, une famille d'origine repliée).
  if (focusId && drawn.personIds.includes(focusId) && !hidden.has(focusId)) {
    const before = reach(linksOf(drawn, new Set()).around, focusId, new Set());
    const after = reach(around, focusId, hidden);
    for (const id of before) if (!after.has(id)) hidden.add(id);
  }
  return hidden;
}

/**
 * Le graphe sans ce qui est plié. Clés : un départ de branche (ses enfants partent), une
 * personne masquée (`hideKey`), une famille d'origine repliée (`originKey`).
 */
export function foldGraph(
  drawn: DisplayedGraph,
  folded: ReadonlySet<string>,
  focusId?: string,
): DisplayedGraph {
  if (folded.size === 0) return drawn;
  const owners = ownersOf(drawn);
  const hidden = hiddenBy(drawn, folded, focusId);
  const cut = new Set(
    [...folded].flatMap((k) => (k.startsWith(ORIGIN) ? [k.slice(ORIGIN.length)] : [])),
  );
  const shown = (id: string) => !hidden.has(id);
  const unions = drawn.unions.filter((u) => (owners.get(u.id) ?? []).every(shown));
  const kept = new Set(unions.map((u) => u.id));
  const visible = (id: string) => kept.has(id) || (shown(id) && !owners.has(id));
  return {
    personIds: drawn.personIds.filter(shown),
    unions,
    edges: drawn.edges.filter(
      (e) => visible(e.from) && visible(e.to) && (e.kind === 'partner' || !cut.has(e.to)),
    ),
  };
}
