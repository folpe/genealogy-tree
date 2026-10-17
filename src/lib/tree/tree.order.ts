import type { DisplayedGraph } from '../../server/family/family.display';
import { lineageOf } from './tree.lineage';

// Ordre généalogique des blocs (retours de Folpe, 2026-10-15 et 2026-10-17). Laissé
// libre, ELK range chaque rangée pour croiser le moins de traits, quitte à glisser la
// famille d'un conjoint au milieu d'une fratrie. On lui impose donc l'ordre d'un
// tableau d'ascendance, rangée par rangée :
// - dans chaque couple de la lignée, le père à gauche, la mère à droite, la famille du
//   père à gauche, celle de la mère à droite (l'ordre des partenaires de l'union,
//   `selectDisplayedGraph`) ;
// - chaque fratrie d'un tenant, par ordre de naissance, l'aîné à gauche ;
// - un membre de la lignée ne quitte son rang que si ses frères et sœurs, d'un côté,
//   croiseraient une famille dépliée : celle de son conjoint, ou celle du conjoint d'un
//   de ses descendants en lignée directe. Il se range alors au bord de sa fratrie, de
//   ce côté-là. Sinon il garde son rang, et son conjoint vient contre lui ;
// - les familles d'origine des conjoints venus d'ailleurs, à l'extérieur, du côté de
//   leur conjoint ;
// - le repère d'une fratrie repliée, au bout de la fratrie, côté extérieur.

export type OrderedBlock = { id: string; persons: string[] };

/** Repère d'une fratrie repliée : un bloc à lui, sous le départ de branche `branch`. */
export type MarkerBlock = { id: string; branch: string };

export type Arrangement = {
  /** Ordre des blocs : sur chaque rangée, ELK garde l'ordre relatif de cette liste. */
  order: string[];
  /** Partenaires de chaque couple, de gauche à droite. */
  persons: Map<string, string[]>;
};

type Side = 'left' | 'right';
/** Blocs rangés, par rangée (0 : la personne au centre, 1 : ses parents, -1 : ses enfants). */
type Region = Map<number, string[]>;
/**
 * Profondeur, sous un membre de la lignée, de la première famille dépliée que ses frères
 * et sœurs croiseraient de chaque côté (0 : celle de son conjoint).
 */
type Blocked = { left?: number | undefined; right?: number | undefined };

type FamilyLinks = {
  blocks: Map<string, string[]>;
  blockOf: (person: string) => string;
  /** Bloc des parents d'une personne (le premier trouvé). */
  parentBlock: Map<string, string>;
  parentsOf: Map<string, string[]>;
  /** Enfants des unions d'un bloc, dans l'ordre de naissance. */
  childrenOf: (blockId: string) => string[];
  /** Repères des fratries repliées sous chaque bloc. */
  markersOf: Map<string, string[]>;
  /** Ordre des partenaires de l'union entre deux personnes. */
  unionOrder: (a: string, b: string) => [string, string];
};

type Ctx = {
  g: FamilyLinks;
  rows: Map<string, number>;
  lineage: Set<string>;
  blood: Set<string>;
  visited: Set<string>;
  persons: Map<string, string[]>;
  deferred: { origin: string; side: Side }[];
};

const NONE: Region = new Map();

function join(...regions: Region[]): Region {
  const result: Region = new Map();
  for (const region of regions) {
    for (const [row, ids] of region) result.set(row, [...(result.get(row) ?? []), ...ids]);
  }
  return result;
}

const rowsWhere = (region: Region, keep: (row: number) => boolean): Region =>
  new Map([...region].filter(([row]) => keep(row)));

const one = (ctx: Ctx, block: string): Region => new Map([[ctx.rows.get(block) ?? 0, [block]]]);

/** Ordre final : les rangées de haut en bas, chacune de gauche à droite. */
function flatten(region: Region): string[] {
  return [...region].sort(([a], [b]) => b - a).flatMap(([, ids]) => ids);
}

export function arrangeFamilies(
  drawn: DisplayedGraph,
  blocks: OrderedBlock[],
  focusId: string | undefined,
  markers: MarkerBlock[] = [],
): Arrangement {
  const g = familyGraph(drawn, blocks, markers);
  const lineage = focusId ? lineageOf(drawn, focusId) : new Set<string>();
  const ctx: Ctx = {
    g,
    rows: rowsOf(g, [...(focusId ? [g.blockOf(focusId)] : []), ...g.blocks.keys()]),
    lineage,
    blood: bloodOf(g, lineage),
    visited: new Set(),
    persons: new Map(),
    deferred: [],
  };
  let placed =
    focusId && g.blocks.has(g.blockOf(focusId)) ? centered(ctx, g.blockOf(focusId)) : NONE;
  // Les familles des conjoints venus d'ailleurs, à l'extérieur, la plus récente au bord.
  for (let next = ctx.deferred.shift(); next; next = ctx.deferred.shift()) {
    const family = inLaw(ctx, next.origin, next.side);
    placed = next.side === 'left' ? join(family, placed) : join(placed, family);
  }
  const order = flatten(placed);
  // Le reste (familles sans lien avec la personne au centre, repères isolés).
  for (const id of [...g.blocks.keys(), ...markers.map((m) => m.id)]) {
    if (ctx.visited.has(id)) continue;
    order.push(...flatten(inLaw(ctx, id, 'right')));
    for (let next = ctx.deferred.shift(); next; next = ctx.deferred.shift()) {
      order.push(...flatten(inLaw(ctx, next.origin, next.side)));
    }
  }
  for (const id of g.blocks.keys()) if (!ctx.persons.has(id)) orient(ctx, id, undefined);
  return { order, persons: ctx.persons };
}

/** La personne au centre : ses ascendants de part et d'autre, sa descendance sous elle. */
function centered(ctx: Ctx, block: string): Region {
  ctx.visited.add(block);
  const around = split(ctx, block, {}, undefined);
  return join(around.left, one(ctx, block), progeny(ctx, block, undefined), around.right);
}

/**
 * Autour d'un bloc de la lignée : les familles d'origine de ses membres. Au-dessus de sa
 * rangée, tout va dans `left` (chaque membre après celui de gauche) ; sur sa rangée et
 * en dessous, `left` et `right` l'encadrent.
 */
function split(
  ctx: Ctx,
  block: string,
  chain: Blocked,
  side: Side | undefined,
): { left: Region; right: Region } {
  const members = orient(ctx, block, side);
  const row = ctx.rows.get(block) ?? 0;
  let above: Region = NONE;
  let left: Region = NONE;
  let right: Region = NONE;
  members.forEach((member, index) => {
    const own =
      side ?? (members.length === 1 ? undefined : index < members.length / 2 ? 'left' : 'right');
    if (!ctx.lineage.has(member)) {
      defer(ctx, member, own ?? 'right');
      return;
    }
    const family = ancestry(ctx, member, chain, own);
    const higher = (r: number) => r > row;
    above = join(
      above,
      ...[family.left, family.mid, family.right].map((p) => rowsWhere(p, higher)),
    );
    left = join(
      left,
      rowsWhere(family.left, (r) => r <= row),
    );
    right = join(
      right,
      rowsWhere(family.right, (r) => r <= row),
    );
  });
  return { left: join(above, left), right };
}

/** Famille d'origine d'un membre de la lignée : ses parents (`mid`) et sa fratrie autour de lui. */
function ancestry(ctx: Ctx, person: string, chain: Blocked, side: Side | undefined) {
  const parents = ctx.g.parentBlock.get(person);
  const own = ctx.g.blockOf(person);
  if (!parents || parents === own || ctx.visited.has(parents)) {
    return { left: NONE, mid: NONE, right: NONE };
  }
  ctx.visited.add(parents);
  const blocked = merge(ownBlocked(ctx, person), chain);
  const up = split(ctx, parents, deeper(blocked), side);
  const kids = ctx.g.childrenOf(parents);
  const siblings = kids.filter((k) => k !== person && !ctx.visited.has(ctx.g.blockOf(k)));
  const { before, after, markerSide } = spill(ctx, person, kids, siblings, blocked);
  const markers = markerRegion(ctx, parents);
  const left = join(
    up.left,
    markerSide === 'left' ? markers : NONE,
    ...before.map((s) => collateral(ctx, s, 'left')),
  );
  const right = join(
    ...after.map((s) => collateral(ctx, s, 'right')),
    markerSide === 'right' ? markers : NONE,
    up.right,
  );
  return { left, mid: one(ctx, parents), right };
}

/**
 * Le rang d'une personne de la lignée dans sa fratrie : son rang de naissance si ses
 * frères et sœurs ne croisent rien, sinon le bord du côté qui croiserait une famille.
 */
function spill(
  ctx: Ctx,
  person: string,
  kids: string[],
  siblings: string[],
  blocked: Blocked,
): { before: string[]; after: string[]; markerSide: Side } {
  const { left, right } = blocked;
  const toward: Side | undefined =
    left === undefined && right === undefined
      ? undefined
      : left === undefined
        ? 'left'
        : right === undefined
          ? 'right'
          : left === right
            ? undefined
            : left > right
              ? 'left'
              : 'right';
  if (toward === 'left') return { before: siblings, after: [], markerSide: 'left' };
  if (toward === 'right') return { before: [], after: siblings, markerSide: 'right' };
  const rank = kids.indexOf(person);
  const older = siblings.filter((s) => kids.indexOf(s) < rank);
  const younger = siblings.filter((s) => kids.indexOf(s) > rank);
  return { before: older, after: younger, markerSide: outerSide(ctx, person) };
}

/** Côté opposé à son conjoint dans le couple ; à gauche sans conjoint. */
function outerSide(ctx: Ctx, person: string): Side {
  const members = ctx.persons.get(ctx.g.blockOf(person)) ?? [person];
  return members.length > 1 && members.indexOf(person) > 0 ? 'right' : 'left';
}

/** Les familles dépliées des conjoints d'une personne : à quelle distance, de quel côté. */
function ownBlocked(ctx: Ctx, person: string): Blocked {
  const members = ctx.persons.get(ctx.g.blockOf(person)) ?? [person];
  const at = members.indexOf(person);
  const origin = ctx.g.parentBlock.get(person);
  const result: Blocked = {};
  members.forEach((other, index) => {
    const family = ctx.g.parentBlock.get(other);
    if (other === person || !family || family === origin) return;
    result[index < at ? 'left' : 'right'] = 0;
  });
  return result;
}

const nearest = (a: number | undefined, b: number | undefined) =>
  a === undefined ? b : b === undefined ? a : Math.min(a, b);
const merge = (a: Blocked, b: Blocked): Blocked => ({
  left: nearest(a.left, b.left),
  right: nearest(a.right, b.right),
});
const deeper = ({ left, right }: Blocked): Blocked => ({
  left: left === undefined ? undefined : left + 1,
  right: right === undefined ? undefined : right + 1,
});

/** Un collatéral : son couple et toute sa descendance, rangés du côté `side`. */
function collateral(ctx: Ctx, person: string, side: Side): Region {
  const block = ctx.g.blockOf(person);
  if (ctx.visited.has(block)) return NONE;
  ctx.visited.add(block);
  for (const member of orient(ctx, block, side)) {
    if (!ctx.blood.has(member)) defer(ctx, member, side);
  }
  return join(one(ctx, block), progeny(ctx, block, side));
}

/** Les enfants d'un bloc et leurs familles ; sans côté imposé, chaque moitié du sien. */
function progeny(ctx: Ctx, block: string, side: Side | undefined): Region {
  const kids = ctx.g.childrenOf(block);
  const markers = markerRegion(ctx, block);
  const families = kids.map((kid, index) =>
    collateral(ctx, kid, side ?? (index < kids.length / 2 ? 'left' : 'right')),
  );
  return side === 'right' ? join(...families, markers) : join(markers, ...families);
}

/** Famille d'origine d'un conjoint venu d'ailleurs : ses ascendants, puis sa descendance. */
function inLaw(ctx: Ctx, block: string, side: Side): Region {
  if (ctx.visited.has(block)) return NONE;
  ctx.visited.add(block);
  const up = orient(ctx, block, side).flatMap((member) => {
    const origin = ctx.g.parentBlock.get(member);
    return origin && !ctx.visited.has(origin) ? [inLaw(ctx, origin, side)] : [];
  });
  return join(...up, one(ctx, block), progeny(ctx, block, side));
}

function defer(ctx: Ctx, person: string, side: Side) {
  const origin = ctx.g.parentBlock.get(person);
  if (origin && !ctx.visited.has(origin)) ctx.deferred.push({ origin, side });
}

function markerRegion(ctx: Ctx, block: string): Region {
  const ids = (ctx.g.markersOf.get(block) ?? []).filter((id) => !ctx.visited.has(id));
  for (const id of ids) ctx.visited.add(id);
  return ids.length > 0 ? new Map([[(ctx.rows.get(block) ?? 0) - 1, ids]]) : NONE;
}

/**
 * Partenaires d'un couple, de gauche à droite : l'ordre de leur union (le père à
 * gauche). Un conjoint venu avec sa famille passe du côté où elle se range.
 */
function orient(ctx: Ctx, block: string, side: Side | undefined): string[] {
  const known = ctx.persons.get(block);
  if (known) return known;
  const persons = ctx.g.blocks.get(block) ?? [];
  const [a, b] = persons;
  let oriented = persons;
  if (persons.length === 2 && a && b) {
    oriented = ctx.g.unionOrder(a, b);
    const inLaw = oriented.findIndex((p) => !ctx.blood.has(p) && ctx.g.parentBlock.has(p));
    const towards = inLaw === 0 ? 'left' : inLaw === 1 ? 'right' : undefined;
    if (side && towards && towards !== side && !oriented.some((p) => ctx.lineage.has(p))) {
      oriented = [...oriented].reverse();
    }
  }
  ctx.persons.set(block, oriented);
  return oriented;
}

/** Rangée de chaque bloc, de proche en proche depuis le premier de `starts`. */
function rowsOf(g: FamilyLinks, starts: string[]): Map<string, number> {
  const rows = new Map<string, number>();
  for (const start of starts) {
    if (rows.has(start) || !g.blocks.has(start)) continue;
    rows.set(start, 0);
    for (const pending = [start]; pending.length > 0; ) {
      const block = pending.shift() ?? '';
      const row = rows.get(block) ?? 0;
      const near = [
        ...(g.blocks.get(block) ?? []).flatMap((p) =>
          (g.parentsOf.get(p) ?? []).map((parent) => [g.blockOf(parent), row + 1] as const),
        ),
        ...g.childrenOf(block).map((child) => [g.blockOf(child), row - 1] as const),
      ];
      for (const marker of g.markersOf.get(block) ?? []) rows.set(marker, row - 1);
      for (const [next, at] of near) {
        if (rows.has(next)) continue;
        rows.set(next, at);
        pending.push(next);
      }
    }
  }
  return rows;
}

function familyGraph(
  drawn: DisplayedGraph,
  blocks: OrderedBlock[],
  markers: MarkerBlock[],
): FamilyLinks {
  const byPerson = new Map(blocks.flatMap((b) => b.persons.map((p) => [p, b.id] as const)));
  const blockOf = (person: string) => byPerson.get(person) ?? person;
  const partners = new Map(drawn.unions.map((u) => [u.id, u.partnerIds]));
  const ownerOf = (source: string) =>
    partners.get(source)?.find((p): p is string => typeof p === 'string') ?? source;
  const childrenBySource = new Map<string, string[]>();
  const parentBlock = new Map<string, string>();
  const parentsOf = new Map<string, string[]>();
  /** Rang de naissance : les arêtes viennent par ordre de naissance (selectDisplayedGraph). */
  const rank = new Map<string, number>();
  for (const edge of drawn.edges) {
    if (edge.kind !== 'child' && edge.kind !== 'parent') continue;
    if (!rank.has(edge.to)) rank.set(edge.to, rank.size);
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
    const block = blockOf(ownerOf(source));
    sourcesOf.set(block, [...(sourcesOf.get(block) ?? []), source]);
  }
  const markersOf = new Map<string, string[]>();
  for (const marker of markers) {
    const block = blockOf(ownerOf(marker.branch));
    markersOf.set(block, [...(markersOf.get(block) ?? []), marker.id]);
  }
  const unionOrder = (a: string, b: string): [string, string] => {
    const union = drawn.unions.find((u) => u.partnerIds.includes(a) && u.partnerIds.includes(b));
    return union?.partnerIds[0] === b ? [b, a] : [a, b];
  };
  return {
    blocks: new Map(blocks.map((b) => [b.id, b.persons])),
    blockOf,
    parentBlock,
    parentsOf,
    childrenOf: (blockId) =>
      [
        ...new Set((sourcesOf.get(blockId) ?? []).flatMap((s) => childrenBySource.get(s) ?? [])),
      ].sort((x, y) => (rank.get(x) ?? 0) - (rank.get(y) ?? 0)),
    markersOf,
    unionOrder,
  };
}

/** La lignée et tous les descendants de ses membres : la parenté de sang des familles. */
function bloodOf(g: FamilyLinks, lineage: Set<string>): Set<string> {
  if (lineage.size === 0) return new Set([...g.blocks.values()].flat());
  const childrenOfPerson = new Map<string, string[]>();
  for (const [child, parents] of g.parentsOf) {
    for (const parent of parents) {
      childrenOfPerson.set(parent, [...(childrenOfPerson.get(parent) ?? []), child]);
    }
  }
  const blood = new Set(lineage);
  for (const pending = [...lineage]; pending.length > 0; ) {
    for (const child of childrenOfPerson.get(pending.pop() ?? '') ?? []) {
      if (!blood.has(child)) {
        blood.add(child);
        pending.push(child);
      }
    }
  }
  return blood;
}
