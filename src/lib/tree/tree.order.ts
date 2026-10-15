import type { DisplayedGraph } from '../../server/family/family.display';

// Ordre généalogique des blocs (retour de Folpe, 2026-10-15 : « les familles sont
// mélangées »). Laissé libre, ELK range chaque rangée pour croiser le moins de traits,
// quitte à glisser la famille d'un conjoint au milieu d'une fratrie. On lui impose donc
// l'ordre d'un arbre généalogique : autour de la personne au centre, chaque fratrie de
// ses ascendants d'un tenant, la lignée directe au bord intérieur (le côté du premier
// partenaire à gauche, celui du second à droite), et les familles d'origine des
// conjoints à l'extérieur de la nôtre, du côté de leur conjoint.

export type OrderedBlock = { id: string; persons: string[] };

/** Ordre des blocs : sur chaque rangée, ELK garde l'ordre relatif de cette liste. */
export function familyOrder(
  drawn: DisplayedGraph,
  blocks: OrderedBlock[],
  focusId: string | undefined,
): string[] {
  const g = familyGraph(drawn, blocks);
  const blood = bloodOf(g, focusId);
  const visited = new Set<string>();
  /** Famille d'origine d'un conjoint (`origin`), à ranger du côté de ce conjoint (`via`). */
  const deferred: { origin: string; via: string }[] = [];

  const descendants = (blockId: string): string[] => {
    if (visited.has(blockId)) return [];
    visited.add(blockId);
    for (const person of g.blocks.get(blockId) ?? []) {
      const origin = g.parentBlock.get(person);
      if (origin && !blood.has(person)) deferred.push({ origin, via: blockId });
    }
    return [blockId, ...g.childrenOf(blockId).flatMap((c) => descendants(g.blockOf(c)))];
  };
  /** Les enfants d'un bloc sauf la lignée directe : leurs familles entières. */
  const others = (blockId: string, direct: string) =>
    g.childrenOf(blockId).flatMap((c) => (c === direct ? [] : descendants(g.blockOf(c))));

  const lineage = (blockId: string, center: () => string[]): string[] => {
    visited.add(blockId);
    const persons = g.blocks.get(blockId) ?? [];
    const left: string[] = [];
    const right: string[] = [];
    persons.forEach((person, index) => {
      const origin = g.parentBlock.get(person);
      if (!origin || !blood.has(person) || visited.has(origin)) return;
      const up = () => lineage(origin, () => [origin]);
      // Le premier partenaire a sa famille à gauche, le second à droite.
      if (index < (persons.length - 1) / 2 || persons.length === 1) {
        left.push(...up(), ...others(origin, person));
      } else {
        right.push(...others(origin, person), ...up());
      }
    });
    return [...left, ...center(), ...right];
  };

  const order = focusId ? centered(focusId) : [];
  /**
   * La personne au centre : son bloc et sa descendance au cœur de la lignée de ses
   * parents (côté paternel à gauche, maternel à droite), sa fratrie de son côté.
   */
  function centered(focus: string): string[] {
    const focusBlock = g.blockOf(focus);
    const origin = g.parentBlock.get(focus);
    // Sans parents, ou parents soudés au même bloc (chaîne de remariages) : sa descendance.
    if (!origin || origin === focusBlock) return descendants(focusBlock);
    const persons = g.blocks.get(focusBlock) ?? [];
    const onLeft = persons.indexOf(focus) < (persons.length - 1) / 2 || persons.length === 1;
    visited.add(focusBlock);
    return lineage(origin, () => {
      visited.add(origin);
      visited.delete(focusBlock);
      const siblings = others(origin, focus);
      const own = descendants(focusBlock);
      return [origin, ...(onLeft ? [...siblings, ...own] : [...own, ...siblings])];
    });
  }
  // Les familles d'origine des conjoints, chacune avec ses ascendants, puis le reste.
  // Celle d'un conjoint rangé à gauche de la personne au centre part au bord gauche :
  // à droite, ses traits barreraient toute la rangée. Marqué avant de remonter : deux blocs peuvent être chacun l'origine de l'autre
  // (remariages croisés), la remontée doit s'arrêter.
  const climbing = new Set<string>();
  const family = (blockId: string): string[] => {
    if (visited.has(blockId) || climbing.has(blockId)) return [];
    climbing.add(blockId);
    const up = (g.blocks.get(blockId) ?? []).flatMap((person) => {
      const origin = g.parentBlock.get(person);
      return origin && !visited.has(origin) ? family(origin) : [];
    });
    return [...up, ...descendants(blockId)];
  };
  const centerAt = focusId ? order.indexOf(g.blockOf(focusId)) : -1;
  const onLeft = new Set(order.slice(0, Math.max(centerAt, 0)));
  const outerLeft: string[] = [];
  for (let next = deferred.shift(); next !== undefined; next = deferred.shift()) {
    const placed = family(next.origin);
    if (!onLeft.has(next.via)) {
      order.push(...placed);
      continue;
    }
    // Les familles venues d'elle restent de son côté.
    for (const block of placed) onLeft.add(block);
    outerLeft.push(...placed);
  }
  for (const block of blocks) order.push(...family(block.id));
  return [...outerLeft, ...order];
}

type FamilyLinks = {
  blocks: Map<string, string[]>;
  blockOf: (person: string) => string;
  /** Bloc des parents d'une personne (le premier trouvé). */
  parentBlock: Map<string, string>;
  parentsOf: Map<string, string[]>;
  childrenOf: (blockId: string) => string[];
};

function familyGraph(drawn: DisplayedGraph, blocks: OrderedBlock[]): FamilyLinks {
  const byPerson = new Map(blocks.flatMap((b) => b.persons.map((p) => [p, b.id] as const)));
  const blockOf = (person: string) => byPerson.get(person) ?? person;
  const partners = new Map(drawn.unions.map((u) => [u.id, u.partnerIds]));
  const childrenBySource = new Map<string, string[]>();
  const parentBlock = new Map<string, string>();
  const parentsOf = new Map<string, string[]>();
  for (const edge of drawn.edges) {
    if (edge.kind !== 'child' && edge.kind !== 'parent') continue;
    childrenBySource.set(edge.from, [...(childrenBySource.get(edge.from) ?? []), edge.to]);
    const parents: string[] =
      edge.kind === 'child'
        ? (partners.get(edge.from) ?? []).flatMap((p) => (typeof p === 'string' ? [p] : []))
        : [edge.from];
    parentsOf.set(edge.to, [...(parentsOf.get(edge.to) ?? []), ...parents]);
    const first = parents[0];
    if (first && !parentBlock.has(edge.to)) parentBlock.set(edge.to, blockOf(first));
  }
  const sourcesOf = new Map<string, string[]>();
  for (const [source] of childrenBySource) {
    const owner = partners.get(source)?.find((p): p is string => typeof p === 'string') ?? source;
    const block = blockOf(owner);
    sourcesOf.set(block, [...(sourcesOf.get(block) ?? []), source]);
  }
  return {
    blocks: new Map(blocks.map((b) => [b.id, b.persons])),
    blockOf,
    parentBlock,
    parentsOf,
    childrenOf: (blockId) => [
      ...new Set((sourcesOf.get(blockId) ?? []).flatMap((s) => childrenBySource.get(s) ?? [])),
    ],
  };
}

/** Parenté de sang de la personne au centre : ses ascendants et tous leurs descendants. */
function bloodOf(g: FamilyLinks, focusId: string | undefined): Set<string> {
  if (!focusId) return new Set([...g.blocks.values()].flat());
  const ancestors = new Set<string>([focusId]);
  for (const pending = [focusId]; pending.length > 0; ) {
    const person = pending.pop() ?? '';
    for (const parent of g.parentsOf.get(person) ?? []) {
      if (!ancestors.has(parent)) {
        ancestors.add(parent);
        pending.push(parent);
      }
    }
  }
  const blood = new Set(ancestors);
  const childrenOfPerson = new Map<string, string[]>();
  for (const [child, parents] of g.parentsOf) {
    for (const parent of parents) {
      childrenOfPerson.set(parent, [...(childrenOfPerson.get(parent) ?? []), child]);
    }
  }
  for (const pending = [...ancestors]; pending.length > 0; ) {
    const person = pending.pop() ?? '';
    for (const child of childrenOfPerson.get(person) ?? []) {
      if (!blood.has(child)) {
        blood.add(child);
        pending.push(child);
      }
    }
  }
  return blood;
}
