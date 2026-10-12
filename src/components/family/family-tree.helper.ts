import { computeTreeLayout, type ElkLike, type Point } from '@/lib/tree/tree.layout';
import { type TreeNeighbors, treeNeighbors } from '@/lib/tree/tree.navigation';
import { routeLinks, type TreeLink } from '@/lib/tree/tree.routes';
import type { TreeForViewer } from '@/server/family/family.service';
import type { PersonPhoto } from '@/server/media/media.url';
import { isDeceased, lifeYears, personInitials, personLabel } from './person.helper';

// Ce que le canevas reçoit : des positions et des textes déjà rédigés, rien de plus
// que ce que la policy a laissé passer. Calculé côté serveur, à chaque rendu.

export type TreeNode = TreeNeighbors &
  Point & {
    id: string;
    /** Sous la bulle : le prénom, ou « Toi » pour le lecteur (DESIGN.md, section 7). */
    name: string;
    /** Nom accessible (DESIGN.md, section 11). */
    label: string;
    years?: string;
    initials: string;
    deceased: boolean;
    me: boolean;
    photo?: PersonPhoto;
  };

export type TreeDrawing = {
  /** Dans l'ordre de lecture : génération par génération, de gauche à droite. */
  nodes: TreeNode[];
  links: TreeLink[];
  /** Emplacements « À découvrir » des parents inconnus, par union. */
  unknownPartners: (Point & { id: string })[];
  width: number;
  height: number;
};

export async function drawTree(tree: TreeForViewer, elk: ElkLike): Promise<TreeDrawing> {
  const layout = await computeTreeLayout(tree.drawn, elk);
  const neighbors = treeNeighbors(tree.drawn, layout);
  const byId = new Map(tree.persons.map((p) => [p.id, p]));

  const nodes = tree.drawn.personIds.flatMap((id): TreeNode[] => {
    const person = byId.get(id);
    const point = layout.persons[id];
    const around = neighbors[id];
    if (!person || !point || !around) return [];
    const me = id === tree.viewerPersonId;
    const years = lifeYears(person);
    const photo = tree.photos[id];
    return [
      {
        id,
        ...point,
        ...around,
        name: me ? 'Toi' : person.firstName,
        label: [personLabel(person), years, me ? 'c’est toi' : undefined]
          .filter(Boolean)
          .join(', '),
        ...(years ? { years } : {}),
        initials: personInitials(person),
        deceased: isDeceased(person),
        me,
        ...(photo ? { photo } : {}),
      },
    ];
  });
  nodes.sort((a, b) => a.row - b.row || a.x - b.x);

  return {
    nodes,
    links: routeLinks(tree.drawn, layout),
    unknownPartners: Object.entries(layout.unknownPartners).map(([id, point]) => ({
      id,
      ...point,
    })),
    width: layout.width,
    height: layout.height,
  };
}
