import type { DisplayedGraph } from '../../server/family/family.display';
import type { TreeLayout } from './tree.layout';

// Mesure de lisibilité (retour de Folpe, 2026-10-15 : « les familles sont mélangées ») :
// sur sa rangée, une fratrie se suit, seulement entrecoupée des conjoints de ses
// membres. Une personne d'une autre famille glissée entre deux frères la rend illisible.

/** Fratries (clé : l'union ou le parent seul) où s'intercale quelqu'un d'une autre famille. */
export function interleavedFamilies(drawn: DisplayedGraph, layout: TreeLayout): string[] {
  const siblings = new Map<string, string[]>();
  for (const edge of drawn.edges) {
    if (edge.kind !== 'child' && edge.kind !== 'parent') continue;
    siblings.set(edge.from, [...(siblings.get(edge.from) ?? []), edge.to]);
  }
  const partnersOf = new Map<string, Set<string>>();
  for (const union of drawn.unions) {
    const [a, b] = union.partnerIds;
    if (!b) continue;
    partnersOf.set(a, (partnersOf.get(a) ?? new Set()).add(b));
    partnersOf.set(b, (partnersOf.get(b) ?? new Set()).add(a));
  }
  const rows = new Map<number, { id: string; x: number }[]>();
  for (const [id, point] of Object.entries(layout.persons)) {
    rows.set(point.y, [...(rows.get(point.y) ?? []), { id, x: point.x }]);
  }

  const intruded: string[] = [];
  for (const [key, children] of siblings) {
    for (const row of rows.values()) {
      const members = new Set(children.filter((id) => row.some((p) => p.id === id)));
      if (members.size < 2) continue;
      const xs = row.filter((p) => members.has(p.id)).map((p) => p.x);
      const [from, to] = [Math.min(...xs), Math.max(...xs)];
      const allowed = new Set([...members].flatMap((id) => [id, ...(partnersOf.get(id) ?? [])]));
      if (row.some((p) => p.x > from && p.x < to && !allowed.has(p.id))) {
        intruded.push(key);
        break;
      }
    }
  }
  return intruded.sort();
}
