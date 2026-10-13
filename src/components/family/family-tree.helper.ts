import { computeTreeLayout, type ElkLike } from '@/lib/tree/tree.layout';
import type { TreeForViewer } from '@/server/family/family.service';
import { isDeceased, lifeYears, personInitials, personLabel } from './person.helper';
import { assembleDrawing, type PersonText, type TreeDrawing } from './tree-drawing';

// Premier dessin de l'arbre, au rendu serveur : les textes de chaque bulle depuis la
// vue filtrée par la policy, puis le placement.

function describePeople(tree: TreeForViewer): Record<string, PersonText> {
  return Object.fromEntries(
    tree.persons.map((person): [string, PersonText] => {
      const me = person.id === tree.viewerPersonId;
      const years = lifeYears(person);
      const photo = tree.photos[person.id];
      return [
        person.id,
        {
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
        },
      ];
    }),
  );
}

export async function drawTree(tree: TreeForViewer, elk: ElkLike): Promise<TreeDrawing> {
  const layout = await computeTreeLayout(tree.drawn, elk);
  return assembleDrawing(tree.drawn, layout, describePeople(tree));
}
