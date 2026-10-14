import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ValidationError } from '../_shared/errors';
import { dateFieldValues, parseDateFields, readDateFields } from './date-fields.helper';
import type { FuzzyDate } from './family.types';

const fields = (values: Record<string, string>) => ({ ...dateFieldValues('birth'), ...values });

describe('readDateFields', () => {
  it('rien de saisi : pas de date', () => {
    expect(readDateFields(dateFieldValues('birth'), 'birth')).toEqual({ ok: true });
    expect(readDateFields({}, 'birth')).toEqual({ ok: true });
  });

  it('date exacte : la valeur du sélecteur de date', () => {
    expect(readDateFields(fields({ birth: '2019-11-09' }), 'birth')).toEqual({
      ok: true,
      date: { precision: 'exacte', year: 2019, month: 11, day: 9 },
    });
  });

  it('refuse une date exacte impossible ou mal formée', () => {
    expect(readDateFields(fields({ birth: '2019-02-30' }), 'birth').ok).toBe(false);
    expect(readDateFields(fields({ birth: '9 novembre 2019' }), 'birth').ok).toBe(false);
  });

  it.each<[Record<string, string>, FuzzyDate]>([
    [
      { birthPrecision: 'annee', birthYear: '1952' },
      { precision: 'annee', year: 1952 },
    ],
    [
      { birthPrecision: 'mois', birthYear: '1952', birthMonth: '3' },
      { precision: 'mois', year: 1952, month: 3 },
    ],
    [
      { birthPrecision: 'vers', birthYear: '1850' },
      { precision: 'vers', year: 1850 },
    ],
    [
      { birthPrecision: 'avant', birthYear: '1900' },
      { precision: 'avant', year: 1900 },
    ],
    [
      { birthPrecision: 'apres', birthYear: '1900' },
      { precision: 'apres', year: 1900 },
    ],
    [
      { birthPrecision: 'entre', birthYear: '1880', birthYearEnd: '1885' },
      { precision: 'entre', from: 1880, to: 1885 },
    ],
  ])('date approximative %o', (values, date) => {
    expect(readDateFields(fields({ birthApprox: 'on', ...values }), 'birth')).toEqual({
      ok: true,
      date,
    });
  });

  it('approximative : la case l’emporte sur une date exacte restée dans le champ', () => {
    const values = fields({
      birth: '2019-11-09',
      birthApprox: 'on',
      birthPrecision: 'vers',
      birthYear: '1850',
    });
    expect(readDateFields(values, 'birth')).toEqual({
      ok: true,
      date: { precision: 'vers', year: 1850 },
    });
  });

  it('approximative sans année : pas de date', () => {
    expect(readDateFields(fields({ birthApprox: 'on', birthPrecision: 'vers' }), 'birth')).toEqual({
      ok: true,
    });
  });

  it.each<[string, Record<string, string>]>([
    ['une année illisible', { birthPrecision: 'vers', birthYear: '18a0' }],
    ['une année hors bornes', { birthPrecision: 'annee', birthYear: '0' }],
    ['un mois manquant', { birthPrecision: 'mois', birthYear: '1952' }],
    ['une fin d’intervalle manquante', { birthPrecision: 'entre', birthYear: '1880' }],
    [
      'un intervalle à l’envers',
      { birthPrecision: 'entre', birthYear: '1885', birthYearEnd: '1880' },
    ],
    ['une précision inconnue', { birthPrecision: 'exacte', birthYear: '1952' }],
  ])('refuse %s', (_, values) => {
    const result = readDateFields(fields({ birthApprox: 'on', ...values }), 'birth');
    expect(result.ok).toBe(false);
  });
});

describe('dateFieldValues', () => {
  it.each<FuzzyDate>([
    { precision: 'exacte', year: 2019, month: 11, day: 9 },
    { precision: 'exacte', year: 812, month: 1, day: 2 },
    { precision: 'mois', year: 1952, month: 3 },
    { precision: 'annee', year: 1952 },
    { precision: 'vers', year: 1850 },
    { precision: 'avant', year: 1900 },
    { precision: 'apres', year: 1900 },
    { precision: 'entre', from: 1880, to: 1885 },
  ])('aller-retour sans perte : %o', (date) => {
    expect(readDateFields(dateFieldValues('death', date), 'death')).toEqual({ ok: true, date });
  });

  it('chaque champ a une valeur, même vide : les formulaires comparent clé à clé', () => {
    expect(dateFieldValues('birth')).toEqual({
      birth: '',
      birthApprox: '',
      birthPrecision: 'annee',
      birthYear: '',
      birthMonth: '',
      birthYearEnd: '',
    });
    expect(dateFieldValues('birth', { precision: 'exacte', year: 812, month: 1, day: 2 })).toEqual(
      expect.objectContaining({ birth: '0812-01-02', birthApprox: '' }),
    );
  });
});

describe('parseDateFields', () => {
  it('rend la date, ou une erreur de validation dont la cause zod porte le message', () => {
    expect(parseDateFields({ birth: '2019-11-09' }, 'birth')).toEqual({
      precision: 'exacte',
      year: 2019,
      month: 11,
      day: 9,
    });
    expect(parseDateFields(undefined, 'birth')).toBeUndefined();
    const refused = () => parseDateFields({ birth: '2019-02-30' }, 'birth');
    expect(refused).toThrow(ValidationError);
    try {
      refused();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const cause = error instanceof ValidationError ? error.cause : undefined;
      expect(cause).toBeInstanceOf(z.ZodError);
    }
  });
});
