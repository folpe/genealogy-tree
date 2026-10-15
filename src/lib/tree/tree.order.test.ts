import { describe, expect, it } from 'vitest';
import { extendedFamily } from '../../../tests/fixtures/extended-family';
import { selectDisplayedGraph } from '../../server/family/family.display';
import { familyOrder } from './tree.order';

// Ordre généalogique des blocs (couples soudés) : la fratrie paternelle à gauche, la
// lignée directe à son bord intérieur, puis le couple des parents, puis la fratrie
// maternelle ; les familles d'origine des conjoints viennent après, à l'extérieur.

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

  it('les grands-parents : paternels, puis maternels, puis les familles des conjoints', () => {
    expect(increasing(ranked(['gp-p+gm-p', 'gp-m+gm-m', 'gp-mt+gm-mt']))).toBe(true);
    expect(increasing(ranked(['gp-m+gm-m', 'gp-c+gm-c']))).toBe(true);
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

  it('les familles des conjoints après la nôtre, sur chaque rangée', () => {
    const order = familyOrder(drawn, blocks, 'moi');
    const last = Math.max(...['tante-m2', 'pere+mere'].map((id) => order.indexOf(id)));
    for (const inLaw of ['frere-mt', 'soeur-mm'])
      expect(order.indexOf(inLaw)).toBeGreaterThan(last);
    expect(order.indexOf('soeur-c')).toBeGreaterThan(order.indexOf('cousin-m2'));
  });

  it('mes enfants sous mon couple, entre les cousins des deux côtés', () => {
    expect(increasing(ranked(['cousin-p3', 'moi+conjoint', 'enfant1', 'cousin-m1']))).toBe(true);
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
