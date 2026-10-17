import { describe, expect, it } from 'vitest';
import type { DisplayedGraph } from '../../server/family/family.display';
import type { TreeLayout } from './tree.layout';
import { DEFAULT_METRICS } from './tree.metrics';
import { routeLinks } from './tree.routes';

const r = DEFAULT_METRICS.bubble / 2;
/** Bas de l'emprise d'une personne, sous le prénom et les années. */
const below = DEFAULT_METRICS.nodeHeight - r;

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
  detachedUnions: [],
  markers: {},
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
    // Descente droite entre les deux étiquettes du couple, puis la courbe.
    expect(d.startsWith(`M168,50 L168,${50 + below} C168,`)).toBe(true);
    expect(d.endsWith(` 168,${300 - r}`)).toBe(true);
  });

  it('fait partir une branche directe sous l’étiquette du parent, sans la barrer', () => {
    expect(link('parent:d>e')).toMatchObject({
      kind: 'parent',
      filiation: 'adoptive',
      parentId: 'd',
    });
    const d = link('parent:d>e')?.d ?? '';
    expect(d.startsWith(`M500,${50 + below} C`)).toBe(true);
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

  it('union détachée : arc au-dessus des bulles, enfant rattaché à chaque parent', () => {
    const links = routeLinks(
      {
        personIds: ['a', 'd', 'f'],
        unions: [{ id: 'w', partnerIds: ['a', 'd'], past: true, unknownPartner: false }],
        edges: [
          { kind: 'partner', from: 'a', to: 'w' },
          { kind: 'partner', from: 'd', to: 'w' },
          { kind: 'child', from: 'w', to: 'f' },
        ],
      },
      {
        ...layout,
        persons: { a: { x: 100, y: 50 }, d: { x: 500, y: 50 }, f: { x: 300, y: 300 } },
        unions: {},
        detachedUnions: ['w'],
      },
    );
    const arc = links.find((l) => l.id === 'union:w');
    expect(arc?.d.startsWith(`M100,${50 - r} C`)).toBe(true);
    expect(arc?.d.endsWith(` 500,${50 - r}`)).toBe(true);
    expect(links.filter((l) => l.kind === 'parent').map((l) => l.id)).toEqual([
      'parent:a>f',
      'parent:d>f',
    ]);
  });

  it('ne trace qu’une fois la branche d’un parent vers un enfant', () => {
    // Deux unions détachées du même couple (remariage) : la même branche a > f.
    const links = routeLinks(
      {
        personIds: ['a', 'd', 'f'],
        unions: [
          { id: 'w1', partnerIds: ['a', 'd'], past: true, unknownPartner: false },
          { id: 'w2', partnerIds: ['a', 'd'], past: false, unknownPartner: false },
        ],
        edges: [
          { kind: 'child', from: 'w1', to: 'f' },
          { kind: 'child', from: 'w2', to: 'f' },
        ],
      },
      {
        ...layout,
        persons: { a: { x: 100, y: 50 }, d: { x: 500, y: 50 }, f: { x: 300, y: 300 } },
        unions: {},
        detachedUnions: ['w1', 'w2'],
      },
    );
    const ids = links.map((l) => l.id);
    expect(ids).toEqual([...new Set(ids)]);
    expect(ids.filter((id) => id.startsWith('parent:'))).toEqual(['parent:a>f', 'parent:d>f']);
  });

  it('ignore un lien dont un bout n’est pas placé', () => {
    const partial = routeLinks(drawn, { ...layout, persons: { a: { x: 0, y: 0 } } });
    expect(partial).toEqual([]);
  });
});
