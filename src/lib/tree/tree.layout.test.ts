import ELK from 'elkjs/lib/elk.bundled.js';
import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson } from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { selectDisplayedGraph } from '../../server/family/family.display';
import { computeTreeLayout, type ElkLike } from './tree.layout';
import { DEFAULT_METRICS } from './tree.metrics';

// ELK tourne ici dans le thread de test (version « bundled ») ; dans l'app, il tourne
// dans un Web Worker. Le module ne voit que l'interface `ElkLike`.
const elk: ElkLike = new ELK();
const { nodeWidth, nodeHeight, gap, layerGap } = DEFAULT_METRICS;
const SLOT = nodeWidth + gap;

const marchand = selectDisplayedGraph(marchandFamily, { focusId: 'hugo' });

describe('computeTreeLayout', () => {
  it('place chaque personne et chaque union dessinées', async () => {
    const layout = await computeTreeLayout(marchand, elk);
    expect(Object.keys(layout.persons).sort()).toEqual([...marchand.personIds].sort());
    expect(Object.keys(layout.unions).sort()).toEqual(marchand.unions.map((u) => u.id).sort());
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('met les partenaires côte à côte, l’union au milieu du trait', async () => {
    const { persons, unions } = await computeTreeLayout(marchand, elk);
    for (const union of marchand.unions) {
      const [a, b] = union.partnerIds;
      if (!b) continue;
      const pa = persons[a];
      const pb = persons[b];
      expect(pa?.y).toBe(pb?.y);
      expect(Math.abs((pa?.x ?? 0) - (pb?.x ?? 0))).toBe(SLOT);
      expect(unions[union.id]).toEqual({ x: ((pa?.x ?? 0) + (pb?.x ?? 0)) / 2, y: pa?.y });
    }
  });

  it('range les générations en lignes, enfants sous leurs parents', async () => {
    const { persons } = await computeTreeLayout(marchand, elk);
    const y = (id: string) => persons[id]?.y ?? Number.NaN;
    expect(y('hugo')).toBe(y('lea'));
    expect(y('maxime')).toBe(y('hugo'));
    expect(y('luc') - y('paul')).toBe(nodeHeight + layerGap);
    expect(y('hugo') - y('luc')).toBe(nodeHeight + layerGap);
  });

  it('ne fait jamais se chevaucher deux bulles', async () => {
    const points = Object.values((await computeTreeLayout(marchand, elk)).persons);
    for (const [i, a] of points.entries()) {
      for (const b of points.slice(i + 1)) {
        if (a.y === b.y) expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(nodeWidth);
      }
    }
  });

  it('réserve la place du parent inconnu à côté du parent connu', async () => {
    const drawn = selectDisplayedGraph(
      {
        persons: [aPerson('mere'), aPerson('enfant')],
        unions: [anUnion('u-mere', 'mere', null)],
        parentChildren: [aChildOf('mere', 'enfant', { unionId: 'u-mere' })],
      },
      { focusId: 'enfant' },
    );
    const layout = await computeTreeLayout(drawn, elk);
    const mere = layout.persons['mere'];
    expect(layout.unknownPartners['u-mere']).toEqual({ x: (mere?.x ?? 0) + SLOT, y: mere?.y });
    expect(layout.unions['u-mere']?.x).toBe((mere?.x ?? 0) + SLOT / 2);
  });

  it('pose le parent inconnu du côté libre quand la personne a aussi un conjoint', async () => {
    const drawn = selectDisplayedGraph(
      {
        persons: [aPerson('pere'), aPerson('femme'), aPerson('aine')],
        unions: [anUnion('u-couple', 'pere', 'femme'), anUnion('u-inconnu', 'pere', null)],
        parentChildren: [aChildOf('pere', 'aine', { unionId: 'u-inconnu' })],
      },
      { focusId: 'aine' },
    );
    const { persons, unknownPartners, unions } = await computeTreeLayout(drawn, elk);
    const pere = persons['pere']?.x ?? 0;
    const femme = persons['femme']?.x ?? 0;
    const inconnu = unknownPartners['u-inconnu']?.x ?? 0;
    expect(Math.abs(pere - femme)).toBe(SLOT);
    expect(Math.abs(pere - inconnu)).toBe(SLOT);
    expect(Math.sign(inconnu - pere)).toBe(-Math.sign(femme - pere));
    expect(unions['u-inconnu']?.x).toBe((pere + inconnu) / 2);
  });

  it('remariage : deux unions du même couple partagent un même point', async () => {
    const drawn = selectDisplayedGraph(
      {
        persons: [aPerson('a'), aPerson('b'), aPerson('c1'), aPerson('c2')],
        unions: [anUnion('u1', 'a', 'b', { end: { reason: 'divorce' } }), anUnion('u2', 'a', 'b')],
        parentChildren: [
          aChildOf('a', 'c1', { unionId: 'u1' }),
          aChildOf('b', 'c1', { unionId: 'u1' }),
          aChildOf('a', 'c2', { unionId: 'u2' }),
          aChildOf('b', 'c2', { unionId: 'u2' }),
        ],
      },
      { focusId: 'c1', showPastUnions: true },
    );
    const { unions, persons } = await computeTreeLayout(drawn, elk);
    expect(unions['u1']).toBeDefined();
    expect(unions['u1']).toEqual(unions['u2']);
    expect(persons['c1']?.y).toBe(persons['c2']?.y);
  });

  it('trois unions : chacune est posée entre voisins ou détachée, jamais perdue', async () => {
    const drawn = selectDisplayedGraph(
      {
        persons: ['p', 'a', 'b', 'c', 'ea', 'eb', 'ec'].map((id) => aPerson(id)),
        unions: [
          anUnion('u-a', 'p', 'a', { end: { reason: 'divorce' } }),
          anUnion('u-b', 'p', 'b', { end: { reason: 'divorce' } }),
          anUnion('u-c', 'p', 'c'),
        ],
        parentChildren: ['a', 'b', 'c'].flatMap((x) => [
          aChildOf('p', `e${x}`, { unionId: `u-${x}` }),
          aChildOf(x, `e${x}`, { unionId: `u-${x}` }),
        ]),
      },
      { focusId: 'p', showPastUnions: true },
    );
    const layout = await computeTreeLayout(drawn, elk);
    expect(drawn.unions).toHaveLength(3);
    for (const union of drawn.unions) {
      const point = layout.unions[union.id];
      if (point) {
        // Posée : entre deux voisins directs.
        const [a, b] = union.partnerIds.map((id) => layout.persons[id ?? '']?.x ?? 0);
        expect(Math.abs((a ?? 0) - (b ?? 0))).toBe(SLOT);
      } else {
        expect(layout.detachedUnions).toContain(union.id);
      }
    }
    // Chaque enfant est sous ses parents.
    for (const child of ['ea', 'eb', 'ec']) {
      expect(layout.persons[child]?.y).toBeGreaterThan(layout.persons['p']?.y ?? 0);
    }
  });

  it('parent inconnu sans côté libre : union détachée, aucun emplacement inventé', async () => {
    const drawn = selectDisplayedGraph(
      {
        persons: ['a', 'p', 'b', 'e'].map((id) => aPerson(id)),
        unions: [
          anUnion('u-a', 'a', 'p'),
          anUnion('u-b', 'p', 'b', { end: { reason: 'deces' } }),
          anUnion('u-x', 'p', null),
        ],
        parentChildren: [aChildOf('p', 'e', { unionId: 'u-x' })],
      },
      { focusId: 'e', showPastUnions: true },
    );
    const layout = await computeTreeLayout(drawn, elk);
    if (layout.unknownPartners['u-x']) {
      expect(
        Math.abs((layout.unknownPartners['u-x']?.x ?? 0) - (layout.persons['p']?.x ?? 0)),
      ).toBe(SLOT);
    } else {
      expect(layout.detachedUnions).toContain('u-x');
    }
    expect(layout.persons['e']?.y).toBeGreaterThan(layout.persons['p']?.y ?? 0);
  });

  it('deux unions à parent inconnu : un emplacement de chaque côté', async () => {
    const drawn = selectDisplayedGraph(
      {
        persons: ['p', 'e1', 'e2'].map((id) => aPerson(id)),
        unions: [anUnion('u1', 'p', null), anUnion('u2', 'p', null)],
        parentChildren: [
          aChildOf('p', 'e1', { unionId: 'u1' }),
          aChildOf('p', 'e2', { unionId: 'u2' }),
        ],
      },
      { focusId: 'e1' },
    );
    const { persons, unknownPartners } = await computeTreeLayout(drawn, elk);
    const p = persons['p']?.x ?? 0;
    expect([unknownPartners['u1']?.x, unknownPartners['u2']?.x].sort()).toEqual(
      [p - SLOT, p + SLOT].sort(),
    );
  });

  it('rend le même placement pour le même graphe', async () => {
    expect(await computeTreeLayout(marchand, elk)).toEqual(await computeTreeLayout(marchand, elk));
  });

  it('rend un placement vide pour un graphe vide', async () => {
    expect(await computeTreeLayout({ personIds: [], unions: [], edges: [] }, elk)).toEqual({
      persons: {},
      unions: {},
      unknownPartners: {},
      detachedUnions: [],
      width: 0,
      height: 0,
    });
  });

  it('refuse une réponse d’ELK sans positions', async () => {
    const broken: ElkLike = { layout: async (graph) => ({ id: graph.id }) };
    await expect(computeTreeLayout(marchand, broken)).rejects.toThrow();
  });
});
