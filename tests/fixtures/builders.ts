import type {
  FamilyGraph,
  FuzzyDate,
  ParentChild,
  Person,
  Union,
} from '../../src/server/family/family.types';

/** Personne minimale ; le prénom reprend l'identifiant pour des messages lisibles. */
export function aPerson(id: string, overrides: Partial<Omit<Person, 'id'>> = {}): Person {
  return {
    id,
    firstName: id,
    lastName: 'Test',
    gender: 'inconnu',
    visibility: 'famille',
    sourcedFields: [],
    ...overrides,
  };
}

export function anUnion(
  id: string,
  a: string,
  b: string | null,
  overrides: Partial<Omit<Union, 'id' | 'partnerIds'>> = {},
): Union {
  return { id, partnerIds: [a, b], kind: 'mariage', ...overrides };
}

export function aChildOf(
  parentId: string,
  childId: string,
  overrides: Partial<Omit<ParentChild, 'parentId' | 'childId'>> = {},
): ParentChild {
  return { parentId, childId, kind: 'biologique', ...overrides };
}

export function emptyGraph(persons: Person[] = []): FamilyGraph {
  return { persons, unions: [], parentChildren: [] };
}

export const yearOnly = (year: number): FuzzyDate => ({ precision: 'annee', year });

export const exact = (year: number, month: number, day: number): FuzzyDate => ({
  precision: 'exacte',
  year,
  month,
  day,
});
