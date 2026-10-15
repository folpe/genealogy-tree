import type { FamilyGraph } from '../../src/server/family/family.types';
import { aChildOf, anUnion, aPerson } from './builders';

/**
 * Famille fictive élargie (retour de Folpe, 2026-10-15 : en ajoutant des personnes, les
 * familles se mélangent). Trois générations autour de « moi » : côté paternel et côté
 * maternel avec oncles, tantes et cousins, et des conjoints venus avec leur propre
 * famille (parents, frères et sœurs). Aucune donnée réelle.
 */
export function extendedFamily(): FamilyGraph {
  const g: FamilyGraph = { persons: [], unions: [], parentChildren: [] };
  const person = (...ids: string[]) => g.persons.push(...ids.map((id) => aPerson(id)));
  const couple = (unionId: string, a: string, b: string, children: string[]) => {
    g.unions.push(anUnion(unionId, a, b));
    for (const child of children) {
      g.parentChildren.push(aChildOf(a, child, { unionId }), aChildOf(b, child, { unionId }));
    }
  };

  // Côté paternel : trois enfants, dont le père ; une tante mariée à quelqu'un venu
  // avec ses parents et son frère, un oncle marié à quelqu'un sans famille.
  person('gp-p', 'gm-p', 'oncle-p', 'pere', 'tante-p');
  couple('u-gp-p', 'gp-p', 'gm-p', ['oncle-p', 'pere', 'tante-p']);
  person('epouse-oncle-p', 'cousin-p1', 'cousin-p2');
  couple('u-oncle-p', 'oncle-p', 'epouse-oncle-p', ['cousin-p1', 'cousin-p2']);
  person('mari-tante-p', 'gp-mt', 'gm-mt', 'frere-mt', 'cousin-p3');
  couple('u-gp-mt', 'gp-mt', 'gm-mt', ['mari-tante-p', 'frere-mt']);
  couple('u-tante-p', 'tante-p', 'mari-tante-p', ['cousin-p3']);

  // Côté maternel : la mère et deux sœurs, dont une mariée à quelqu'un de famille.
  person('gp-m', 'gm-m', 'mere', 'tante-m1', 'tante-m2');
  couple('u-gp-m', 'gp-m', 'gm-m', ['tante-m1', 'mere', 'tante-m2']);
  person('mari-tm1', 'gp-mm', 'gm-mm', 'soeur-mm', 'cousin-m1', 'cousin-m2');
  couple('u-gp-mm', 'gp-mm', 'gm-mm', ['soeur-mm', 'mari-tm1']);
  couple('u-tante-m1', 'tante-m1', 'mari-tm1', ['cousin-m1', 'cousin-m2']);

  // Moi, ma sœur ; mon conjoint avec ses parents et sa sœur ; nos enfants.
  person('moi', 'soeur', 'conjoint', 'gp-c', 'gm-c', 'soeur-c', 'enfant1', 'enfant2');
  couple('u-parents', 'pere', 'mere', ['moi', 'soeur']);
  couple('u-gp-c', 'gp-c', 'gm-c', ['conjoint', 'soeur-c']);
  couple('u-moi', 'moi', 'conjoint', ['enfant1', 'enfant2']);
  return g;
}
