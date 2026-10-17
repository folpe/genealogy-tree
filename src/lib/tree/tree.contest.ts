import type { DisplayedGraph } from '../../server/family/family.display';
import { foldGraph, hideKey, originKey } from './tree.fold';
import { partnerChains } from './tree.layout';
import { descend, type Kin, kinOf, lineageOf, siblingsOf } from './tree.lineage';
import { arrangeFamilies, type Side } from './tree.order';

// Zéro croisement sur la lignée directe (décision de Folpe, 2026-10-17, comme
// MyHeritage) : déplier l'un replie l'autre. Dans un couple de la lignée, l'intervalle
// entre les deux partenaires est disputé : d'un côté la famille d'origine de l'un,
// qui descend jusqu'à lui ; de l'autre les collatéraux de l'autre que l'ordre
// (`tree.order.ts`) range de ce côté-là et dont la descendance descend jusqu'au
// couple. Les deux à la fois croisent forcément : l'une des deux se replie, et la
// dernière action du lecteur gagne.

/** Une famille d'origine et les collatéraux qui lui disputent la place près du couple. */
export type Contest = {
  /** Le partenaire dont la famille d'origine descend dans l'intervalle. */
  origin: string;
  /** Les frères et sœurs d'ascendants de l'autre, rangés dans le même intervalle. */
  collaterals: string[];
};

/** Un pli posé pour garder l'arbre lisible : une famille d'origine, ou une branche. */
export type Closure = { kind: 'family' | 'branch'; personId: string };

export type Settled = { folded: string[]; closed: Closure[] };

/** La personne et ses ascendants, chacun à sa distance en générations. */
function generations(kin: Kin, person: string): Map<string, number> {
  const depth = new Map([[person, 0]]);
  for (const pending = [person]; pending.length > 0; ) {
    const current = pending.shift() ?? '';
    for (const parent of kin.parentsOf.get(current) ?? []) {
      if (depth.has(parent)) continue;
      depth.set(parent, (depth.get(current) ?? 0) + 1);
      pending.push(parent);
    }
  }
  return depth;
}

/** Une descendance affichée `depth` générations sous la personne (elle-même à 0). */
function reaches(kin: Kin, person: string, depth: number): boolean {
  let row = [person];
  for (let d = 0; d < depth && row.length > 0; d += 1) {
    row = row.flatMap((p) => kin.kidsOf.get(p) ?? []);
  }
  return row.length > 0;
}

/**
 * Collatéraux d'une personne rangés du côté `side` (celui de son conjoint) et qui
 * descendent jusqu'à sa rangée : les frères et sœurs de ses ascendants, à toute
 * génération, que leur fratrie range de ce côté.
 */
function innerCollaterals(
  kin: Kin,
  lineage: ReadonlySet<string>,
  sides: ReadonlyMap<string, Side>,
  person: string,
  side: Side,
): string[] {
  const found = new Set<string>();
  for (const [ancestor, depth] of generations(kin, person)) {
    for (const sibling of siblingsOf(kin, ancestor)) {
      if (lineage.has(sibling) || sides.get(sibling) !== side) continue;
      if (reaches(kin, sibling, depth)) found.add(sibling);
    }
  }
  return [...found];
}

/** Ce qui se dispute la place près de chaque couple de la lignée, dans cet état de pliage. */
export function contests(
  drawn: DisplayedGraph,
  folded: ReadonlySet<string>,
  focusId: string | undefined,
): Contest[] {
  if (!focusId) return [];
  const shown = foldGraph(drawn, folded, focusId);
  const lineage = lineageOf(shown, focusId);
  if (lineage.size === 0) return [];
  const blocks = partnerChains(shown).map((persons) => ({ id: persons.join('+'), persons }));
  const { persons, sides } = arrangeFamilies(shown, blocks, focusId);
  const kin = kinOf(shown);
  const hasFamily = (person: string) => (kin.parentsOf.get(person) ?? []).length > 0;
  const result: Contest[] = [];
  for (const oriented of persons.values()) {
    oriented.forEach((left, index) => {
      const right = oriented[index + 1];
      if (!right || !lineage.has(left) || !lineage.has(right)) return;
      const pairs: [string, string[]][] = [
        [right, innerCollaterals(kin, lineage, sides, left, 'right')],
        [left, innerCollaterals(kin, lineage, sides, right, 'left')],
      ];
      for (const [origin, collaterals] of pairs) {
        if (hasFamily(origin) && collaterals.length > 0) result.push({ origin, collaterals });
      }
    });
  }
  return result;
}

/**
 * Le côté qui vient d'apparaître cède à l'autre : la famille d'origine si ce sont les
 * collatéraux qui viennent d'apparaître, les collatéraux sinon. Les deux à la fois
 * (« Tout afficher », une mémoire d'avant) : la famille de la personne au centre
 * reste entière, celle de son conjoint se replie ; plus haut, les collatéraux cèdent
 * à la lignée.
 */
function foldsFamily(
  kin: Kin,
  seen: ReadonlySet<string>,
  contest: Contest,
  focusId: string,
): boolean {
  const fresh = (persons: Iterable<string>) => [...persons].some((id) => !seen.has(id));
  const familyFresh = fresh(kin.parentsOf.get(contest.origin) ?? []);
  const collateralsFresh = fresh(descend(kin, contest.collaterals));
  if (familyFresh !== collateralsFresh) return collateralsFresh;
  return contest.origin !== focusId && (kin.partnersOf.get(focusId) ?? []).includes(contest.origin);
}

/**
 * Les plis demandés (`after`), complétés pour qu'aucune famille n'en croise une autre
 * sur la lignée directe. `before` : les plis d'où part l'action du lecteur.
 */
export function settleFolds(
  drawn: DisplayedGraph,
  focusId: string | undefined,
  before: Iterable<string>,
  after: Iterable<string>,
): Settled {
  const folded = [...after];
  const closed: Closure[] = [];
  if (!focusId) return { folded, closed };
  const seen = new Set(foldGraph(drawn, new Set(before), focusId).personIds);
  for (let round = 0; round < drawn.personIds.length; round += 1) {
    const [contest] = contests(drawn, new Set(folded), focusId);
    if (!contest) break;
    const kin = kinOf(foldGraph(drawn, new Set(folded), focusId));
    if (foldsFamily(kin, seen, contest, focusId)) {
      folded.push(originKey(contest.origin));
      closed.push({ kind: 'family', personId: contest.origin });
    } else {
      folded.push(...contest.collaterals.map(hideKey));
      closed.push(...contest.collaterals.map((id) => ({ kind: 'branch' as const, personId: id })));
    }
  }
  return { folded, closed };
}
