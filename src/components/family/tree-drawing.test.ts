import ELK from 'elkjs/lib/elk.bundled.js';
import { describe, expect, it } from 'vitest';
import { foldGraph } from '@/lib/tree/tree.fold';
import { computeTreeLayout, type ElkLike } from '@/lib/tree/tree.layout';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { drawTree } from './family-tree.helper';
import { assembleDrawing, peopleOf } from './tree-drawing';

const elk: ElkLike = new ELK();
const hugo = treeForViewer('m-hugo');

describe('assembleDrawing', () => {
  it('redessine un graphe plié avec les textes du premier dessin, sans le serveur', async () => {
    const first = await drawTree(hugo, elk);
    const people = peopleOf(first.nodes);
    const folded = foldGraph(hugo.drawn, new Set(['u-luc-sophie']));
    const again = assembleDrawing(folded, await computeTreeLayout(folded, elk), people);

    expect(again.nodes.map((n) => n.id).sort()).toEqual([...folded.personIds].sort());
    expect(again.nodes.find((n) => n.id === 'hugo')).toBeUndefined();
    const henri = again.nodes.find((n) => n.id === 'henri');
    expect(henri).toMatchObject({ name: 'Henri', fullName: 'Henri Marchand' });
    expect(again.links.length).toBeLessThan(first.links.length);
  });

  it('peopleOf garde les textes et laisse la géométrie', async () => {
    const { nodes } = await drawTree(hugo, elk);
    const luc = peopleOf(nodes)['luc'];
    expect(luc).toMatchObject({ name: 'Luc', initials: 'LM', me: false });
    expect(luc).not.toHaveProperty('x');
    expect(luc).not.toHaveProperty('branchesBelow');
  });
});
