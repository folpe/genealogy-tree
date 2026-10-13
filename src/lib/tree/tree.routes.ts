import type { DisplayedEdge, DisplayedGraph } from '../../server/family/family.display';
import type { ParentChildKind } from '../../server/family/family.types';
import type { TreeLayout } from './tree.layout';
import { DEFAULT_METRICS, type LayoutMetrics, type Point } from './tree.metrics';

// Tracé des liens (DESIGN.md, section 7) : une union est un simple trait horizontal
// entre deux bulles ; un enfant part du milieu de ce trait ; un enfant d'une union
// passée part de son parent, sous l'étiquette de sa bulle. Les courbes sont des Bézier dont
// les poignées sont verticales, à mi-hauteur entre les deux bouts.

export type TreeLink = {
  id: string;
  kind: 'union' | Exclude<DisplayedEdge['kind'], 'partner'>;
  /** Chemin SVG. */
  d: string;
  filiation?: ParentChildKind;
  /** Branche d'un parent seul : la personne d'où elle part, sous son étiquette. */
  parentId?: string;
};

/** Bézier aux poignées verticales, de `from` (point courant du tracé) à `to`. */
const bezier = (from: Point, to: Point) => {
  const middle = (from.y + to.y) / 2;
  return `C${from.x},${middle} ${to.x},${middle} ${to.x},${to.y}`;
};
const curve = (from: Point, to: Point) => `M${from.x},${from.y} ${bezier(from, to)}`;

export function routeLinks(
  drawn: DisplayedGraph,
  layout: TreeLayout,
  metrics: LayoutMetrics = DEFAULT_METRICS,
): TreeLink[] {
  const r = metrics.bubble / 2;
  // Une branche qui part d'une personne commence sous son prénom et ses années :
  // partie du bas de la bulle, elle barrerait l'étiquette.
  const below = metrics.nodeHeight - r;
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

  // Un couple remarié dont les deux unions sont détachées donnerait deux fois la
  // même branche : une seule suffit, et l'identifiant sert de clé au rendu.
  const branches = new Set<string>();
  const branch = (from: string, to: string, filiation?: ParentChildKind) => {
    const parent = layout.persons[from];
    const child = layout.persons[to];
    const id = `parent:${from}>${to}`;
    if (!parent || !child || branches.has(id)) return;
    branches.add(id);
    links.push({
      id,
      kind: 'parent',
      d: curve({ x: parent.x, y: parent.y + below }, { x: child.x, y: child.y - r }),
      ...(filiation ? { filiation } : {}),
      parentId: from,
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
    // Depuis une union, le trait descend d'abord droit entre les étiquettes du couple.
    const from = { x: parent.x, y: parent.y + below };
    const to = { x: child.x, y: child.y - r };
    links.push({
      id: `${edge.kind}:${edge.from}>${edge.to}`,
      kind: edge.kind,
      d:
        edge.kind === 'child'
          ? `M${parent.x},${parent.y} L${from.x},${from.y} ${bezier(from, to)}`
          : curve(from, to),
      ...(edge.filiation ? { filiation: edge.filiation } : {}),
    });
  }
  return links;
}
