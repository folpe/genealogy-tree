import { describe, expect, it } from 'vitest';
import { aPerson, yearOnly } from '../../../tests/fixtures/builders';
import { ValidationError } from '../_shared/errors';
import { applyPersonEdit, parsePersonEdit, sourcedFieldsOf } from './person-edit.helper';

const luc = aPerson('luc', {
  firstName: 'Luc',
  lastName: 'Marchand',
  gender: 'homme',
  birth: { date: yearOnly(1963), place: 'Toulouse' },
  residence: 'Toulouse',
});

describe('parsePersonEdit', () => {
  it('lit un champ de texte, nettoyé ; vide efface un champ facultatif', () => {
    expect(parsePersonEdit({ personId: 'luc', field: 'firstName', value: '  Lucien ' })).toEqual({
      personId: 'luc',
      field: 'firstName',
      value: 'Lucien',
    });
    expect(parsePersonEdit({ personId: 'luc', field: 'nickname', value: '' })).toEqual({
      personId: 'luc',
      field: 'nickname',
    });
  });

  it('refuse un prénom vide, un genre inconnu, une date impossible', () => {
    expect(() => parsePersonEdit({ personId: 'luc', field: 'lastName', value: ' ' })).toThrow(
      ValidationError,
    );
    expect(() => parsePersonEdit({ personId: 'luc', field: 'gender', value: 'x' })).toThrow(
      ValidationError,
    );
    expect(() =>
      parsePersonEdit({ personId: 'luc', field: 'birth', date: '2019-02-30', place: '' }),
    ).toThrow('Date impossible');
  });

  it('naissance et décès : date du calendrier ou approximative, et lieu', () => {
    expect(
      parsePersonEdit({
        personId: 'luc',
        field: 'death',
        deceased: 'on',
        dateApprox: 'on',
        datePrecision: 'vers',
        dateYear: '2040',
      }),
    ).toEqual({
      personId: 'luc',
      field: 'death',
      event: { date: { precision: 'vers', year: 2040 } },
    });
    // Sans la case, une date de décès dit un décès ; décochée, la case fait foi.
    expect(parsePersonEdit({ personId: 'luc', field: 'death', date: '2040-05-01' })).toMatchObject({
      event: { date: { precision: 'exacte', year: 2040, month: 5, day: 1 } },
    });
    expect(
      parsePersonEdit({ personId: 'luc', field: 'death', deceased: '', date: '2040-05-01' }),
    ).toEqual({ personId: 'luc', field: 'death' });
    expect(parsePersonEdit({ personId: 'luc', field: 'death' })).toEqual({
      personId: 'luc',
      field: 'death',
    });
  });
});

describe('applyPersonEdit', () => {
  it('change un champ, retire un champ vidé, garde le reste', () => {
    const renamed = applyPersonEdit(luc, { personId: 'luc', field: 'firstName', value: 'Lucien' });
    expect(renamed).toMatchObject({ firstName: 'Lucien', lastName: 'Marchand' });
    expect(applyPersonEdit(luc, { personId: 'luc', field: 'residence' }).residence).toBeUndefined();
    const born = applyPersonEdit(luc, {
      personId: 'luc',
      field: 'birth',
      event: { place: 'Albi' },
    });
    expect(born.birth).toEqual({ place: 'Albi' });
  });

  it('décès coché sans rien d’autre : la personne est décédée, date inconnue', () => {
    const dead = applyPersonEdit(luc, { personId: 'luc', field: 'death', event: {} });
    expect(dead.death).toEqual({});
  });
});

describe('sourcedFieldsOf', () => {
  it('les champs de la fiche que la modification touche, au format des sources', () => {
    expect(sourcedFieldsOf({ personId: 'luc', field: 'death', event: {} })).toEqual([
      'death.date',
      'death.place',
    ]);
    expect(sourcedFieldsOf({ personId: 'luc', field: 'firstName', value: 'A' })).toEqual([
      'firstName',
    ]);
  });
});
