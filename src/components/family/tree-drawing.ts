import { branchKeys } from '@/lib/tree/tree.fold';
import type { TreeLayout } from '@/lib/tree/tree.layout';
import { DEFAULT_METRICS, type Point } from '@/lib/tree/tree.metrics';
import { type TreeNeighbors, treeNeighbors } from '@/lib/tree/tree.navigation';
import { routeLinks, type TreeLink } from '@/lib/tree/tree.routes';
import type { DisplayedGraph } from '@/server/family/family.display';
import type { PersonPhoto } from '@/server/media/media.url';

// Ce que le canevas reçoit : des positions et des textes déjà rédigés, rien de plus
// que ce que la policy a laissé passer. Assemblé au rendu serveur, puis dans le
// navigateur après un pliage, à partir des mêmes textes : d'où un module sans
// dépendance au placement lui-même (ni ELK ni Zod côté navigateur).

/** Les textes d'une bulle, rédigés une fois au rendu serveur. */
export type PersonText = {
  /** Sous la bulle : le prénom, ou « Toi » pour le lecteur (DESIGN.md, section 7). */
  name: string;
  /** Vu de près : prénom et nom, comme sur la fiche. */
  fullName: string;
  /** Nom accessible (DESIGN.md, section 11). */
  label: string;
  years?: string;
  initials: string;
  deceased: boolean;
  me: boolean;
  photo?: PersonPhoto;
};

export type TreeNode = TreeNeighbors &
  Point &
  PersonText & {
    id: string;
    /** Une branche de parent seul part sous l'étiquette : vue de loin, un trait l'y relie. */
    branchesBelow: boolean;
  };

/** Poignée d'une branche, posée là où ses liens commencent à descendre. */
export type BranchHandle = Point & {
  /** Clé de la branche : l'union d'un couple, ou la personne qui l'a seule. */
  id: string;
  /** Bulle qui reste en place quand la branche se plie (le premier parent). */
  anchorId: string;
  /** « Luc Marchand et Sophie Marchand », pour le nom accessible de la poignée. */
  owners: string;
};

export type TreeDrawing = {
  /** Dans l'ordre de lecture : génération par génération, de gauche à droite. */
  nodes: TreeNode[];
  links: TreeLink[];
  /** Emplacements « À découvrir » des parents inconnus, par union. */
  unknownPartners: (Point & { id: string })[];
  branches: BranchHandle[];
  width: number;
  height: number;
};

/** Sous la bulle, au bas de l'étiquette : là où partent les branches (tree.routes.ts). */
const BRANCH_DROP = DEFAULT_METRICS.nodeHeight - DEFAULT_METRICS.bubble / 2 + 6;

function branchHandles(
  drawn: DisplayedGraph,
  layout: TreeLayout,
  people: Record<string, PersonText>,
  keys: Iterable<string>,
): BranchHandle[] {
  const unions = new Map(drawn.unions.map((u) => [u.id, u]));
  return [...keys].flatMap((id): BranchHandle[] => {
    const union = unions.get(id);
    const ownerIds = union
      ? union.partnerIds.filter((p) => typeof p === 'string')
      : drawn.personIds.includes(id)
        ? [id]
        : [];
    const placed = ownerIds
      .map((owner) => layout.persons[owner])
      .filter((point) => point !== undefined)
      .sort((a, b) => a.x - b.x);
    const [anchorId] = ownerIds;
    // Une union détachée n'a pas de point : sa poignée va sous le parent de gauche.
    const at = (union ? layout.unions[id] : undefined) ?? placed[0];
    if (!at || !anchorId) return [];
    const owners = ownerIds.map((owner) => people[owner]?.fullName ?? '').join(' et ');
    return [{ id, anchorId, owners, x: at.x, y: at.y + BRANCH_DROP }];
  });
}

export function assembleDrawing(
  drawn: DisplayedGraph,
  layout: TreeLayout,
  people: Record<string, PersonText>,
  /** Branches à poser : celles du graphe entier, pour garder celles qui sont pliées. */
  keys: Iterable<string> = branchKeys(drawn),
): TreeDrawing {
  const neighbors = treeNeighbors(drawn, layout);
  const links = routeLinks(drawn, layout);
  const branching = new Set(links.flatMap((l) => (l.parentId ? [l.parentId] : [])));

  const nodes = drawn.personIds.flatMap((id): TreeNode[] => {
    const text = people[id];
    const point = layout.persons[id];
    const around = neighbors[id];
    if (!text || !point || !around) return [];
    return [{ id, ...point, ...around, ...text, branchesBelow: branching.has(id) }];
  });
  nodes.sort((a, b) => a.row - b.row || a.x - b.x);

  return {
    nodes,
    links,
    unknownPartners: Object.entries(layout.unknownPartners).map(([id, point]) => ({
      id,
      ...point,
    })),
    branches: branchHandles(drawn, layout, people, keys),
    width: layout.width,
    height: layout.height,
  };
}

/** Les textes d'un dessin, pour en assembler un autre sans repasser par le serveur. */
export function peopleOf(nodes: TreeNode[]): Record<string, PersonText> {
  return Object.fromEntries(
    nodes.map(({ id, x, y, row, left, right, up, down, branchesBelow, ...text }) => [id, text]),
  );
}
