import ELK from 'elkjs/lib/elk.bundled.js';
import { describe, expect, it } from 'vitest';
import { computeTreeLayout, type ElkLike } from '@/lib/tree/tree.layout';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { drawTree } from './family-tree.helper';
import { drawFolded } from './tree-drawing';

const elk: ElkLike = new ELK();
const hugo = treeForViewer('m-hugo');

describe('drawFolded', () => {
  const place = (graph: Parameters<typeof computeTreeLayout>[0], options: object) =>
    computeTreeLayout(graph, elk, options);

  it('redessine un état de pliage avec les textes du premier dessin, sans le serveur', async () => {
    const first = await drawTree(hugo, elk);
    const again = await drawFolded(hugo.drawn, [], 'hugo', first.people, place);
    // Tout affiché : Léa revient, avec son texte rédigé au rendu serveur.
    expect(first.nodes.find((n) => n.id === 'lea')).toBeUndefined();
    expect(again.nodes.find((n) => n.id === 'lea')).toMatchObject({ name: 'Léa' });
    expect(again.nodes.map((n) => n.id).sort()).toEqual([...hugo.drawn.personIds].sort());
    expect(again.markers).toEqual([]);
    expect(again.folded).toEqual([]);
  });

  it('les textes de tout le graphe voyagent avec le premier dessin, géométrie à part', async () => {
    const { people } = await drawTree(hugo, elk);
    expect(Object.keys(people).sort()).toEqual([...hugo.drawn.personIds].sort());
    expect(people['luc']).toMatchObject({ name: 'Luc', initials: 'LM', me: false });
    expect(people['luc']).not.toHaveProperty('x');
  });

  it('un repère par fratrie repliée, au nom de la bulle encore affichée', async () => {
    const { markers } = await drawTree(hugo, elk);
    const parents = markers.find((m) => m.id === 'u-henri-louise');
    expect(parents).toMatchObject({ hidden: ['marie', 'claude'], anchorId: 'paul' });
    expect(parents?.of).toBe('Paul Marchand');
  });
});
