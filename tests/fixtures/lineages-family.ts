import type { FamilyGraph, Gender } from '../../src/server/family/family.types';
import { aChildOf, anUnion, aPerson, yearOnly } from './builders';

/**
 * Famille fictive des lignées (retour de Folpe, 2026-10-17) : « moi » au centre avec
 * « elle », chacun avec ses parents, ses frères et sœurs nés avant et après lui ; du côté
 * de moi, des oncles, tantes et cousins des deux côtés ; un enfant du couple. Toutes les
 * dates de naissance sont posées : le rang de naissance se lit sans ambiguïté. Les
 * unions sont enregistrées la mère d'abord, pour éprouver « le père à gauche ».
 */
export function lineagesFamily(): FamilyGraph {
  const g: FamilyGraph = { persons: [], unions: [], parentChildren: [] };
  const person = (id: string, gender: Gender, year: number) =>
    g.persons.push(aPerson(id, { gender, birth: { date: yearOnly(year) } }));
  const couple = (unionId: string, mother: string, father: string, children: string[]) => {
    g.unions.push(anUnion(unionId, mother, father));
    for (const child of children) {
      g.parentChildren.push(
        aChildOf(mother, child, { unionId }),
        aChildOf(father, child, { unionId }),
      );
    }
  };

  // Côté paternel : le père entre un oncle aîné et une tante cadette.
  person('gp-a', 'homme', 1925);
  person('gm-a', 'femme', 1927);
  person('oncle-a', 'homme', 1950);
  person('pere', 'homme', 1952);
  person('tante-a', 'femme', 1955);
  person('cousin-a', 'homme', 1978);
  person('epouse-oncle-a', 'femme', 1951);
  couple('u-gp-a', 'gm-a', 'gp-a', ['oncle-a', 'pere', 'tante-a']);
  couple('u-oncle-a', 'epouse-oncle-a', 'oncle-a', ['cousin-a']);

  // Côté maternel : la mère entre une tante aînée et un oncle cadet.
  person('gp-b', 'homme', 1926);
  person('gm-b', 'femme', 1928);
  person('tante-b', 'femme', 1953);
  person('mere', 'femme', 1956);
  person('oncle-b', 'homme', 1960);
  person('cousine-b', 'femme', 1980);
  person('mari-tante-b', 'homme', 1950);
  couple('u-gp-b', 'gm-b', 'gp-b', ['tante-b', 'mere', 'oncle-b']);
  couple('u-tante-b', 'tante-b', 'mari-tante-b', ['cousine-b']);

  // Moi entre un frère aîné et une sœur cadette ; elle entre une sœur aînée et un frère.
  person('frere', 'homme', 1978);
  person('moi', 'homme', 1980);
  person('soeur', 'femme', 1985);
  couple('u-parents', 'mere', 'pere', ['frere', 'moi', 'soeur']);
  person('gp-e', 'homme', 1950);
  person('gm-e', 'femme', 1952);
  person('soeur-e', 'femme', 1979);
  person('elle', 'femme', 1982);
  person('frere-e', 'homme', 1986);
  couple('u-parents-e', 'gm-e', 'gp-e', ['soeur-e', 'elle', 'frere-e']);
  person('enfant', 'femme', 2010);
  couple('u-moi', 'elle', 'moi', ['enfant']);
  return g;
}

/**
 * La même, avec les parents des parents d'« elle », et du côté de son père un frère et
 * un neveu. Le cas symétrique : ses cousins à elle se rangent du côté de moi.
 */
export function lineagesFamilyBothSides(): FamilyGraph {
  const g = lineagesFamily();
  const born = (id: string, gender: Gender, year: number) =>
    g.persons.push(aPerson(id, { gender, birth: { date: yearOnly(year) } }));
  born('agp-e', 'homme', 1920);
  born('agm-e', 'femme', 1922);
  born('oncle-e', 'homme', 1946);
  born('cousin-e', 'homme', 1976);
  born('bgp-e', 'homme', 1924);
  born('bgm-e', 'femme', 1926);
  g.unions.push(anUnion('u-agp-e', 'agm-e', 'agp-e'), anUnion('u-bgp-e', 'bgm-e', 'bgp-e'));
  g.parentChildren.push(
    aChildOf('bgm-e', 'gm-e', { unionId: 'u-bgp-e' }),
    aChildOf('bgp-e', 'gm-e', { unionId: 'u-bgp-e' }),
  );
  for (const child of ['oncle-e', 'gp-e']) {
    g.parentChildren.push(
      aChildOf('agm-e', child, { unionId: 'u-agp-e' }),
      aChildOf('agp-e', child, { unionId: 'u-agp-e' }),
    );
  }
  g.parentChildren.push(aChildOf('oncle-e', 'cousin-e'));
  return g;
}
