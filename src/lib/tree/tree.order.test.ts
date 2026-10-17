import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson, yearOnly } from '../../../tests/fixtures/builders';
import { extendedFamily } from '../../../tests/fixtures/extended-family';
import { selectDisplayedGraph } from '../../server/family/family.display';
import { arrangeFamilies } from './tree.order';

const familyOrder = (...args: Parameters<typeof arrangeFamilies>) => arrangeFamilies(...args).order;

// Ordre généalogique des blocs (couples soudés) : la fratrie paternelle à gauche, la
// lignée directe à son bord intérieur, puis le couple des parents, puis la fratrie
// maternelle ; les familles d'origine des conjoints à l'extérieur, du côté du conjoint.
// L'ordre ne vaut qu'entre blocs d'une même rangée : chaque attente compare une rangée.

const drawn = selectDisplayedGraph(extendedFamily(), { focusId: 'moi' });

/** Blocs de la famille élargie, tels que les soude le placement (partenaires voisins). */
const blocks = [
  ['gp-p', 'gm-p'],
  ['gp-m', 'gm-m'],
  ['gp-mt', 'gm-mt'],
  ['gp-mm', 'gm-mm'],
  ['gp-c', 'gm-c'],
  ['oncle-p', 'epouse-oncle-p'],
  ['pere', 'mere'],
  ['tante-p', 'mari-tante-p'],
  ['frere-mt'],
  ['tante-m1', 'mari-tm1'],
  ['tante-m2'],
  ['soeur-mm'],
  ['moi', 'conjoint'],
  ['soeur'],
  ['soeur-c'],
  ['cousin-p1'],
  ['cousin-p2'],
  ['cousin-p3'],
  ['cousin-m1'],
  ['cousin-m2'],
  ['enfant1'],
  ['enfant2'],
].map((persons) => ({ id: persons.join('+'), persons }));

const ranked = (ids: string[]) => {
  const order = familyOrder(drawn, blocks, 'moi');
  return ids.map((id) => order.indexOf(id));
};
const increasing = (ranks: number[]) => ranks.every((r, i) => i === 0 || (ranks[i - 1] ?? 0) < r);

describe('familyOrder', () => {
  it('range chaque bloc une fois', () => {
    const order = familyOrder(drawn, blocks, 'moi');
    expect([...order].sort()).toEqual(blocks.map((b) => b.id).sort());
  });

  it('les grands-parents : paternels, puis maternels, les familles des conjoints autour', () => {
    // Le mari de la tante paternelle est à gauche : ses parents, au bord gauche.
    // Celui de la tante maternelle, à droite : ses parents, au bord droit.
    expect(increasing(ranked(['gp-mt+gm-mt', 'gp-p+gm-p', 'gp-m+gm-m', 'gp-mm+gm-mm']))).toBe(true);
  });

  it('les parents entre les deux fratries, chaque fratrie d’un tenant', () => {
    const order = ranked([
      'oncle-p+epouse-oncle-p',
      'tante-p+mari-tante-p',
      'pere+mere',
      'tante-m1+mari-tm1',
      'tante-m2',
    ]);
    expect(increasing(order)).toBe(true);
  });

  it('les familles des conjoints à l’extérieur de la nôtre, du côté de leur conjoint', () => {
    const order = familyOrder(drawn, blocks, 'moi');
    // À gauche : barrer toute la rangée pour rejoindre la droite croiserait chaque trait.
    expect(order.indexOf('frere-mt')).toBeLessThan(order.indexOf('oncle-p+epouse-oncle-p'));
    const last = Math.max(...['tante-m2', 'pere+mere'].map((id) => order.indexOf(id)));
    expect(order.indexOf('soeur-mm')).toBeGreaterThan(last);
    expect(order.indexOf('gp-c+gm-c')).toBeGreaterThan(order.indexOf('tante-m2'));
    expect(order.indexOf('soeur-c')).toBeGreaterThan(order.indexOf('cousin-m2'));
  });

  it('mon couple entre les cousins des deux côtés', () => {
    expect(increasing(ranked(['cousin-p3', 'moi+conjoint', 'cousin-m1']))).toBe(true);
  });
});

describe('familyOrder sur des remariages croisés', () => {
  it('deux blocs chacun l’origine de l’autre : l’ordre se termine, chaque bloc une fois', () => {
    // « Grand-père de soi-même » : N épouse la veuve W, F (père de N) épouse D (fille de W).
    const crossed = {
      personIds: ['n', 'w', 'f', 'd'],
      unions: [
        {
          id: 'u-nw',
          partnerIds: ['n', 'w'] as [string, string],
          past: false,
          unknownPartner: false,
        },
        {
          id: 'u-fd',
          partnerIds: ['f', 'd'] as [string, string],
          past: false,
          unknownPartner: false,
        },
      ],
      edges: [
        { kind: 'parent' as const, from: 'f', to: 'n' },
        { kind: 'parent' as const, from: 'w', to: 'd' },
      ],
    };
    const crossedBlocks = [
      { id: 'n+w', persons: ['n', 'w'] },
      { id: 'f+d', persons: ['f', 'd'] },
    ];
    // Atteints sans personne au centre : par la boucle finale.
    expect([...familyOrder(crossed, crossedBlocks, undefined)].sort()).toEqual(['f+d', 'n+w']);
    expect([...familyOrder(crossed, crossedBlocks, 'w')].sort()).toEqual(['f+d', 'n+w']);
  });
});

describe('familyOrder sur des familles de conjoints imbriquées', () => {
  it('la famille venue d’une famille du bord gauche se range encore à l’extérieur', () => {
    // Le frère du mari de la tante paternelle épouse quelqu'un venu avec ses parents.
    const g = extendedFamily();
    g.persons.push(aPerson('epouse-fmt'), aPerson('gp-e'), aPerson('gm-e'));
    g.unions.push(anUnion('u-fmt', 'frere-mt', 'epouse-fmt'), anUnion('u-gp-e', 'gp-e', 'gm-e'));
    g.parentChildren.push(
      aChildOf('gp-e', 'epouse-fmt', { unionId: 'u-gp-e' }),
      aChildOf('gm-e', 'epouse-fmt', { unionId: 'u-gp-e' }),
    );
    const nested = [
      ...blocks.filter((b) => b.id !== 'frere-mt'),
      { id: 'frere-mt+epouse-fmt', persons: ['frere-mt', 'epouse-fmt'] },
      { id: 'gp-e+gm-e', persons: ['gp-e', 'gm-e'] },
    ];
    const order = familyOrder(selectDisplayedGraph(g, { focusId: 'moi' }), nested, 'moi');
    const at = (ids: string[]) => ids.map((id) => order.indexOf(id));
    expect(increasing(at(['gp-e+gm-e', 'gp-mt+gm-mt', 'gp-p+gm-p']))).toBe(true);
    expect([...order].sort()).toEqual(nested.map((b) => b.id).sort());
  });
});

describe('familyOrder et l’ordre de naissance', () => {
  // Le père est l'aîné de sa fratrie ; « moi » a une sœur aînée et un frère cadet.
  const born = (id: string, year: number) => aPerson(id, { birth: { date: yearOnly(year) } });
  const g = extendedFamily();
  const dated = new Map([
    ['pere', 1950],
    ['oncle-p', 1955],
    ['tante-p', 1958],
    ['soeur', 1975],
    ['moi', 1980],
    ['frere', 1984],
  ]);
  g.persons = g.persons.map((p) => {
    const year = dated.get(p.id);
    return year ? born(p.id, year) : p;
  });
  g.persons.push(born('frere', 1984));
  g.parentChildren.push(
    aChildOf('pere', 'frere', { unionId: 'u-parents' }),
    aChildOf('mere', 'frere', { unionId: 'u-parents' }),
  );
  const withBrother = [...blocks, { id: 'frere', persons: ['frere'] }];
  const order = familyOrder(selectDisplayedGraph(g, { focusId: 'moi' }), withBrother, 'moi');
  const at = (ids: string[]) => ids.map((id) => order.indexOf(id));

  it('mon conjoint vient avec sa famille : je reste au bord, de son côté', () => {
    expect(increasing(at(['soeur', 'frere', 'moi+conjoint', 'soeur-c']))).toBe(true);
  });

  it('sinon, ma fratrie dans l’ordre de naissance, l’aînée à gauche', () => {
    const alone = {
      ...g,
      parentChildren: g.parentChildren.filter((l) => l.childId !== 'conjoint'),
    };
    const drawnAlone = selectDisplayedGraph(alone, { focusId: 'moi' });
    const ranks = familyOrder(drawnAlone, withBrother, 'moi');
    const of = (ids: string[]) => ids.map((id) => ranks.indexOf(id));
    expect(increasing(of(['soeur', 'moi+conjoint', 'frere']))).toBe(true);
  });

  it('un ancêtre direct reste au bord intérieur, même aîné', () => {
    expect(increasing(at(['oncle-p+epouse-oncle-p', 'tante-p+mari-tante-p', 'pere+mere']))).toBe(
      true,
    );
  });
});

describe('arrangeFamilies, côté de chaque collatéral', () => {
  it('chaque frère et sœur de la lignée, du côté où sa fratrie le range', () => {
    const { sides } = arrangeFamilies(drawn, blocks, 'moi');
    // Le père, à gauche de la mère : sa fratrie à gauche ; celle de la mère, à droite.
    expect(sides.get('oncle-p')).toBe('left');
    expect(sides.get('tante-p')).toBe('left');
    expect(sides.get('tante-m1')).toBe('right');
    expect(sides.get('tante-m2')).toBe('right');
    // Mon conjoint vient avec sa famille, à ma droite : ma sœur à gauche, la sienne à droite.
    expect(sides.get('soeur')).toBe('left');
    expect(sides.get('soeur-c')).toBe('right');
    expect(sides.has('moi')).toBe(false);
  });
});
