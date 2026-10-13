import type { DisplayedGraph } from '../../server/family/family.display';
import type { TreeLayout } from './tree.layout';

// Mesure de lisibilité du placement : nombre de croisements entre traits de filiation
// (d'un couple ou d'un parent seul vers un enfant). Deux traits entre les mêmes lignes
// se croisent quand leurs départs et leurs arrivées sont dans l'ordre inverse.

type Segment = { x0: number; y0: number; x1: number; y1: number };

function filiationSegments(drawn: DisplayedGraph, layout: TreeLayout): Segment[] {
  const segments: Segment[] = [];
  const partners = new Map(drawn.unions.map((u) => [u.id, u.partnerIds]));
  for (const edge of drawn.edges) {
    if (edge.kind === 'partner' || edge.kind === 'raised') continue;
    const child = layout.persons[edge.to];
    if (!child) continue;
    const sources =
      edge.kind === 'child'
        ? layout.unions[edge.from]
          ? [layout.unions[edge.from]]
          : (partners.get(edge.from) ?? []).map((p) => (p ? layout.persons[p] : undefined))
        : [layout.persons[edge.from]];
    for (const source of sources) {
      if (source) segments.push({ x0: source.x, y0: source.y, x1: child.x, y1: child.y });
    }
  }
  return segments;
}

export function countCrossings(drawn: DisplayedGraph, layout: TreeLayout): number {
  const segments = filiationSegments(drawn, layout);
  let crossings = 0;
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i];
      const b = segments[j];
      if (!a || !b || a.y0 !== b.y0 || a.y1 !== b.y1) continue;
      if ((a.x0 - b.x0) * (a.x1 - b.x1) < 0) crossings += 1;
    }
  }
  return crossings;
}
