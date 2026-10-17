// tdd-cover: e2e src/lib/tree/tree.layout.test.ts
import ELK from 'elkjs/lib/elk.bundled.js';
import { bench, describe } from 'vitest';
import { aChildOf, anUnion, aPerson } from '../../../tests/fixtures/builders';
import { selectDisplayedGraph } from '../../server/family/family.display';
import type { FamilyGraph } from '../../server/family/family.types';
import { foldGraph } from './tree.fold';
import { computeTreeLayout } from './tree.layout';
import { defaultFolds, hiddenSiblings } from './tree.lineage';

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

// Ordre des lignées (retour de Folpe, 2026-10-17) : centré sur une personne de la
// dernière génération, tout déplié (le pire cas d'un re-layout), puis lignées seules.
describe('computeTreeLayout, autour d’une personne', () => {
  for (const size of [200, 500]) {
    const family = syntheticFamily(size);
    const focusId = family.persons.at(-2)?.id ?? 'p0';
    const drawn = selectDisplayedGraph(family, { focusId });
    bench(`${size} personnes, tout déplié`, async () => {
      await computeTreeLayout(drawn, elk, { focusId });
    });
    const folded = new Set(defaultFolds(drawn, focusId));
    const shown = foldGraph(drawn, folded, focusId);
    const markers = [...hiddenSiblings(drawn, folded, focusId).keys()];
    bench(`${size} personnes, lignées seules`, async () => {
      await computeTreeLayout(shown, elk, { focusId, markers });
    });
  }
});
