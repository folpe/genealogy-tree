import { describe, expect, it } from 'vitest';
import type { RedactedPerson } from '@/server/access/access.redact';
import { aPerson, exact, yearOnly } from '../../../tests/fixtures/builders';
import { isDeceased, lifeYears, personInitials, personLabel } from './person.helper';

const full = (overrides: Parameters<typeof aPerson>[1] = {}): RedactedPerson => ({
  level: 'full',
  ...aPerson('p', { firstName: 'Léa', lastName: 'Marchand', ...overrides }),
});
const minor: RedactedPerson = {
  level: 'minor',
  id: 'j',
  firstName: 'Jade',
  initials: 'JM',
  gender: 'femme',
};
const structure: RedactedPerson = {
  level: 'structure',
  id: 's',
  firstName: 'Anne',
  lastName: 'Roux',
  gender: 'femme',
};

describe('personLabel', () => {
  it('prénom et nom, ou prénom et initiale pour un mineur', () => {
    expect(personLabel(full())).toBe('Léa Marchand');
    expect(personLabel(minor)).toBe('Jade M.');
  });
});

describe('personInitials', () => {
  it('initiales en capitales, celles du service pour un mineur', () => {
    expect(personInitials(full({ firstName: 'émile', lastName: 'roux' }))).toBe('ÉR');
    expect(personInitials(minor)).toBe('JM');
  });
});

describe('lifeYears', () => {
  it('année de naissance seule pour un vivant', () => {
    expect(lifeYears(full({ birth: { date: exact(1990, 3, 4) } }))).toBe('1990');
  });

  it('naissance et décès, avec un point d’interrogation pour l’inconnu', () => {
    const dead = full({ birth: { date: yearOnly(1902) }, death: { date: yearOnly(1979) } });
    expect(lifeYears(dead)).toBe('1902 - 1979');
    expect(lifeYears(full({ death: {} }))).toBe('? - ?');
  });

  it('première année d’une fourchette', () => {
    const between = full({ birth: { date: { precision: 'entre', from: 1880, to: 1885 } } });
    expect(lifeYears(between)).toBe('1880');
  });

  it('rien pour une fiche restreinte ou un mineur', () => {
    expect(lifeYears(structure)).toBeUndefined();
    expect(lifeYears(minor)).toBeUndefined();
  });
});

describe('isDeceased', () => {
  it('seulement quand le niveau montre le décès', () => {
    expect(isDeceased(full({ death: {} }))).toBe(true);
    expect(isDeceased(full())).toBe(false);
    expect(isDeceased(structure)).toBe(false);
  });
});
