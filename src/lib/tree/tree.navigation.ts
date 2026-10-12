import type { DisplayedGraph } from '../../server/family/family.display';
import type { TreeLayout } from './tree.layout';

// Navigation au clavier dans le canevas (DESIGN.md, section 11) : les flèches
// passent de bulle en bulle selon ce que l'œil voit. Gauche et droite suivent la
// génération ; haut et bas suivent les liens dessinés, vers la bulle la plus proche.

export type TreeNeighbors = {
  /** Rang de la génération à l'écran, 0 en haut. */
  row: number;
  left?: string;
  right?: string;
  up?: string;
  down?: string;
};

export function treeNeighbors(
  drawn: DisplayedGraph,
  layout: TreeLayout,
): Record<string, TreeNeighbors> {
  const placed = drawn.personIds.filter((id) => layout.persons[id]);
  const x = (id: string) => layout.persons[id]?.x ?? 0;
  const y = (id: string) => layout.persons[id]?.y ?? 0;

  // Liens dessinés, ramenés à des paires parent -> enfant entre personnes.
  const partnersOf = new Map(drawn.unions.map((u) => [u.id, u.partnerIds]));
  const parents = new Map<string, Set<string>>();
  const children = new Map<string, Set<string>>();
  const relate = (parent: string, child: string) => {
    if (!layout.persons[parent] || !layout.persons[child]) return;
    parents.set(child, (parents.get(child) ?? new Set()).add(parent));
    children.set(parent, (children.get(parent) ?? new Set()).add(child));
  };
  for (const edge of drawn.edges) {
    if (edge.kind === 'partner') continue;
    if (edge.kind !== 'child') {
      relate(edge.from, edge.to);
      continue;
    }
    for (const parent of partnersOf.get(edge.from) ?? []) {
      if (typeof parent === 'string') relate(parent, edge.to);
    }
  }
  const nearest = (from: string, candidates: Set<string> | undefined) =>
    [...(candidates ?? [])].sort((a, b) => Math.abs(x(a) - x(from)) - Math.abs(x(b) - x(from)))[0];

  const rows = [...new Set(placed.map(y))].sort((a, b) => a - b);
  const byRow = new Map<number, string[]>();
  for (const id of placed) byRow.set(y(id), [...(byRow.get(y(id)) ?? []), id]);
  for (const row of byRow.values()) row.sort((a, b) => x(a) - x(b));

  const result: Record<string, TreeNeighbors> = {};
  for (const id of placed) {
    const row = byRow.get(y(id)) ?? [];
    const index = row.indexOf(id);
    const up = nearest(id, parents.get(id));
    const down = nearest(id, children.get(id));
    result[id] = {
      row: rows.indexOf(y(id)),
      ...(index > 0 ? { left: row[index - 1] } : {}),
      ...(index < row.length - 1 ? { right: row[index + 1] } : {}),
      ...(up ? { up } : {}),
      ...(down ? { down } : {}),
    };
  }
  return result;
}
