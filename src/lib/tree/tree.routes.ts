import type { DisplayedEdge, DisplayedGraph } from '../../server/family/family.display';
import type { ParentChildKind } from '../../server/family/family.types';
import { DEFAULT_METRICS, type LayoutMetrics, type Point, type TreeLayout } from './tree.layout';

// Tracé des liens (DESIGN.md, section 7) : une union est un simple trait horizontal
// entre deux bulles ; un enfant part du milieu de ce trait ; un enfant d'une union
// passée part du bas de la bulle de son parent. Les courbes sont des Bézier dont
// les poignées sont verticales, à mi-hauteur entre les deux bouts.

export type TreeLink = {
  id: string;
  kind: 'union' | Exclude<DisplayedEdge['kind'], 'partner'>;
  /** Chemin SVG. */
  d: string;
  filiation?: ParentChildKind;
};

const curve = (from: Point, to: Point) => {
  const middle = (from.y + to.y) / 2;
  return `M${from.x},${from.y} C${from.x},${middle} ${to.x},${middle} ${to.x},${to.y}`;
};

export function routeLinks(
  drawn: DisplayedGraph,
  layout: TreeLayout,
  metrics: LayoutMetrics = DEFAULT_METRICS,
): TreeLink[] {
  const r = metrics.bubble / 2;
  const links: TreeLink[] = [];

  const detached = new Set(layout.detachedUnions);
  const partnersOf = new Map(drawn.unions.map((u) => [u.id, u.partnerIds]));
  for (const union of drawn.unions) {
    const [a, b] = union.partnerIds;
    const first = layout.persons[a];
    const second = typeof b === 'string' ? layout.persons[b] : layout.unknownPartners[union.id];
    if (!first || !second) continue;
    const [left, right] = first.x <= second.x ? [first, second] : [second, first];
    // Une union détachée passe en arc au-dessus des bulles qui la séparent.
    const d = detached.has(union.id)
      ? `M${left.x},${left.y - r} C${left.x},${left.y - r * 3} ${right.x},${right.y - r * 3} ${right.x},${right.y - r}`
      : `M${left.x + r},${left.y} L${right.x - r},${right.y}`;
    links.push({ id: `union:${union.id}`, kind: 'union', d });
  }

  const branch = (from: string, to: string, filiation?: ParentChildKind) => {
    const parent = layout.persons[from];
    const child = layout.persons[to];
    if (!parent || !child) return;
    links.push({
      id: `parent:${from}>${to}`,
      kind: 'parent',
      d: curve({ x: parent.x, y: parent.y + r }, { x: child.x, y: child.y - r }),
      ...(filiation ? { filiation } : {}),
    });
  };

  for (const edge of drawn.edges) {
    if (edge.kind === 'partner') continue;
    if (edge.kind === 'parent') {
      branch(edge.from, edge.to, edge.filiation);
      continue;
    }
    if (edge.kind === 'child' && detached.has(edge.from)) {
      for (const parentId of partnersOf.get(edge.from) ?? []) {
        if (typeof parentId === 'string') branch(parentId, edge.to, edge.filiation);
      }
      continue;
    }
    const child = layout.persons[edge.to];
    const parent = edge.kind === 'child' ? layout.unions[edge.from] : layout.persons[edge.from];
    if (!child || !parent) continue;
    const from = edge.kind === 'child' ? parent : { x: parent.x, y: parent.y + r };
    links.push({
      id: `${edge.kind}:${edge.from}>${edge.to}`,
      kind: edge.kind,
      d: curve(from, { x: child.x, y: child.y - r }),
      ...(edge.filiation ? { filiation: edge.filiation } : {}),
    });
  }
  return links;
}
