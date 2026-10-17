import ELK from 'elkjs/lib/elk.bundled.js';
import { describe, expect, it } from 'vitest';
import { extendedFamily } from '../../../tests/fixtures/extended-family';
import type { DisplayedGraph } from '../../server/family/family.display';
import { selectDisplayedGraph } from '../../server/family/family.display';
import { interleavedFamilies } from './tree.families';
import { computeTreeLayout, type ElkLike, type TreeLayout } from './tree.layout';

const elk: ElkLike = new ELK();

// Une famille se lit d'un coup d'œil quand ses enfants se suivent sur leur rangée,
// seulement entrecoupés de leurs propres conjoints. Positions écrites à la main.

const drawn: DisplayedGraph = {
  personIds: ['pa', 'ma', 'a', 'b', 'c', 'x', 'sa'],
  unions: [
    { id: 'u-pm', partnerIds: ['pa', 'ma'], past: false, unknownPartner: false },
    { id: 'u-a', partnerIds: ['a', 'sa'], past: false, unknownPartner: false },
  ],
  edges: [
    { kind: 'partner', from: 'pa', to: 'u-pm' },
    { kind: 'partner', from: 'a', to: 'u-a' },
    { kind: 'partner', from: 'sa', to: 'u-a' },
    ...['a', 'b', 'c'].map((to) => ({ kind: 'child' as const, from: 'u-pm', to })),
  ],
};

const at = (x: number, y = 100) => ({ x, y });
const layoutWith = (persons: TreeLayout['persons']): TreeLayout => ({
  persons: { pa: at(0, 0), ma: at(120, 0), ...persons },
  unions: { 'u-pm': at(60, 0) },
  unknownPartners: {},
  detachedUnions: [],
  markers: {},
  width: 800,
  height: 300,
});

describe('interleavedFamilies', () => {
  it('une fratrie suivie, coupée seulement par un conjoint, se lit d’un tenant', () => {
    const layout = layoutWith({ a: at(0), sa: at(120), b: at(240), c: at(360), x: at(600) });
    expect(interleavedFamilies(drawn, layout)).toEqual([]);
  });

  it('une personne d’une autre famille glissée dans la fratrie la signale', () => {
    const layout = layoutWith({ a: at(0), sa: at(120), x: at(240), b: at(360), c: at(480) });
    expect(interleavedFamilies(drawn, layout)).toEqual(['u-pm']);
  });

  it('un enfant posé sur une autre rangée ne compte pas dans sa fratrie', () => {
    const layout = layoutWith({ a: at(0), sa: at(120), b: at(240), c: at(360, 300), x: at(300) });
    expect(interleavedFamilies(drawn, layout)).toEqual([]);
  });
});

describe('placement d’une famille élargie, « Toute la famille »', () => {
  it('aucune de nos familles ne s’intercale dans une autre', async () => {
    const drawn = selectDisplayedGraph(extendedFamily(), { focusId: 'moi' });
    const layout = await computeTreeLayout(drawn, elk, { focusId: 'moi' });
    // Seules restent coupées les familles d'origine des conjoints : le conjoint suit son
    // partenaire, ses frères et sœurs vont à l'extérieur (repliés par défaut ensuite).
    expect(interleavedFamilies(drawn, layout)).toEqual(['u-gp-c', 'u-gp-mm', 'u-gp-mt']);
  });
});
