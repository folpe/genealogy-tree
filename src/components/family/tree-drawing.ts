import { branchKeys, foldGraph } from '@/lib/tree/tree.fold';
import type { LayoutOptions, TreeLayout } from '@/lib/tree/tree.layout';
import { hiddenSiblings } from '@/lib/tree/tree.lineage';
import { DEFAULT_METRICS, type Point } from '@/lib/tree/tree.metrics';
import { type TreeNeighbors, treeNeighbors } from '@/lib/tree/tree.navigation';
import { routeLinks, type TreeLink } from '@/lib/tree/tree.routes';
import type { DisplayedGraph } from '@/server/family/family.display';
import type { PersonPhoto } from '@/server/media/media.url';

// Ce que le canevas reçoit : des positions et des textes déjà rédigés, rien de plus
// que ce que la policy a laissé passer. Assemblé au rendu serveur, puis dans le
// navigateur après un pli, à partir des mêmes textes : d'où un module sans dépendance
// au placement lui-même (ELK arrive par `place`, dans un worker côté navigateur).

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
  /** « Luc Marchand et Sophie Marchand », pour le nom accessible de la poignée. */
  owners: string;
  /** Bulle qui reste en place quand la branche se plie (le premier parent). */
  anchorId: string;
};

/** Repère d'une fratrie repliée (« +5 frères et sœurs »), à la place d'une bulle. */
export type SiblingMarker = Point & {
  /** Départ de branche de la fratrie : l'union des parents, ou le parent seul. */
  id: string;
  /** Frères et sœurs masqués, qui reviennent d'un geste. */
  hidden: string[];
  /** Bulle qui reste en place à l'écran quand ils reviennent. */
  anchorId: string;
  /** Pour le nom accessible : « Marie Lefèvre », dont ce sont les frères et sœurs. */
  of: string;
};

export type TreeDrawing = {
  /** Dans l'ordre de lecture : génération par génération, de gauche à droite. */
  nodes: TreeNode[];
  links: TreeLink[];
  /** Emplacements « À découvrir » des parents inconnus, par union. */
  unknownPartners: (Point & { id: string })[];
  branches: BranchHandle[];
  markers: SiblingMarker[];
  width: number;
  height: number;
  /** Plis de ce dessin (tree.fold.ts) ; le premier dessin a ceux de départ. */
  folded: string[];
  /** Les textes de toutes les bulles du graphe, dessinées ou repliées : un pli les montre. */
  people: Record<string, PersonText>;
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
    // Une union détachée n'a pas de point : sa poignée va sous le parent de gauche.
    const at = (union ? layout.unions[id] : undefined) ?? placed[0];
    if (!at) return [];
    const [anchorId] = ownerIds;
    if (!anchorId) return [];
    const owners = ownerIds.map((owner) => people[owner]?.fullName ?? '').join(' et ');
    return [{ id, owners, anchorId, x: at.x, y: at.y + BRANCH_DROP }];
  });
}

function siblingMarkers(
  drawn: DisplayedGraph,
  layout: TreeLayout,
  people: Record<string, PersonText>,
  hidden: ReadonlyMap<string, string[]>,
): SiblingMarker[] {
  const owners = new Map(drawn.unions.map((u) => [u.id, u.partnerIds]));
  return [...hidden].flatMap(([id, siblings]): SiblingMarker[] => {
    const at = layout.markers[id];
    // La bulle de la fratrie encore affichée, sinon le parent.
    const shown = drawn.edges.find((e) => e.from === id && layout.persons[e.to])?.to;
    const anchorId = shown ?? owners.get(id)?.find((p) => typeof p === 'string') ?? id;
    if (!at || !layout.persons[anchorId]) return [];
    const of = shown ? (people[shown]?.fullName ?? '') : '';
    return [{ id, hidden: siblings, anchorId, of, x: at.x, y: at.y }];
  });
}

function assembleDrawing(
  drawn: DisplayedGraph,
  layout: TreeLayout,
  people: Record<string, PersonText>,
  {
    keys = branchKeys(drawn),
    hidden = new Map(),
    folded = [],
  }: {
    /** Branches à poser : celles du graphe entier, pour garder celles qui sont pliées. */
    keys?: Iterable<string>;
    /** Frères et sœurs masqués par départ de branche, pour les repères. */
    hidden?: ReadonlyMap<string, string[]>;
    folded?: string[];
  } = {},
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
    markers: siblingMarkers(drawn, layout, people, hidden),
    width: layout.width,
    height: layout.height,
    folded,
    people,
  };
}

/** Le dessin d'un état de pliage : le graphe plié, ses repères, puis le placement. */
export async function drawFolded(
  graph: DisplayedGraph,
  folded: string[],
  focusId: string | undefined,
  people: Record<string, PersonText>,
  place: (shown: DisplayedGraph, options: LayoutOptions) => Promise<TreeLayout>,
): Promise<TreeDrawing> {
  const keys = new Set(folded);
  const shown = foldGraph(graph, keys, focusId);
  const hidden = hiddenSiblings(graph, keys, focusId);
  const layout = await place(shown, { focusId, markers: [...hidden.keys()] });
  return assembleDrawing(shown, layout, people, { keys: branchKeys(graph), hidden, folded });
}
