import { computeTreeLayout, type ElkLike } from '@/lib/tree/tree.layout';
import { defaultFolds } from '@/lib/tree/tree.lineage';
import type { TreeForViewer } from '@/server/family/family.service';
import { isDeceased, lifeYears, personInitials, personLabel } from './person.helper';
import { drawFolded, type PersonText, type TreeDrawing } from './tree-drawing';

// Premier dessin de l'arbre, au rendu serveur : les textes de chaque bulle depuis la
// vue filtrée par la policy, puis le placement, lignées dépliées et collatéraux
// repliés (tree.lineage.ts). Les vues sans collatéraux n'ont rien à replier.

/** Les textes de chaque personne du graphe dessiné, dépliée ou non. */
function describePeople(tree: TreeForViewer): Record<string, PersonText> {
  const drawn = new Set(tree.drawn.personIds);
  return Object.fromEntries(
    tree.persons.flatMap((person): [string, PersonText][] => {
      if (!drawn.has(person.id)) return [];
      const me = person.id === tree.viewerPersonId;
      const years = lifeYears(person);
      const photo = tree.photos[person.id];
      const text: PersonText = {
        name: me ? 'Toi' : person.firstName,
        fullName: personLabel(person),
        label: [personLabel(person), years, me ? 'c’est toi' : undefined]
          .filter(Boolean)
          .join(', '),
        ...(years ? { years } : {}),
        initials: personInitials(person),
        deceased: isDeceased(person),
        me,
        ...(photo ? { photo } : {}),
      };
      return [[person.id, text]];
    }),
  );
}

export async function drawTree(tree: TreeForViewer, elk: ElkLike): Promise<TreeDrawing> {
  const folded = defaultFolds(tree.drawn, tree.centerId);
  return drawFolded(tree.drawn, folded, tree.centerId, describePeople(tree), (shown, options) =>
    computeTreeLayout(shown, elk, options),
  );
}
