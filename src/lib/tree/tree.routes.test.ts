import { describe, expect, it } from 'vitest';
import type { DisplayedGraph } from '../../server/family/family.display';
import { DEFAULT_METRICS, type TreeLayout } from './tree.layout';
import { routeLinks } from './tree.routes';

const r = DEFAULT_METRICS.bubble / 2;

// Un couple (a, b) et leur enfant c ; d, parent seul de e ; b a élevé e.
const drawn: DisplayedGraph = {
  personIds: ['a', 'b', 'c', 'd', 'e'],
  unions: [{ id: 'u', partnerIds: ['a', 'b'], past: false, unknownPartner: false }],
  edges: [
    { kind: 'partner', from: 'a', to: 'u' },
    { kind: 'partner', from: 'b', to: 'u' },
    { kind: 'child', from: 'u', to: 'c' },
    { kind: 'parent', from: 'd', to: 'e', filiation: 'adoptive' },
    { kind: 'raised', from: 'b', to: 'e' },
  ],
};
const layout: TreeLayout = {
  persons: {
    a: { x: 100, y: 50 },
    b: { x: 236, y: 50 },
    c: { x: 168, y: 300 },
    d: { x: 500, y: 50 },
    e: { x: 500, y: 300 },
  },
  unions: { u: { x: 168, y: 50 } },
  unknownPartners: {},
  width: 600,
  height: 400,
};
const links = routeLinks(drawn, layout);
const link = (id: string) => links.find((l) => l.id === id);

describe('routeLinks', () => {
  it('trace l’union en trait droit, d’un bord de bulle à l’autre', () => {
    expect(link('union:u')).toEqual({
      id: 'union:u',
      kind: 'union',
      d: `M${100 + r},50 L${236 - r},50`,
    });
  });

  it('fait partir l’enfant du milieu du trait d’union, jusqu’en haut de sa bulle', () => {
    const d = link('child:u>c')?.d ?? '';
    expect(d.startsWith('M168,50 C168,')).toBe(true);
    expect(d.endsWith(` 168,${300 - r}`)).toBe(true);
  });

  it('fait partir une branche directe du bas de la bulle du parent', () => {
    expect(link('parent:d>e')).toMatchObject({ kind: 'parent', filiation: 'adoptive' });
    const d = link('parent:d>e')?.d ?? '';
    expect(d.startsWith(`M500,${50 + r} C`)).toBe(true);
    expect(d.endsWith(` 500,${300 - r}`)).toBe(true);
  });

  it('garde « a élevé » comme lien à part, pour le pointillé', () => {
    expect(link('raised:b>e')?.kind).toBe('raised');
  });

  it('relie un parent connu à l’emplacement du parent inconnu', () => {
    const [only] = routeLinks(
      {
        personIds: ['m'],
        unions: [{ id: 'v', partnerIds: ['m', null], past: false, unknownPartner: true }],
        edges: [{ kind: 'partner', from: 'm', to: 'v' }],
      },
      {
        ...layout,
        persons: { m: { x: 100, y: 50 } },
        unions: { v: { x: 168, y: 50 } },
        unknownPartners: { v: { x: 236, y: 50 } },
      },
    );
    expect(only).toEqual({ id: 'union:v', kind: 'union', d: `M${100 + r},50 L${236 - r},50` });
  });

  it('ignore un lien dont un bout n’est pas placé', () => {
    const partial = routeLinks(drawn, { ...layout, persons: { a: { x: 0, y: 0 } } });
    expect(partial).toEqual([]);
  });
});
