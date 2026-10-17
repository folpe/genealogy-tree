import ELK from 'elkjs/lib/elk.bundled.js';
import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson } from '../../../tests/fixtures/builders';
import { lineagesFamily } from '../../../tests/fixtures/lineages-family';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { selectDisplayedGraph } from '../../server/family/family.display';
import type { FamilyGraph } from '../../server/family/family.types';
import { countCrossings, lineageCrossings } from './tree.crossings';
import { foldGraph, hideKey, originKey } from './tree.fold';
import { computeTreeLayout, type ElkLike } from './tree.layout';
import { defaultFolds, hiddenSiblings, lineageOf } from './tree.lineage';

const elk: ElkLike = new ELK();

/**
 * Le cas de Folpe (2026-10-13), en famille fictive : « Alex » n'a pas de famille dans
 * l'arbre ; sa compagne « Bea » a ses parents, son frère, un oncle et deux cousines.
 * Avant correction, Bea se retrouvait à l'autre bout, cousines entre elle et son frère.
 */
const couple: FamilyGraph = {
  persons: [
    'gpa',
    'gma',
    'pere',
    'mere',
    'oncle',
    'tante',
    'alex',
    'bea',
    'frere',
    'cous1',
    'cous2',
    'kid1',
    'kid2',
  ].map((id) => aPerson(id)),
  unions: [
    anUnion('u-gp', 'gpa', 'gma'),
    anUnion('u-parents', 'pere', 'mere'),
    anUnion('u-oncle', 'oncle', 'tante'),
    anUnion('u-couple', 'alex', 'bea'),
  ],
  parentChildren: [
    ...['pere', 'oncle'].flatMap((c) => [
      aChildOf('gpa', c, { unionId: 'u-gp' }),
      aChildOf('gma', c, { unionId: 'u-gp' }),
    ]),
    ...['bea', 'frere'].flatMap((c) => [
      aChildOf('pere', c, { unionId: 'u-parents' }),
      aChildOf('mere', c, { unionId: 'u-parents' }),
    ]),
    ...['cous1', 'cous2'].flatMap((c) => [
      aChildOf('oncle', c, { unionId: 'u-oncle' }),
      aChildOf('tante', c, { unionId: 'u-oncle' }),
    ]),
    ...['kid1', 'kid2'].flatMap((c) => [
      aChildOf('alex', c, { unionId: 'u-couple' }),
      aChildOf('bea', c, { unionId: 'u-couple' }),
    ]),
  ],
};

/**
 * Deux familles reliées par un couple (« moi » et « elle ») : de chaque côté, des
 * grands-parents, le parent et ses frères et sœurs, chacun en couple avec des enfants.
 * La forme de la famille réelle de Folpe, où des cousins venaient s'intercaler.
 */
function twoFamilies(uncles: [number, number], cousins: [number, number]): FamilyGraph {
  const g: FamilyGraph = { persons: [], unions: [], parentChildren: [] };
  const side = (name: string, n: number, kids: number, child: string) => {
    const gp = `${name}-gpa`;
    const gm = `${name}-gma`;
    g.persons.push(aPerson(gp), aPerson(gm));
    g.unions.push(anUnion(`u-${name}`, gp, gm));
    for (let i = 0; i <= n; i += 1) {
      const p = `${name}-p${i}`;
      const s = `${name}-s${i}`;
      g.persons.push(aPerson(p), aPerson(s));
      g.unions.push(anUnion(`u-${name}-${i}`, p, s));
      for (const up of [gp, gm]) g.parentChildren.push(aChildOf(up, p, { unionId: `u-${name}` }));
      for (let k = 0; k < (i === 0 ? 3 : kids); k += 1) {
        const c = i === 0 && k === 0 ? child : `${name}-c${i}-${k}`;
        g.persons.push(aPerson(c));
        for (const parent of [p, s]) {
          g.parentChildren.push(aChildOf(parent, c, { unionId: `u-${name}-${i}` }));
        }
      }
    }
  };
  side('a', uncles[0], cousins[0], 'moi');
  side('b', uncles[1], cousins[1], 'elle');
  g.unions.push(anUnion('u-couple', 'moi', 'elle'));
  return g;
}

describe('countCrossings', () => {
  const at = (x: number, y: number) => ({ x, y });
  const drawn = {
    personIds: ['a', 'b', 'c', 'd'],
    unions: [],
    edges: [
      { kind: 'parent' as const, from: 'a', to: 'd' },
      { kind: 'parent' as const, from: 'b', to: 'c' },
    ],
  };
  const layout = (c: number, d: number) => ({
    persons: { a: at(0, 0), b: at(100, 0), c: at(c, 200), d: at(d, 200) },
    unions: {},
    unknownPartners: {},
    detachedUnions: [],
    markers: {},
    width: 200,
    height: 200,
  });

  it('compte deux traits dont départs et arrivées sont dans l’ordre inverse', () => {
    expect(countCrossings(drawn, layout(0, 100))).toBe(1);
    expect(countCrossings(drawn, layout(100, 0))).toBe(0);
  });
});

describe('lisibilité du placement', () => {
  // Formes qui croisaient avec le réglage par défaut d'ELK (jusqu'à 8 croisements).
  for (const [uncles, cousins] of [
    [
      [1, 5],
      [1, 4],
    ],
    [
      [2, 6],
      [3, 3],
    ],
    [
      [3, 5],
      [2, 2],
    ],
  ] satisfies [[number, number], [number, number]][]) {
    it(`deux familles reliées par un couple : aucun croisement (${uncles} oncles, ${cousins} cousins)`, async () => {
      const drawn = selectDisplayedGraph(twoFamilies(uncles, cousins), { focusId: 'moi' });
      const layout = await computeTreeLayout(drawn, elk, { focusId: 'moi' });
      expect(countCrossings(drawn, layout)).toBe(0);
    });
  }

  for (const focus of ['alex', 'bea', 'cous1']) {
    it(`un couple dont un seul côté a sa famille : aucun croisement (vu par ${focus})`, async () => {
      const drawn = selectDisplayedGraph(couple, { focusId: focus });
      const layout = await computeTreeLayout(drawn, elk, { focusId: focus });
      expect(countCrossings(drawn, layout)).toBe(0);
    });
  }

  it('la famille des maquettes reste sans croisement', async () => {
    const drawn = selectDisplayedGraph(marchandFamily, { focusId: 'hugo' });
    const layout = await computeTreeLayout(drawn, elk, { focusId: 'hugo' });
    expect(countCrossings(drawn, layout)).toBe(0);
  });
});

describe('aucun croisement sur la lignée directe, pliée ou dépliée', () => {
  const drawn = selectDisplayedGraph(lineagesFamily(), { focusId: 'moi' });
  const crossingsOf = async (folded: string[]) => {
    const keys = new Set(folded);
    const shown = foldGraph(drawn, keys, 'moi');
    const markers = [...hiddenSiblings(drawn, keys, 'moi').keys()];
    const layout = await computeTreeLayout(shown, elk, { focusId: 'moi', markers });
    return lineageCrossings(shown, layout, lineageOf(shown, 'moi'));
  };
  const maternal = [hideKey('tante-b'), hideKey('oncle-b')];
  const states: [string, string[]][] = [
    ['lignées seules', defaultFolds(drawn, 'moi')],
    ['ma famille, la sienne repliée', [originKey('elle')]],
    ['sa famille, la mienne repliée', [originKey('moi')]],
    ['les deux, sans la fratrie de ma mère', maternal],
    ['la famille de ma mère et la sienne repliées', [originKey('mere'), originKey('elle')]],
    ['la famille de ma mère repliée', [originKey('mere')]],
    ['la famille de mon père repliée', [originKey('pere')]],
    ['la famille de mon père et la sienne repliées', [originKey('pere'), originKey('elle')]],
  ];
  for (const [name, folded] of states) {
    it(name, async () => {
      expect(await crossingsOf(folded)).toBe(0);
    });
  }

  it('toléré : les cousins du côté de ma mère, avec sa famille à elle dépliée', async () => {
    // Géométrie, pas réglage : la mère est à droite du père, ses neveux à droite de ma
    // fratrie, et elle est soudée à moi ; la famille d'elle, plus à droite encore, ne
    // peut descendre jusqu'à elle sans passer par-dessus eux. Lignées seules par défaut,
    // ce cas ne se présente que si l'on déplie les deux.
    expect(await crossingsOf([])).toBeGreaterThan(0);
  });
});
