import { describe, expect, it } from 'vitest';
import { aPerson, exact } from '../../../tests/fixtures/builders';
import { redactPerson } from './access.redact';

const luc = aPerson('luc', {
  firstName: 'Luc',
  lastName: 'Marchand',
  gender: 'homme',
  birth: { date: exact(1963, 8, 21), place: 'Toulouse' },
  residence: 'Toulouse',
  sourcedFields: ['birth.date'],
});

describe('redactPerson', () => {
  it('full : la fiche entière', () => {
    expect(redactPerson(luc, 'full')).toEqual({ level: 'full', ...luc });
  });

  it('family : année et ville de naissance, rien d’autre de privé', () => {
    const redacted = redactPerson(luc, 'family');
    expect(redacted).toEqual({
      level: 'family',
      id: 'luc',
      firstName: 'Luc',
      lastName: 'Marchand',
      gender: 'homme',
      birth: { date: { precision: 'annee', year: 1963 }, place: 'Toulouse' },
    });
    expect('residence' in redacted).toBe(false);
  });

  it('family : garde une date déjà à l’année telle quelle', () => {
    const p = aPerson('p', { birth: { date: { precision: 'vers', year: 1850 } } });
    expect(redactPerson(p, 'family')).toMatchObject({
      birth: { date: { precision: 'vers', year: 1850 } },
    });
  });

  it('structure : nom et genre seulement', () => {
    const redacted = redactPerson({ ...luc, birthName: 'Martin' }, 'structure');
    expect(redacted).toEqual({
      level: 'structure',
      id: 'luc',
      firstName: 'Luc',
      lastName: 'Marchand',
      birthName: 'Martin',
      gender: 'homme',
    });
    expect('birth' in redacted).toBe(false);
  });

  it('minor : prénom et initiales seulement', () => {
    const jade = aPerson('jade', {
      firstName: 'Jade',
      lastName: 'Marchand',
      gender: 'femme',
      birth: { date: exact(2018, 2, 6), place: 'Paris' },
    });
    expect(redactPerson(jade, 'minor')).toEqual({
      level: 'minor',
      id: 'jade',
      firstName: 'Jade',
      initials: 'JM',
      gender: 'femme',
    });
  });
});
