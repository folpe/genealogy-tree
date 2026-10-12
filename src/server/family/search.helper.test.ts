import { describe, expect, it } from 'vitest';
import { aPerson } from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { redactPerson } from '../access/access.redact';
import { buildSearchIndex, normalizeForSearch, search } from './search.helper';

const full = marchandFamily.persons.map((p) => redactPerson(p, 'full'));
const index = buildSearchIndex(full);
const ids = (query: string, idx = index) => search(idx, query).map((r) => r.id);

describe('normalizeForSearch', () => {
  it('ignore casse, accents, tirets et apostrophes', () => {
    expect(normalizeForSearch("  Léa-Marie  D'Hérouville ")).toBe('lea marie d herouville');
  });
});

describe('search', () => {
  it('insensible à la casse et aux accents', () => {
    expect(ids('lea')).toEqual(['lea']);
    expect(ids('EMILE')).toEqual(['emile']);
  });

  it('trouve le nom de naissance', () => {
    expect(ids('garnier')).toEqual(['louise']);
    expect(ids('née Roux')).toEqual(['jeanne']);
  });

  it('trouve le surnom', () => {
    expect(ids('lulu')).toEqual(['luc']);
  });

  it('exige que chaque mot corresponde', () => {
    expect(ids('hugo marchand')).toEqual(['hugo']);
    expect(ids('hugo lefevre')).toEqual([]);
  });

  it('gère prénoms composés et tirets', () => {
    const idx = buildSearchIndex([
      redactPerson(aPerson('jp', { firstName: 'Jean-Pierre' }), 'full'),
    ]);
    expect(ids('jean pierre', idx)).toEqual(['jp']);
    expect(ids('jean-pierre', idx)).toEqual(['jp']);
    expect(ids('pierre', idx)).toEqual(['jp']);
  });

  it('classe : correspondance exacte, puis début de mot, puis contenu', () => {
    const idx = buildSearchIndex(
      ['Annette', 'Anne', 'Marianne'].map((firstName) =>
        redactPerson(aPerson(firstName.toLowerCase(), { firstName }), 'full'),
      ),
    );
    expect(ids('anne', idx)).toEqual(['anne', 'annette', 'marianne']);
  });

  it('départage par proximité dans l’arbre', () => {
    const proximity = new Map([
      ['paul', 2],
      ['luc', 1],
      ['henri', 3],
    ]);
    const idx = buildSearchIndex(full, { proximity });
    expect(ids('marchand', idx).slice(0, 3)).toEqual(['luc', 'paul', 'henri']);
  });

  it('respecte la limite', () => {
    expect(search(index, 'marchand', { limit: 2 })).toHaveLength(2);
  });

  it('ne trouve rien pour une requête vide', () => {
    expect(ids('   ')).toEqual([]);
  });

  it('n’indexe pas ce que la visibilité masque', () => {
    const jade = marchandFamily.persons.find((p) => p.id === 'jade');
    if (!jade) throw new Error('fixture');
    const idx = buildSearchIndex([redactPerson(jade, 'minor')]);
    expect(ids('jade', idx)).toEqual(['jade']);
    expect(ids('marchand', idx)).toEqual([]);
  });
});
