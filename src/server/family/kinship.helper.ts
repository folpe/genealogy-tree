import {
  ancestorsOf,
  childrenOf,
  type FamilyIndex,
  FILIATION_KINDS,
  parentsOf,
  partnersOf,
  raisedBy,
} from './family.helper';
import type { Union } from './family.types';

export type BloodRelationship = {
  type: 'blood';
  /** Générations de `from` jusqu'à l'ancêtre commun. */
  up: number;
  /** Générations de l'ancêtre commun jusqu'à `to`. */
  down: number;
  /** Les deux branches ne partagent qu'un parent (demi-frère, demi-cousin...). */
  half: boolean;
  /** Ancêtres communs les plus proches, triés. */
  common: string[];
  /** Parent de `from` par lequel passe le lien (`null` si `from` est l'ancêtre commun). */
  parentOnPath: string | null;
};

export type Relationship =
  | { type: 'self' }
  | BloodRelationship
  /** `ongoing` : union non rompue (en cours, ou terminée par un décès). */
  | { type: 'spouse'; union: Union; ongoing: boolean }
  /** Beau-parent qui a élevé (`raisedMe`) ou enfant élevé, filiation `a_eleve`. */
  | { type: 'raised'; raisedMe: boolean }
  /** `to` est le conjoint d'un parent de sang de `from`. */
  | {
      type: 'spouseOfRelative';
      relativeId: string;
      relative: BloodRelationship;
      union: Union;
      ongoing: boolean;
    }
  /** `to` est un parent de sang du conjoint de `from`. */
  | { type: 'relativeOfSpouse'; spouseId: string; union: Union; relative: BloodRelationship }
  /** Aucun lien nommable ; `connected` si un chemin existe quand même dans l'arbre. */
  | { type: 'none'; connected: boolean };

const isUnbroken = (union: Union) => union.end === undefined || union.end.reason === 'deces';

function lineage(index: FamilyIndex, id: string): Map<string, number> {
  return new Map([[id, 0], ...ancestorsOf(index, id)]);
}

/** Ancêtres communs les plus proches (somme des générations minimale), triés. */
export function commonAncestors(index: FamilyIndex, a: string, b: string): string[] {
  return closest(lineage(index, a), lineage(index, b)).common;
}

function closest(fromLine: Map<string, number>, toLine: Map<string, number>) {
  let best = Number.POSITIVE_INFINITY;
  let common: string[] = [];
  for (const [id, up] of fromLine) {
    const down = toLine.get(id);
    if (down === undefined) continue;
    if (up + down < best) {
      best = up + down;
      common = [id];
    } else if (up + down === best) {
      common.push(id);
    }
  }
  return { common: common.sort() };
}

const parentSet = (index: FamilyIndex, id: string) =>
  new Set(parentsOf(index, id).map((p) => p.id));

/** Enfant de `ancestor` sur la branche qui mène à la personne de `line`. */
function branchChild(index: FamilyIndex, ancestor: string, line: Map<string, number>, gen: number) {
  return childrenOf(index, ancestor).find((c) => line.get(c.id) === gen - 1)?.id ?? null;
}

function blood(index: FamilyIndex, from: string, to: string): BloodRelationship | null {
  const fromLine = lineage(index, from);
  const toLine = lineage(index, to);
  const { common } = closest(fromLine, toLine);
  const anchor = common[0];
  if (anchor === undefined) return null;
  const up = fromLine.get(anchor) ?? 0;
  const down = toLine.get(anchor) ?? 0;

  let half = false;
  if (up > 0 && down > 0) {
    const fromBranch = branchChild(index, anchor, fromLine, up);
    const toBranch = branchChild(index, anchor, toLine, down);
    if (fromBranch && toBranch) {
      const a = parentSet(index, fromBranch);
      const b = parentSet(index, toBranch);
      half = a.size !== b.size || [...a].some((p) => !b.has(p));
    }
  }
  const parentOnPath =
    up === 0
      ? null
      : (parentsOf(index, from).find((p) => p.id === anchor || ancestorsOf(index, p.id).has(anchor))
          ?.id ?? null);
  return { type: 'blood', up, down, half, common, parentOnPath };
}

const degree = (r: BloodRelationship) => r.up + r.down;

function closestBlood(
  index: FamilyIndex,
  from: string,
  candidates: { id: string; union: Union }[],
  reverse = false,
) {
  let best: { id: string; union: Union; relation: BloodRelationship } | null = null;
  for (const candidate of candidates) {
    const relation = reverse ? blood(index, candidate.id, from) : blood(index, from, candidate.id);
    if (relation && (!best || degree(relation) < degree(best.relation))) {
      best = { ...candidate, relation };
    }
  }
  return best;
}

/** Lien entre deux personnes, indépendant de sa formulation (voir kinship.labels.ts). */
export function relationship(index: FamilyIndex, from: string, to: string): Relationship {
  if (from === to) return { type: 'self' };

  const asSpouse = partnersOf(index, from).find((p) => p.partnerId === to);
  if (asSpouse) {
    const union = index.unions.get(asSpouse.unionId) as Union;
    return { type: 'spouse', union, ongoing: isUnbroken(union) };
  }

  const relation = blood(index, from, to);
  if (relation) return relation;

  if (raisedBy(index, from).includes(to)) return { type: 'raised', raisedMe: true };
  if (raisedBy(index, to).includes(from)) return { type: 'raised', raisedMe: false };

  const partnersOfTo = partnersOf(index, to).flatMap((p) =>
    p.partnerId === null ? [] : [{ id: p.partnerId, union: index.unions.get(p.unionId) as Union }],
  );
  const viaRelative = closestBlood(index, from, partnersOfTo);
  if (viaRelative) {
    return {
      type: 'spouseOfRelative',
      relativeId: viaRelative.id,
      relative: viaRelative.relation,
      union: viaRelative.union,
      ongoing: isUnbroken(viaRelative.union),
    };
  }

  const spouses = partnersOf(index, from, { ongoingOnly: true }).flatMap((p) =>
    p.partnerId === null ? [] : [{ id: p.partnerId, union: index.unions.get(p.unionId) as Union }],
  );
  const viaSpouse = closestBlood(index, to, spouses, true);
  if (viaSpouse) {
    return {
      type: 'relativeOfSpouse',
      spouseId: viaSpouse.id,
      union: viaSpouse.union,
      relative: viaSpouse.relation,
    };
  }

  return { type: 'none', connected: findRelationshipPath(index, from, to).length > 0 };
}

/**
 * Chemin le plus court entre deux personnes, en passant par les nœuds d'union
 * comme dans l'arbre dessiné (pour éclairer le lien de parenté).
 */
export function findRelationshipPath(index: FamilyIndex, from: string, to: string): string[] {
  if (!index.persons.has(from) || !index.persons.has(to)) return [];
  // Le chemin suit les filiations dessinées : jamais la filiation `a_eleve`.
  const filiations = [...index.linksByChild.values()]
    .flat()
    .filter((l) => FILIATION_KINDS.includes(l.kind));
  const unionChildren = new Map<string, Set<string>>();
  for (const link of filiations) {
    if (link.unionId === undefined) continue;
    const set = unionChildren.get(link.unionId) ?? new Set<string>();
    set.add(link.childId);
    unionChildren.set(link.unionId, set);
  }
  const neighbours = (id: string): string[] => {
    const union = index.unions.get(id);
    if (union) {
      return [
        ...union.partnerIds.filter((p): p is string => p !== null),
        ...(unionChildren.get(id) ?? []),
      ];
    }
    const links = [
      ...parentLinks(id).map((l) => l.unionId ?? l.parentId),
      ...(index.unionsByPerson.get(id) ?? []).map((u) => u.id),
      ...(index.linksByParent.get(id) ?? [])
        .filter((l) => l.unionId === undefined && FILIATION_KINDS.includes(l.kind))
        .map((l) => l.childId),
    ];
    return [...new Set(links)];
  };
  function parentLinks(id: string) {
    return (index.linksByChild.get(id) ?? []).filter((l) => FILIATION_KINDS.includes(l.kind));
  }

  const previous = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (current === to) break;
    for (const next of neighbours(current)) {
      if (!previous.has(next)) {
        previous.set(next, current);
        queue.push(next);
      }
    }
  }
  if (!previous.has(to)) return [];
  const path: string[] = [];
  for (let cur: string | null = to; cur !== null; cur = previous.get(cur) ?? null) {
    path.unshift(cur);
  }
  return path;
}
