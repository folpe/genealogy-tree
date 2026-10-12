import { ancestorsOf, buildFamilyIndex, descendantsOf, partnersOf } from './family.helper';
import type { FamilyGraph } from './family.types';

// Sous-graphe d'une vue de l'arbre (plan phase 4, lot 1), avant la sélection de ce
// qui se dessine (`selectDisplayedGraph`) :
// - descendants : la racine, sa descendance et les conjoints de chacun ;
// - sablier : les ancêtres de la personne centrale au-dessus, sa descendance et les
//   conjoints en dessous, sans fratrie ni collatéraux.
// « A élevé » n'ouvre pas de descendance : le lien reste, entre personnes gardées.

export type SubgraphOptions = {
  view: 'descendants' | 'hourglass';
  rootId: string;
  /** Générations au plus de chaque côté ; sans limite par défaut. */
  depth?: number;
};

export function selectSubgraph(
  graph: FamilyGraph,
  { view, rootId, depth = Number.POSITIVE_INFINITY }: SubgraphOptions,
): FamilyGraph {
  const index = buildFamilyIndex(graph);
  if (!index.persons.has(rootId)) return { persons: [], unions: [], parentChildren: [] };

  const within = (generations: Map<string, number>) =>
    [...generations].filter(([, generation]) => generation <= depth).map(([id]) => id);
  const descendants = within(descendantsOf(index, rootId));
  const ancestors = view === 'hourglass' ? within(ancestorsOf(index, rootId)) : [];

  const kept = new Set([rootId, ...descendants, ...ancestors]);
  for (const id of [rootId, ...descendants]) {
    for (const { partnerId } of partnersOf(index, id)) {
      if (typeof partnerId === 'string') kept.add(partnerId);
    }
  }
  const parentChildren = graph.parentChildren.filter(
    (l) => kept.has(l.parentId) && kept.has(l.childId),
  );
  // Une union se garde avec ses partenaires connus ; avec un partenaire inconnu, elle
  // ne se garde que pour un enfant gardé, sinon elle se dessinerait vide.
  const withChild = new Set(parentChildren.map((l) => l.unionId));
  const keepUnion = (union: FamilyGraph['unions'][number]) => {
    const [known, other] = union.partnerIds;
    if (!kept.has(known)) return false;
    return typeof other === 'string' ? kept.has(other) : withChild.has(union.id);
  };

  return {
    persons: graph.persons.filter((p) => kept.has(p.id)),
    unions: graph.unions.filter(keepUnion),
    parentChildren,
  };
}
