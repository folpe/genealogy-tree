import { describe, expect, it } from 'vitest';
import type { DisplayedGraph } from '../../server/family/family.display';
import type { TreeLayout } from './tree.layout';
import { treeNeighbors } from './tree.navigation';

// Deux grands-parents (a, b) ; leurs enfants c et d ; d avec son conjoint e ;
// f, enfant de d seul (union passée masquée) ; g, élevé par e.
const drawn: DisplayedGraph = {
  personIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  unions: [
    { id: 'u-ab', partnerIds: ['a', 'b'], past: false, unknownPartner: false },
    { id: 'u-de', partnerIds: ['d', 'e'], past: false, unknownPartner: false },
  ],
  edges: [
    { kind: 'partner', from: 'a', to: 'u-ab' },
    { kind: 'partner', from: 'b', to: 'u-ab' },
    { kind: 'child', from: 'u-ab', to: 'c' },
    { kind: 'child', from: 'u-ab', to: 'd' },
    { kind: 'partner', from: 'd', to: 'u-de' },
    { kind: 'partner', from: 'e', to: 'u-de' },
    { kind: 'parent', from: 'd', to: 'f' },
    { kind: 'raised', from: 'e', to: 'g' },
  ],
};
const at = (x: number, y: number) => ({ x, y });
const layout: TreeLayout = {
  persons: {
    a: at(100, 0),
    b: at(240, 0),
    c: at(0, 200),
    d: at(240, 200),
    e: at(380, 200),
    f: at(240, 400),
    g: at(380, 400),
  },
  unions: {},
  unknownPartners: {},
  detachedUnions: [],
  markers: {},
  width: 500,
  height: 500,
};
const neighbors = treeNeighbors(drawn, layout);

describe('treeNeighbors', () => {
  it('passe à gauche et à droite sur la même génération', () => {
    expect(neighbors['d']).toMatchObject({ left: 'c', right: 'e' });
    expect(neighbors['c']?.left).toBeUndefined();
    expect(neighbors['e']?.right).toBeUndefined();
  });

  it('monte vers le parent le plus proche, par une union comme par une branche directe', () => {
    expect(neighbors['d']?.up).toBe('b');
    expect(neighbors['c']?.up).toBe('a');
    expect(neighbors['f']?.up).toBe('d');
  });

  it('descend vers l’enfant le plus proche, y compris celui qu’on a élevé', () => {
    expect(neighbors['a']?.down).toBe('c');
    expect(neighbors['b']?.down).toBe('d');
    expect(neighbors['d']?.down).toBe('f');
    expect(neighbors['e']?.down).toBe('g');
    expect(neighbors['g']?.up).toBe('e');
  });

  it('n’invente rien au bout de l’arbre', () => {
    expect(neighbors['a']?.up).toBeUndefined();
    expect(neighbors['c']?.down).toBeUndefined();
  });

  it('range les générations du haut vers le bas', () => {
    expect(neighbors['a']?.row).toBe(0);
    expect(neighbors['d']?.row).toBe(1);
    expect(neighbors['g']?.row).toBe(2);
  });

  it('ignore une personne sans position', () => {
    const partial = treeNeighbors(drawn, { ...layout, persons: { a: at(0, 0) } });
    expect(Object.keys(partial)).toEqual(['a']);
  });
});
