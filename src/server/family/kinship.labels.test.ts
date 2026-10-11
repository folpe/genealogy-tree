import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson, emptyGraph } from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { buildFamilyIndex, type FamilyIndex } from './family.helper';
import type { FamilyGraph } from './family.types';
import { relationship } from './kinship.helper';
import { describeDegree, describeRelationship } from './kinship.labels';

const index = buildFamilyIndex(marchandFamily);
const label = (from: string, to: string, idx: FamilyIndex = index) =>
  describeRelationship(idx, relationship(idx, from, to), to);

describe('libellés depuis Hugo (maquettes)', () => {
  it.each([
    ['hugo', 'toi'],
    ['luc', 'ton père'],
    ['sophie', 'ta mère'],
    ['lea', 'ta sœur'],
    ['maxime', 'ton demi-frère'],
    ['paul', 'ton grand-père'],
    ['jeanne', 'ta grand-mère'],
    ['bernard', 'ton grand-père'],
    ['henri', 'ton arrière-grand-père'],
    ['louise', 'ton arrière-grand-mère'],
    ['emile', 'ton arrière-grand-père'],
    ['anne', 'ta tante'],
    ['claude', 'ton grand-oncle'],
    ['marie', 'ta grand-tante'],
    ['jacques', 'ton grand-oncle par alliance'],
    ['isabelle', 'la cousine germaine de ton père'],
    ['jade', 'ta nièce'],
    ['tom', 'ton cousin germain'],
    ['claire', 'l’ancienne compagne de ton père'],
  ])('%s : « %s »', (to, expected) => {
    expect(label('hugo', to)).toBe(expected);
  });
});

describe('libellés depuis Isabelle (maquettes)', () => {
  it.each([
    ['marie', 'ta mère'],
    ['jacques', 'ton père'],
    ['henri', 'ton grand-père'],
    ['paul', 'ton oncle'],
    ['claude', 'ton oncle'],
    ['jeanne', 'ta tante par alliance'],
    ['anne', 'ta cousine germaine'],
    ['luc', 'ton cousin germain'],
    ['sophie', 'l’épouse de ton cousin Luc'],
    ['hugo', 'ton petit-cousin'],
    ['lea', 'ta petite-cousine'],
    ['maxime', 'ton petit-cousin'],
    ['jade', 'l’arrière-petite-nièce de ta mère'],
    ['emile', 'un parent par alliance'],
  ])('%s : « %s »', (to, expected) => {
    expect(label('isabelle', to)).toBe(expected);
  });
});

describe('alliance et familles recomposées', () => {
  it.each([
    ['luc', 'sophie', 'ta femme'],
    ['sophie', 'luc', 'ton mari'],
    ['luc', 'claire', 'ton ancienne compagne'],
    ['maxime', 'sophie', 'ta belle-mère'],
    ['sophie', 'maxime', 'ton beau-fils'],
    ['sophie', 'paul', 'ton beau-père'],
    ['sophie', 'anne', 'ta belle-sœur'],
    ['paul', 'sophie', 'ta belle-fille'],
    ['anne', 'sophie', 'ta belle-sœur'],
    ['jeanne', 'tom', 'ton petit-fils'],
    ['marie', 'jacques', 'ton mari'],
  ])('%s -> %s : « %s »', (from, to, expected) => {
    expect(label(from, to)).toBe(expected);
  });
});

describe('genre inconnu', () => {
  const graph: FamilyGraph = {
    ...emptyGraph([aPerson('p'), aPerson('e', { gender: 'femme' }), aPerson('s')]),
    parentChildren: [aChildOf('p', 'e'), aChildOf('p', 's')],
  };
  const idx = buildFamilyIndex(graph);

  it('reste neutre', () => {
    expect(label('e', 'p', idx)).toBe('ton parent');
    expect(label('p', 's', idx)).toBe('ton enfant');
    expect(label('e', 's', idx)).toBe('ton frère ou ta sœur');
  });
});

describe('parenté lointaine', () => {
  // Deux lignées de quatre générations sous un même couple.
  const chain = (prefix: string, length: number) =>
    Array.from({ length }, (_, i) => aPerson(`${prefix}${i + 1}`, { gender: 'homme' }));
  const left = chain('l', 4);
  const right = chain('r', 4);
  const graph: FamilyGraph = {
    ...emptyGraph([
      aPerson('a', { firstName: 'Auguste', gender: 'homme' }),
      aPerson('b', { firstName: 'Berthe', gender: 'femme' }),
      ...left,
      ...right,
    ]),
    unions: [anUnion('u', 'a', 'b')],
    parentChildren: [
      aChildOf('a', 'l1', { unionId: 'u' }),
      aChildOf('b', 'l1', { unionId: 'u' }),
      aChildOf('a', 'r1', { unionId: 'u' }),
      aChildOf('b', 'r1', { unionId: 'u' }),
      aChildOf('l1', 'l2'),
      aChildOf('l2', 'l3'),
      aChildOf('l3', 'l4'),
      aChildOf('r1', 'r2'),
      aChildOf('r2', 'r3'),
      aChildOf('r3', 'r4'),
    ],
  };
  const idx = buildFamilyIndex(graph);

  it('nomme le cousin issu de germain', () => {
    expect(label('l3', 'r3', idx)).toBe('ton cousin issu de germain');
  });

  it('passe à une formule générique au-delà de la profondeur maîtrisée', () => {
    expect(label('l4', 'r4', idx)).toBe('parent au 8e degré, par Auguste et Berthe');
  });

  it('nomme une ascendance lointaine sans se tromper', () => {
    expect(label('l4', 'a', idx)).toBe('ton arrière-arrière-grand-père');
    expect(label('a', 'l4', idx)).toBe('ton arrière-arrière-petit-fils');
  });

  it('dit quand il n’y a aucun lien', () => {
    expect(
      label('l4', 'x', buildFamilyIndex({ ...graph, persons: [...graph.persons, aPerson('x')] })),
    ).toBe('aucun lien connu');
  });
});

describe('describeDegree', () => {
  it.each([
    ['hugo', 'luc', 'Parenté au 1er degré'],
    ['hugo', 'isabelle', 'Parenté au 5e degré'],
    ['hugo', 'jacques', 'Parenté par alliance'],
    ['hugo', 'hugo', ''],
  ])('%s -> %s : « %s »', (from, to, expected) => {
    expect(describeDegree(relationship(index, from, to))).toBe(expected);
  });
});

describe('couverture des cas rares', () => {
  // Arbre synthétique : aïeux a+b, lignées de quatre générations, conjoints variés.
  const people = [
    aPerson('a', { firstName: 'Auguste', gender: 'homme' }),
    aPerson('b', { firstName: 'Berthe', gender: 'femme' }),
    aPerson('f1', { gender: 'femme' }),
    aPerson('f2', { gender: 'femme' }),
    aPerson('f3', { gender: 'femme' }),
    aPerson('f4', { gender: 'femme' }),
    aPerson('g1', { gender: 'homme' }),
    aPerson('g2', { gender: 'inconnu' }),
    aPerson('g3', { gender: 'femme' }),
    aPerson('ex', { gender: 'homme' }),
    aPerson('epouse', { gender: 'femme' }),
    aPerson('tante-epouse', { gender: 'femme' }),
    aPerson('grand-mere-epouse', { gender: 'femme' }),
    aPerson('mere-epouse', { gender: 'femme' }),
  ];
  const graph: FamilyGraph = {
    ...emptyGraph(people),
    unions: [
      anUnion('u-ab', 'a', 'b'),
      anUnion('u-ex', 'f1', 'ex', { end: { reason: 'divorce' } }),
      anUnion('u-ep', 'g1', 'epouse', { kind: 'pacs' }),
    ],
    parentChildren: [
      aChildOf('a', 'f1', { unionId: 'u-ab' }),
      aChildOf('b', 'f1', { unionId: 'u-ab' }),
      aChildOf('a', 'g1', { unionId: 'u-ab' }),
      aChildOf('b', 'g1', { unionId: 'u-ab' }),
      aChildOf('f1', 'f2'),
      aChildOf('f2', 'f3'),
      aChildOf('f3', 'f4'),
      aChildOf('g1', 'g2'),
      aChildOf('g2', 'g3'),
      aChildOf('grand-mere-epouse', 'mere-epouse'),
      aChildOf('grand-mere-epouse', 'tante-epouse'),
      aChildOf('mere-epouse', 'epouse'),
    ],
  };
  const idx = buildFamilyIndex(graph);

  it.each([
    ['g1', 'f3', 'ta petite-nièce'],
    ['g1', 'f4', 'ton arrière-petite-nièce'],
    ['f4', 'g1', 'ton arrière-grand-oncle'],
    ['f3', 'g3', 'ta cousine issue de germain'],
    ['f3', 'g2', 'le cousin germain ou la cousine germaine de ta mère'],
    ['f2', 'g2', 'ton cousin germain ou ta cousine germaine'],
    ['g3', 'f1', 'ta grand-tante'],
    ['f1', 'ex', 'ton ex-mari'],
    ['ex', 'f1', 'ton ex-femme'],
    ['g1', 'epouse', 'ta compagne'],
    ['g1', 'mere-epouse', 'ta belle-mère'],
    ['g1', 'tante-epouse', 'la tante de ta compagne'],
    ['g1', 'grand-mere-epouse', 'la grand-mère de ta compagne'],
    ['f2', 'ex', 'l’ex-mari de ta mère'],
    ['g2', 'epouse', 'ta belle-mère'],
    ['f2', 'epouse', 'ta tante par alliance'],
    ['g3', 'g2', 'ton parent'],
  ])('%s -> %s : « %s »', (from, to, expected) => {
    expect(label(from, to, idx)).toBe(expected);
  });
});
