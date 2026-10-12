import type { ElkExtendedEdge, ElkNode, ElkPort } from 'elkjs/lib/elk-api';
import { z } from 'zod';
import type { DisplayedGraph } from '../../server/family/family.display';

// Placement de l'arbre (plan phase 4, lot 2). ELK (algorithme `layered`) ne connaît
// pas les couples : laissé seul, il éloigne des partenaires et ajoute une couche par
// union. Chaque couple devient donc un bloc, partenaires côte à côte, et les enfants
// partent d'un port posé au milieu du trait d'union. ELK range les blocs ; ce module
// en déduit la position de chaque bulle. Prototype sur la famille réelle le
// 2026-10-12 : couples tous soudés, générations en lignes, 94 ms pour 103 fiches.

export type Point = { x: number; y: number };

export type LayoutMetrics = {
  /** Diamètre de la bulle (DESIGN.md : 76 px en desktop). */
  bubble: number;
  /** Emprise d'une personne : bulle, prénom et années dessous. */
  nodeWidth: number;
  nodeHeight: number;
  /** Écart entre deux partenaires d'un même bloc. */
  gap: number;
  /** Écart entre deux blocs d'une même génération. */
  blockGap: number;
  /** Écart vertical entre deux générations. */
  layerGap: number;
};

export const DEFAULT_METRICS: LayoutMetrics = {
  bubble: 76,
  nodeWidth: 120,
  nodeHeight: 132,
  gap: 16,
  blockGap: 40,
  layerGap: 72,
};

export type TreeLayout = {
  /** Centre de la bulle de chaque personne. */
  persons: Record<string, Point>;
  /** Milieu du trait d'union, d'où partent les enfants. */
  unions: Record<string, Point>;
  /** Emplacement « parent à découvrir » des unions à partenaire inconnu. */
  unknownPartners: Record<string, Point>;
  width: number;
  height: number;
};

/** Ce que ce module attend d'ELK : la version Web Worker comme la version « bundled ». */
export type ElkLike = { layout: (graph: ElkNode) => Promise<ElkNode> };

type Slot = { kind: 'person'; id: string } | { kind: 'unknown'; unionId: string };
type Block = { id: string; slots: Slot[]; unionSlots: Map<string, [number, number]> };

/** Couples soudés : composantes du graphe des partenaires, en chaîne. */
function buildBlocks(drawn: DisplayedGraph): Block[] {
  const partners = new Map<string, { other: string; unionId: string }[]>(
    drawn.personIds.map((id) => [id, []]),
  );
  for (const union of drawn.unions) {
    const [a, b] = union.partnerIds;
    if (typeof b !== 'string' || !partners.has(a) || !partners.has(b)) continue;
    partners.get(a)?.push({ other: b, unionId: union.id });
    partners.get(b)?.push({ other: a, unionId: union.id });
  }

  const placed = new Set<string>();
  const blocks: Block[] = [];
  for (const start of drawn.personIds) {
    if (placed.has(start)) continue;
    const component = [start];
    placed.add(start);
    for (let i = 0; i < component.length; i += 1) {
      for (const { other } of partners.get(component[i] ?? '') ?? []) {
        if (!placed.has(other)) {
          placed.add(other);
          component.push(other);
        }
      }
    }
    // Parcours de la chaîne depuis une extrémité ; un cas hors chaîne suit à la fin.
    const end = component.find((id) => (partners.get(id)?.length ?? 0) <= 1) ?? start;
    const order: string[] = [];
    for (let current: string | undefined = end; current && !order.includes(current); ) {
      order.push(current);
      current = partners.get(current)?.find((p) => !order.includes(p.other))?.other;
    }
    for (const id of component) if (!order.includes(id)) order.push(id);

    const slots: Slot[] = order.map((id) => ({ kind: 'person', id }));
    const unionSlots = new Map<string, [number, number]>();
    for (let i = 0; i + 1 < order.length; i += 1) {
      const link = partners.get(order[i] ?? '')?.find((p) => p.other === order[i + 1]);
      if (link) unionSlots.set(link.unionId, [i, i + 1]);
    }
    blocks.push({ id: `bloc-${blocks.length}`, slots, unionSlots });
  }

  // Parent inconnu : un emplacement réservé du côté libre du parent connu (à gauche
  // s'il ouvre une chaîne de plusieurs personnes, à droite sinon).
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
    if (index === 0 && block.slots.length > 1) {
      block.slots.unshift(unknown);
      for (const [id, [a, b]] of block.unionSlots) block.unionSlots.set(id, [a + 1, b + 1]);
      block.unionSlots.set(union.id, [0, 1]);
    } else {
      block.slots.push(unknown);
      block.unionSlots.set(union.id, [index, block.slots.length - 1]);
    }
  }
  return blocks;
}

const elkResultSchema = z.object({
  width: z.number(),
  height: z.number(),
  children: z.array(z.object({ id: z.string(), x: z.number(), y: z.number() })),
});

export async function computeTreeLayout(
  drawn: DisplayedGraph,
  elk: ElkLike,
  metrics: LayoutMetrics = DEFAULT_METRICS,
): Promise<TreeLayout> {
  const empty: TreeLayout = { persons: {}, unions: {}, unknownPartners: {}, width: 0, height: 0 };
  if (drawn.personIds.length === 0) return empty;

  const slot = metrics.nodeWidth + metrics.gap;
  const slotX = (index: number) => index * slot + metrics.nodeWidth / 2;
  const blocks = buildBlocks(drawn);
  const personSlot = new Map<string, { block: Block; index: number }>();
  for (const block of blocks) {
    block.slots.forEach((s, index) => {
      if (s.kind === 'person') personSlot.set(s.id, { block, index });
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
      list.push({
        id,
        x,
        y: side === 'SOUTH' ? metrics.nodeHeight : 0,
        width: 0,
        height: 0,
        layoutOptions: { 'elk.port.side': side },
      });
    }
    return id;
  };
  const edges: ElkExtendedEdge[] = [];
  for (const edge of drawn.edges) {
    // Les partenaires sont dans le bloc ; « a élevé » ne pèse pas sur les générations.
    if (edge.kind === 'partner' || edge.kind === 'raised') continue;
    const child = personSlot.get(edge.to);
    const source = edge.kind === 'child' ? unionSlot.get(edge.from) : personSlot.get(edge.from);
    if (!child || !source) continue;
    const sourceX = 'x' in source ? source.x : slotX(source.index);
    edges.push({
      id: `lien-${edges.length}`,
      sources: [port(source.block, `sortie-${edge.from}`, sourceX, 'SOUTH')],
      targets: [port(child.block, `entree-${edge.to}`, slotX(child.index), 'NORTH')],
    });
  }

  const result = elkResultSchema.parse(
    await elk.layout({
      id: 'arbre',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        'elk.spacing.nodeNode': String(metrics.blockGap),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(metrics.layerGap),
        'elk.separateConnectedComponents': 'true',
        'elk.padding': '[top=0,left=0,bottom=0,right=0]',
      },
      children: blocks.map((block) => ({
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
  const layout: TreeLayout = { ...empty, width: result.width, height: result.height };
  for (const block of blocks) {
    block.slots.forEach((s, index) => {
      if (s.kind === 'person') layout.persons[s.id] = at(block, slotX(index));
      else layout.unknownPartners[s.unionId] = at(block, slotX(index));
    });
  }
  for (const [unionId, { block, x }] of unionSlot) layout.unions[unionId] = at(block, x);
  return layout;
}
