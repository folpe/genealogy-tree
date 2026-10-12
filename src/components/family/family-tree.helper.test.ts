import ELK from 'elkjs/lib/elk.bundled.js';
import { describe, expect, it } from 'vitest';
import type { ElkLike } from '@/lib/tree/tree.layout';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { drawTree } from './family-tree.helper';

const elk: ElkLike = new ELK();
const hugo = treeForViewer('m-hugo');

describe('drawTree', () => {
  it('une bulle par personne dessinée, dans l’ordre de lecture', async () => {
    const { nodes } = await drawTree(hugo, elk);
    expect(nodes.map((n) => n.id).sort()).toEqual([...hugo.drawn.personIds].sort());
    for (const [i, node] of nodes.entries()) {
      const next = nodes[i + 1];
      if (!next) continue;
      expect(node.row < next.row || (node.row === next.row && node.x < next.x)).toBe(true);
    }
  });

  it('nomme chaque bulle comme la fiche : prénom, nom, années', async () => {
    const { nodes } = await drawTree(hugo, elk);
    const henri = nodes.find((n) => n.id === 'henri');
    expect(henri).toMatchObject({
      name: 'Henri',
      label: 'Henri Marchand, 1902 - 1979',
      years: '1902 - 1979',
      initials: 'HM',
      deceased: true,
      me: false,
    });
  });

  it('« Toi » sous la bulle du lecteur, et dans son nom accessible', async () => {
    const { nodes } = await drawTree(hugo, elk);
    expect(nodes.find((n) => n.id === 'hugo')).toMatchObject({
      name: 'Toi',
      me: true,
      label: expect.stringMatching(/^Hugo Marchand, .*c’est toi$/),
    });
  });

  it('un mineur hors du cercle proche : prénom et initiale, sans années', async () => {
    const { nodes } = await drawTree(hugo, elk);
    const jade = nodes.find((n) => n.id === 'jade');
    expect(jade).toMatchObject({ name: 'Jade', label: 'Jade M.' });
    expect(jade?.years).toBeUndefined();
  });

  it('joint la photo signée de la fiche', async () => {
    const photo = { src: '/media/p-luc/256?e=1&s=x', srcSet: '', width: 256, height: 256 };
    const { nodes } = await drawTree({ ...hugo, photos: { luc: photo } }, elk);
    expect(nodes.find((n) => n.id === 'luc')?.photo).toEqual(photo);
    expect(nodes.find((n) => n.id === 'paul')?.photo).toBeUndefined();
  });

  it('relie les bulles et donne les voisins du clavier', async () => {
    const { nodes, links } = await drawTree(hugo, elk);
    expect(links.some((l) => l.kind === 'union')).toBe(true);
    expect(nodes.find((n) => n.id === 'hugo')?.up).toMatch(/^(luc|sophie)$/);
  });

  it('arbre vide : rien à dessiner', async () => {
    const empty = { ...hugo, persons: [], drawn: { personIds: [], unions: [], edges: [] } };
    expect(await drawTree(empty, elk)).toEqual({
      nodes: [],
      links: [],
      unknownPartners: [],
      width: 0,
      height: 0,
    });
  });
});
