// tdd-cover: e2e src/lib/tree/tree.layout.test.ts
import ELK from 'elkjs/lib/elk.bundled.js';
import { bench, describe } from 'vitest';
import { aChildOf, anUnion, aPerson } from '../../../tests/fixtures/builders';
import { selectDisplayedGraph } from '../../server/family/family.display';
import type { FamilyGraph } from '../../server/family/family.types';
import { computeTreeLayout } from './tree.layout';

// Mesure, pas un test : le comportement est couvert par tree.layout.test.ts.
// Plan phase 4, lot 2 : objectif < 150 ms pour 500 personnes, hors thread principal.
// `bun run bench` ; ELK tourne ici dans le thread du bench, sans worker.

/** Famille fictive : chaque enfant épouse une personne venue d'ailleurs, trois enfants par couple. */
function syntheticFamily(size: number): FamilyGraph {
  const graph: FamilyGraph = {
    persons: [aPerson('p0'), aPerson('p1')],
    unions: [anUnion('u0', 'p0', 'p1')],
    parentChildren: [],
  };
  const couples = [{ union: 'u0', parents: ['p0', 'p1'] }];
  for (let i = 0; graph.persons.length < size && i < couples.length; i += 1) {
    const couple = couples[i];
    if (!couple) break;
    for (let child = 0; child < 3 && graph.persons.length < size; child += 1) {
      const id = `p${graph.persons.length}`;
      graph.persons.push(aPerson(id));
      for (const parent of couple.parents) {
        graph.parentChildren.push(aChildOf(parent, id, { unionId: couple.union }));
      }
      const spouse = `p${graph.persons.length}`;
      graph.persons.push(aPerson(spouse));
      const union = `u${graph.unions.length}`;
      graph.unions.push(anUnion(union, id, spouse));
      couples.push({ union, parents: [id, spouse] });
    }
  }
  return graph;
}

const elk = new ELK();
describe('computeTreeLayout', () => {
  for (const size of [200, 500, 2_000]) {
    const drawn = selectDisplayedGraph(syntheticFamily(size), { focusId: 'p0' });
    bench(`${size} personnes`, async () => {
      await computeTreeLayout(drawn, elk);
    });
  }
});
