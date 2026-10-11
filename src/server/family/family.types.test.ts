import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson, emptyGraph } from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { familyGraphSchema, fuzzyDateSchema } from './family.types';

describe('familyGraphSchema', () => {
  it('accepte la famille Marchand', () => {
    expect(familyGraphSchema.safeParse(marchandFamily).success).toBe(true);
  });

  it('rejette un type de filiation inconnu', () => {
    const graph = {
      ...emptyGraph([aPerson('a'), aPerson('b')]),
      parentChildren: [{ parentId: 'a', childId: 'b', kind: 'par_magie' }],
    };
    const result = familyGraphSchema.safeParse(graph);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['parentChildren', 0, 'kind']);
  });

  it('rejette une union sans partenaire', () => {
    const graph = {
      ...emptyGraph([aPerson('a')]),
      unions: [{ id: 'u', partnerIds: [], kind: 'mariage' }],
    };
    expect(familyGraphSchema.safeParse(graph).success).toBe(false);
  });

  it('rejette une référence vers une personne absente, avec un message exploitable', () => {
    const graph = {
      ...emptyGraph([aPerson('a')]),
      parentChildren: [aChildOf('a', 'fantome')],
    };
    const result = familyGraphSchema.safeParse(graph);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Personne inconnue : fantome');
    expect(result.error?.issues[0]?.path).toEqual(['parentChildren', 0, 'childId']);
  });

  it('rejette une filiation rattachée à une union absente', () => {
    const graph = {
      ...emptyGraph([aPerson('a'), aPerson('b')]),
      parentChildren: [aChildOf('a', 'b', { unionId: 'u-absente' })],
    };
    const result = familyGraphSchema.safeParse(graph);
    expect(result.error?.issues[0]?.message).toBe('Union inconnue : u-absente');
  });

  it('rejette des identifiants de personne en double', () => {
    const result = familyGraphSchema.safeParse(emptyGraph([aPerson('a'), aPerson('a')]));
    expect(result.error?.issues[0]?.message).toBe('Identifiant en double : a');
  });

  it('accepte une union avec un partenaire inconnu', () => {
    const graph = {
      ...emptyGraph([aPerson('a'), aPerson('b')]),
      unions: [anUnion('u', 'a', null)],
      parentChildren: [aChildOf('a', 'b', { unionId: 'u' })],
    };
    expect(familyGraphSchema.safeParse(graph).success).toBe(true);
  });
});

describe('fuzzyDateSchema', () => {
  it('rejette une date exacte impossible', () => {
    expect(
      fuzzyDateSchema.safeParse({ precision: 'exacte', year: 1987, month: 2, day: 30 }).success,
    ).toBe(false);
  });

  it('accepte le 29 février d’une année bissextile', () => {
    expect(
      fuzzyDateSchema.safeParse({ precision: 'exacte', year: 2000, month: 2, day: 29 }).success,
    ).toBe(true);
  });

  it('rejette un intervalle dont le début suit la fin', () => {
    expect(fuzzyDateSchema.safeParse({ precision: 'entre', from: 1885, to: 1880 }).success).toBe(
      false,
    );
  });

  it('rejette un mois hors limites', () => {
    expect(fuzzyDateSchema.safeParse({ precision: 'mois', year: 1987, month: 13 }).success).toBe(
      false,
    );
  });
});
