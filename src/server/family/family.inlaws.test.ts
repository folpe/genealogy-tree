import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson } from '../../../tests/fixtures/builders';
import { extendedFamily } from '../../../tests/fixtures/extended-family';
import { familiesRevealing, inLawFamilies, withoutInLawFamilies } from './family.inlaws';
import type { FamilyGraph } from './family.types';

// « Familles par zones » (choix de Folpe, 2026-10-16) : dans Toute la famille, la
// famille d'origine d'un conjoint venu d'ailleurs se replie derrière lui.

const sorted = (ids: Iterable<string>) => [...ids].sort();

describe('inLawFamilies', () => {
  const families = inLawFamilies(extendedFamily(), 'moi');

  it('chaque conjoint venu avec sa famille en a une, à replier derrière lui', () => {
    expect(sorted(families.keys())).toEqual(['conjoint', 'mari-tante-p', 'mari-tm1']);
  });

  it('sa famille : ses parents et leurs autres enfants, jamais lui ni les nôtres', () => {
    expect(sorted(families.get('conjoint') ?? [])).toEqual(['gm-c', 'gp-c', 'soeur-c']);
    expect(sorted(families.get('mari-tm1') ?? [])).toEqual(['gm-mm', 'gp-mm', 'soeur-mm']);
  });

  it('un conjoint sans famille dans l’arbre n’a rien à replier', () => {
    expect(families.has('epouse-oncle-p')).toBe(false);
  });

  it('quelqu’un de cette famille marié chez nous reste visible, avec sa propre poignée', () => {
    // La sœur du conjoint épouse un cousin : elle reste à côté de lui.
    const g = extendedFamily();
    g.unions.push(anUnion('u-cousins', 'cousin-p1', 'soeur-c'));
    const withMarriage = inLawFamilies(g, 'moi');
    expect(sorted(withMarriage.get('conjoint') ?? [])).toEqual(['gm-c', 'gp-c']);
    expect(sorted(withMarriage.get('soeur-c') ?? [])).toEqual(['gm-c', 'gp-c']);
  });

  it('les familles des familles se replient avec elles', () => {
    const g: FamilyGraph = extendedFamily();
    g.persons.push(aPerson('mari-soeur-c'), aPerson('pere-mari-soeur-c'));
    g.unions.push(anUnion('u-soeur-c', 'soeur-c', 'mari-soeur-c'));
    g.parentChildren.push(aChildOf('pere-mari-soeur-c', 'mari-soeur-c'));
    expect(sorted(inLawFamilies(g, 'moi').get('conjoint') ?? [])).toEqual([
      'gm-c',
      'gp-c',
      'mari-soeur-c',
      'pere-mari-soeur-c',
      'soeur-c',
    ]);
  });
});

describe('withoutInLawFamilies', () => {
  it('retire les familles repliées, garde celles qu’on a dépliées', () => {
    const g = extendedFamily();
    const shown = withoutInLawFamilies(g, inLawFamilies(g, 'moi'), ['conjoint']);
    const ids = new Set(shown.persons.map((p) => p.id));
    for (const hidden of ['gp-mm', 'soeur-mm', 'gp-mt', 'frere-mt'])
      expect(ids.has(hidden)).toBe(false);
    for (const open of ['gp-c', 'soeur-c', 'conjoint', 'mari-tm1'])
      expect(ids.has(open)).toBe(true);
    // Rien ne pend : ni union ni filiation vers une personne retirée.
    for (const link of shown.parentChildren) {
      expect(ids.has(link.parentId) && ids.has(link.childId)).toBe(true);
    }
    for (const union of shown.unions) {
      for (const partner of union.partnerIds) if (partner) expect(ids.has(partner)).toBe(true);
    }
  });
});

describe('familiesRevealing', () => {
  it('ouvre la famille qui contient la personne demandée (recherche, lien)', () => {
    const families = inLawFamilies(extendedFamily(), 'moi');
    expect(familiesRevealing(families, 'soeur-mm')).toEqual(['mari-tm1']);
    expect(familiesRevealing(families, 'moi')).toEqual([]);
    expect(familiesRevealing(families, undefined)).toEqual([]);
  });
});
