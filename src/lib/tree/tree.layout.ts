import type { ElkExtendedEdge, ElkNode, ElkPort } from 'elkjs/lib/elk-api';
import { z } from 'zod';
import type { DisplayedGraph } from '../../server/family/family.display';
import { countCrossings } from './tree.crossings';
import { DEFAULT_METRICS, type LayoutMetrics, type Point } from './tree.metrics';
import { arrangeFamilies } from './tree.order';

// Placement de l'arbre (plan phase 4, lot 2). ELK (algorithme `layered`) ne connaît
// pas les couples : laissé seul, il éloigne des partenaires et ajoute une couche par
// union. Chaque couple devient donc un bloc, partenaires côte à côte, et les enfants
// partent d'un port posé au milieu du trait d'union. ELK range les blocs ; ce module
// en déduit la position de chaque bulle. Prototype sur la famille réelle le
// 2026-10-12 : couples tous soudés, générations en lignes, 94 ms pour 103 fiches.

export type TreeLayout = {
  /** Centre de la bulle de chaque personne. */
  persons: Record<string, Point>;
  /** Milieu du trait d'union, d'où partent les enfants. */
  unions: Record<string, Point>;
  /** Emplacement « parent à découvrir » des unions à partenaire inconnu. */
  unknownPartners: Record<string, Point>;
  /**
   * Unions sans trait entre voisins directs (une personne à trois unions dessinées,
   * un parent inconnu sans côté libre) : pas de point d'union ; le trait passe en arc
   * au-dessus des bulles et les enfants partent de chaque parent.
   */
  detachedUnions: string[];
  /** Repère de chaque fratrie repliée, par départ de branche (tree.lineage.ts). */
  markers: Record<string, Point>;
  width: number;
  height: number;
};

/** Ce que ce module attend d'ELK : la version Web Worker comme la version « bundled ». */
export type ElkLike = { layout: (graph: ElkNode) => Promise<ElkNode> };

type Slot =
  | { kind: 'person'; id: string }
  | { kind: 'unknown'; unionId: string }
  | { kind: 'marker'; branch: string };
type Block = { id: string; slots: Slot[]; unionSlots: Map<string, [number, number]> };

/**
 * Couples soudés : composantes du graphe des partenaires, posées en chaîne. Une union
 * entre voisins directs reçoit un point (un couple remarié en garde un seul pour ses
 * deux unions) ; toute autre union de la composante est détachée.
 */
function buildBlocks(drawn: DisplayedGraph): { blocks: Block[]; detached: Set<string> } {
  const placedIds = new Set(drawn.personIds);
  const partners = new Map<string, Set<string>>(drawn.personIds.map((id) => [id, new Set()]));
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const unionsOfPair = new Map<string, string[]>();
  for (const union of drawn.unions) {
    const [a, b] = union.partnerIds;
    if (typeof b !== 'string' || !placedIds.has(a) || !placedIds.has(b)) continue;
    partners.get(a)?.add(b);
    partners.get(b)?.add(a);
    const key = pairKey(a, b);
    unionsOfPair.set(key, [...(unionsOfPair.get(key) ?? []), union.id]);
  }

  const seen = new Set<string>();
  const blocks: Block[] = [];
  for (const start of drawn.personIds) {
    if (seen.has(start)) continue;
    const component = [start];
    seen.add(start);
    for (let i = 0; i < component.length; i += 1) {
      for (const other of partners.get(component[i] ?? '') ?? []) {
        if (!seen.has(other)) {
          seen.add(other);
          component.push(other);
        }
      }
    }
    // Chaîne depuis une extrémité ; une personne hors chaîne suit à la fin.
    const end = component.find((id) => (partners.get(id)?.size ?? 0) <= 1) ?? start;
    const order: string[] = [];
    for (let current: string | undefined = end; current && !order.includes(current); ) {
      order.push(current);
      current = [...(partners.get(current) ?? [])].find((other) => !order.includes(other));
    }
    for (const id of component) if (!order.includes(id)) order.push(id);

    const unionSlots = new Map<string, [number, number]>();
    for (let i = 0; i + 1 < order.length; i += 1) {
      for (const unionId of unionsOfPair.get(pairKey(order[i] ?? '', order[i + 1] ?? '')) ?? []) {
        unionSlots.set(unionId, [i, i + 1]);
      }
    }
    blocks.push({
      id: `bloc-${blocks.length}`,
      slots: order.map((id) => ({ kind: 'person', id })),
      unionSlots,
    });
  }

  // Parent inconnu : un emplacement réservé du côté libre du parent connu.
  const blockOf = new Map<string, Block>();
  for (const block of blocks) {
    for (const s of block.slots) if (s.kind === 'person') blockOf.set(s.id, block);
  }
  for (const union of drawn.unions) {
    const [known, other] = union.partnerIds;
    const block = blockOf.get(known);
    if (typeof other === 'string' || !block) continue;
    const index = block.slots.findIndex((s) => s.kind === 'person' && s.id === known);
    const unknown: Slot = { kind: 'unknown', unionId: union.id };
    if (index === block.slots.length - 1) {
      block.slots.push(unknown);
      block.unionSlots.set(union.id, [index, index + 1]);
    } else if (index === 0) {
      block.slots.unshift(unknown);
      for (const [id, [a, b]] of block.unionSlots) block.unionSlots.set(id, [a + 1, b + 1]);
      block.unionSlots.set(union.id, [0, 1]);
    }
  }

  const attached = new Set(blocks.flatMap((b) => [...b.unionSlots.keys()]));
  const detached = new Set(
    drawn.unions
      .filter((u) => !attached.has(u.id) && blockOf.has(u.partnerIds[0]))
      .map((u) => u.id),
  );
  return { blocks, detached };
}

const elkResultSchema = z.object({
  width: z.number(),
  height: z.number(),
  children: z.array(z.object({ id: z.string(), x: z.number(), y: z.number() })),
});

/** Un placement neuf à chaque fois : ses tables sont remplies sur place. */
const emptyLayout = (): TreeLayout => ({
  persons: {},
  unions: {},
  unknownPartners: {},
  detachedUnions: [],
  markers: {},
  width: 0,
  height: 0,
});

export type LayoutOptions = {
  /**
   * Personne au centre de la vue : l'arbre se range autour d'elle, famille par famille
   * (tree.order.ts). Sans elle, ELK range librement chaque rangée.
   */
  focusId?: string | undefined;
  /**
   * Départs de branche dont des enfants sont masqués : chacun reçoit un repère, à la
   * place d'une bulle, au bout de la fratrie (tree.order.ts).
   */
  markers?: string[];
  metrics?: LayoutMetrics;
};

export async function computeTreeLayout(
  drawn: DisplayedGraph,
  elk: ElkLike,
  { focusId, markers = [], metrics = DEFAULT_METRICS }: LayoutOptions = {},
): Promise<TreeLayout> {
  if (drawn.personIds.length === 0) return emptyLayout();
  // La minimisation des croisements d'ELK est une heuristique qui peut s'arrêter sur
  // un optimum local selon sa graine : on en essaie quelques-unes et on garde le
  // placement le plus lisible, en s'arrêtant au premier sans croisement.
  let best: { layout: TreeLayout; crossings: number } | undefined;
  // Ordre imposé : ELK ne minimise plus rien, la graine n'y change rien, une passe suffit.
  for (const seed of focusId ? SEEDS.slice(0, 1) : SEEDS) {
    const layout = await placeOnce(drawn, elk, { metrics, focusId, seed, markers });
    const crossings = countCrossings(drawn, layout);
    if (!best || crossings < best.crossings) best = { layout, crossings };
    if (crossings === 0) break;
  }
  return best?.layout ?? emptyLayout();
}

/** Graines essayées, dans l'ordre ; la première suffit presque toujours. */
const SEEDS = [1, 2, 3] as const;

type Pass = {
  metrics: LayoutMetrics;
  focusId: string | undefined;
  seed: number;
  markers: string[];
};

const personsOf = (block: Block) => block.slots.flatMap((s) => (s.kind === 'person' ? [s.id] : []));

async function placeOnce(drawn: DisplayedGraph, elk: ElkLike, pass: Pass): Promise<TreeLayout> {
  const { blocks, detached } = buildBlocks(drawn);
  const markers = pass.markers.map((branch, index) => ({ id: `repere-${index}`, branch }));
  const all: Block[] = [
    ...blocks,
    ...markers.map((m) => ({
      id: m.id,
      slots: [{ kind: 'marker' as const, branch: m.branch }],
      unionSlots: new Map(),
    })),
  ];
  if (pass.focusId) {
    // Ordre et côtés imposés (tree.order.ts) : un seul passage.
    const { order, persons } = arrangeFamilies(
      drawn,
      blocks.map((b) => ({ id: b.id, persons: personsOf(b) })),
      pass.focusId,
      markers,
    );
    for (const block of blocks) {
      const [left] = persons.get(block.id) ?? [];
      const [first] = block.slots;
      if (block.slots.length === 2 && first?.kind === 'person' && left && first.id !== left) {
        block.slots.reverse();
      }
    }
    return placeBlocks(drawn, all, detached, elk, pass, order);
  }
  const first = await placeBlocks(drawn, all, detached, elk, pass, undefined);
  // ELK range les blocs mais ne retourne pas un couple : chaque partenaire passe du
  // côté de sa famille d'origine, puis on replace (retour de Folpe, 2026-10-13).
  if (!orientCouples(drawn, blocks, first)) return first;
  // Le second passage peut ranger les blocs autrement : on garde le plus lisible.
  const turned = await placeBlocks(drawn, all, detached, elk, pass, undefined);
  return countCrossings(drawn, turned) <= countCrossings(drawn, first) ? turned : first;
}

/** Abscisse d'où descend le trait vers une personne : l'union de ses parents, ou son parent. */
function originsX(drawn: DisplayedGraph, layout: TreeLayout): Map<string, number> {
  const partners = new Map(drawn.unions.map((u) => [u.id, u.partnerIds]));
  const origins = new Map<string, number>();
  for (const edge of drawn.edges) {
    if (edge.kind !== 'child' && edge.kind !== 'parent') continue;
    let x = edge.kind === 'parent' ? layout.persons[edge.from]?.x : layout.unions[edge.from]?.x;
    if (x === undefined && edge.kind === 'child') {
      const placed = (partners.get(edge.from) ?? []).flatMap((p) =>
        p && layout.persons[p] ? [layout.persons[p].x] : [],
      );
      if (placed.length > 0) x = placed.reduce((a, b) => a + b, 0) / placed.length;
    }
    if (x !== undefined && !origins.has(edge.to)) origins.set(edge.to, x);
  }
  return origins;
}

/**
 * Couples de deux : le partenaire dont la famille est à gauche passe à gauche. Sans
 * famille dessinée d'un côté, l'autre partenaire se tourne vers la sienne. Rend `true`
 * si un couple a été retourné.
 */
function orientCouples(drawn: DisplayedGraph, blocks: Block[], layout: TreeLayout): boolean {
  const origins = originsX(drawn, layout);
  let changed = false;
  for (const block of blocks) {
    const [left, right] = block.slots;
    if (block.slots.length !== 2 || left?.kind !== 'person' || right?.kind !== 'person') continue;
    const center = ((layout.persons[left.id]?.x ?? 0) + (layout.persons[right.id]?.x ?? 0)) / 2;
    const pullLeft = origins.get(left.id);
    const pullRight = origins.get(right.id);
    const swap =
      pullLeft !== undefined && pullRight !== undefined
        ? pullLeft > pullRight
        : pullLeft !== undefined
          ? pullLeft > center
          : pullRight !== undefined && pullRight < center;
    if (swap) {
      block.slots.reverse();
      changed = true;
    }
  }
  return changed;
}

/** Options d'ELK ; `ordered` : l'ordre généalogique des blocs est imposé (tree.order.ts). */
function elkOptions(metrics: LayoutMetrics, seed: number, ordered: boolean) {
  return {
    'elk.algorithm': 'layered',
    'elk.direction': 'DOWN',
    'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    // Croisements (retour de Folpe, 2026-10-13) : deux familles reliées par un couple
    // laissaient des cousins s'intercaler. Plus de passes de minimisation et des
    // échanges gloutons des deux côtés : 0 croisement sur la famille réelle, en moins
    // de temps qu'avant (65 ms contre 91 pour 112 fiches).
    'elk.layered.thoroughness': '50',
    'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
    'elk.randomSeed': String(seed),
    'elk.spacing.nodeNode': String(metrics.blockGap),
    'elk.layered.spacing.nodeNodeBetweenLayers': String(metrics.layerGap),
    'elk.separateConnectedComponents': 'true',
    'elk.padding': '[top=0,left=0,bottom=0,right=0]',
    // Familles d'un tenant (retour de Folpe, 2026-10-15) : l'ordre généalogique des
    // blocs est imposé à chaque rangée, ELK ne fait que les espacer.
    ...(ordered
      ? {
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
          'elk.layered.crossingMinimization.strategy': 'NONE',
          'elk.layered.crossingMinimization.greedySwitch.type': 'OFF',
          'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
        }
      : {}),
  };
}

/** Les blocs et leurs liens, tels qu'ELK les reçoit : ports fixes, un lien par filiation. */
function elkGraph(drawn: DisplayedGraph, blocks: Block[], metrics: LayoutMetrics) {
  const slot = metrics.nodeWidth + metrics.gap;
  const slotX = (index: number) => index * slot + metrics.nodeWidth / 2;
  const slotOf = new Map<string, { block: Block; index: number }>();
  for (const block of blocks) {
    block.slots.forEach((s, index) => {
      if (s.kind !== 'unknown') slotOf.set(s.kind === 'person' ? s.id : s.branch, { block, index });
    });
  }
  const unionSlot = new Map<string, { block: Block; x: number }>();
  for (const block of blocks) {
    for (const [unionId, [a, b]] of block.unionSlots) {
      unionSlot.set(unionId, { block, x: (slotX(a) + slotX(b)) / 2 });
    }
  }
  // Ports : sortie au bas du bloc (milieu d'union ou bulle), entrée en haut de l'enfant.
  const ports = new Map<string, ElkPort[]>(blocks.map((b) => [b.id, []]));
  const port = (block: Block, key: string, x: number, side: 'SOUTH' | 'NORTH') => {
    const id = `${block.id}:${key}`;
    const list = ports.get(block.id) ?? [];
    if (!list.some((p) => p.id === id)) {
      const y = side === 'SOUTH' ? metrics.nodeHeight : 0;
      list.push({ id, x, y, width: 0, height: 0, layoutOptions: { 'elk.port.side': side } });
    }
    return id;
  };
  const edges: ElkExtendedEdge[] = [];
  /** Un enfant, ou le repère d'une fratrie repliée (clé : son départ de branche). */
  const link = (source: { block: Block; x: number }, key: string, target: string) => {
    const child = slotOf.get(target);
    if (!child) return;
    edges.push({
      id: `lien-${edges.length}`,
      sources: [port(source.block, `sortie-${key}`, source.x, 'SOUTH')],
      targets: [port(child.block, `entree-${target}`, slotX(child.index), 'NORTH')],
    });
  };
  const partnersOf = new Map(
    drawn.unions.map((u) => [u.id, u.partnerIds.filter((p) => typeof p === 'string')]),
  );
  const fromPerson = (id: string) => {
    const at = slotOf.get(id);
    return at && { block: at.block, x: slotX(at.index) };
  };
  const linkFrom = (source: string, target: string) => {
    const union = unionSlot.get(source);
    if (union) return link(union, source, target);
    // Parent seul, ou union détachée : l'enfant tient à chacun de ses parents placés.
    for (const parentId of partnersOf.get(source) ?? [source]) {
      const from = fromPerson(parentId);
      if (from) link(from, parentId, target);
    }
  };
  for (const edge of drawn.edges) {
    // Les partenaires sont dans le bloc ; « a élevé » ne pèse pas sur les générations.
    if (edge.kind === 'child' || edge.kind === 'parent') linkFrom(edge.from, edge.to);
  }
  for (const block of blocks) {
    for (const s of block.slots) if (s.kind === 'marker') linkFrom(s.branch, s.branch);
  }
  return { slot, slotX, unionSlot, ports, edges };
}

async function placeBlocks(
  drawn: DisplayedGraph,
  blocks: Block[],
  detached: Set<string>,
  elk: ElkLike,
  { metrics, seed }: Pass,
  order: string[] | undefined,
): Promise<TreeLayout> {
  const { slot, slotX, unionSlot, ports, edges } = elkGraph(drawn, blocks, metrics);
  const rank = new Map((order ?? []).map((id, index) => [id, index]));
  const ordered = order
    ? [...blocks].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
    : blocks;
  const result = elkResultSchema.parse(
    await elk.layout({
      id: 'arbre',
      layoutOptions: elkOptions(metrics, seed, order !== undefined),
      children: ordered.map((block) => ({
        id: block.id,
        width: block.slots.length * slot - metrics.gap,
        height: metrics.nodeHeight,
        layoutOptions: { 'elk.portConstraints': 'FIXED_POS' },
        ports: ports.get(block.id) ?? [],
      })),
      edges,
    }),
  );

  const origin = new Map(result.children.map((c) => [c.id, c]));
  const at = (block: Block, x: number): Point => {
    const node = origin.get(block.id);
    if (!node) throw new Error(`Bloc sans position : ${block.id}`);
    return { x: node.x + x, y: node.y + metrics.bubble / 2 };
  };
  const layout: TreeLayout = {
    ...emptyLayout(),
    detachedUnions: [...detached].sort(),
    width: result.width,
    height: result.height,
  };
  for (const block of blocks) {
    block.slots.forEach((s, index) => {
      const point = at(block, slotX(index));
      if (s.kind === 'person') layout.persons[s.id] = point;
      else if (s.kind === 'unknown') layout.unknownPartners[s.unionId] = point;
      else layout.markers[s.branch] = point;
    });
  }
  for (const [unionId, { block, x }] of unionSlot) layout.unions[unionId] = at(block, x);
  return layout;
}
