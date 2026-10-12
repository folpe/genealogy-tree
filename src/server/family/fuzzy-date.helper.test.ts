import { describe, expect, it } from 'vitest';
import type { FuzzyDate } from './family.types';
import {
  ageAt,
  compareFuzzyDates,
  formatFuzzyDate,
  fuzzyDateRange,
  isCertainlyBefore,
  parseFuzzyDate,
  todayIn,
  VERS_MARGIN_YEARS,
} from './fuzzy-date.helper';

const exacte = (year: number, month: number, day: number): FuzzyDate => ({
  precision: 'exacte',
  year,
  month,
  day,
});
const annee = (year: number): FuzzyDate => ({ precision: 'annee', year });

describe('parseFuzzyDate', () => {
  it.each<[string, FuzzyDate]>([
    ['12/03/1987', exacte(1987, 3, 12)],
    ['1/3/1987', exacte(1987, 3, 1)],
    ['12-03-1987', exacte(1987, 3, 12)],
    ['1987-03-12', exacte(1987, 3, 12)],
    ['12 mars 1987', exacte(1987, 3, 12)],
    ['1er mars 1987', exacte(1987, 3, 1)],
    ['3 Août 1992', exacte(1992, 8, 3)],
    ['3 aout 1992', exacte(1992, 8, 3)],
    ['mars 1987', { precision: 'mois', year: 1987, month: 3 }],
    ['Décembre 1950', { precision: 'mois', year: 1950, month: 12 }],
    ['fevrier 1940', { precision: 'mois', year: 1940, month: 2 }],
    ['1987', annee(1987)],
    ['  1987  ', annee(1987)],
    ['vers 1850', { precision: 'vers', year: 1850 }],
    ['Vers 1850', { precision: 'vers', year: 1850 }],
    ['environ 1850', { precision: 'vers', year: 1850 }],
    ['avant 1900', { precision: 'avant', year: 1900 }],
    ['après 1900', { precision: 'apres', year: 1900 }],
    ['APRES 1900', { precision: 'apres', year: 1900 }],
    ['entre 1880 et 1885', { precision: 'entre', from: 1880, to: 1885 }],
    ['Entre 1880 et 1880', { precision: 'entre', from: 1880, to: 1880 }],
  ])('« %s »', (input, expected) => {
    expect(parseFuzzyDate(input)).toEqual(expected);
  });

  it.each([
    '',
    'hier',
    '31/02/1987',
    '12/13/1987',
    '30 février 1987',
    'entre 1885 et 1880',
    'brumaire 1800',
    'vers',
  ])('rejette « %s »', (input) => {
    expect(parseFuzzyDate(input)).toBeNull();
  });
});

describe('formatFuzzyDate', () => {
  it.each<[FuzzyDate, string]>([
    [exacte(1987, 3, 12), '12 mars 1987'],
    [exacte(1987, 3, 1), '1er mars 1987'],
    [exacte(1992, 8, 3), '3 août 1992'],
    [{ precision: 'mois', year: 1987, month: 3 }, 'mars 1987'],
    [annee(1987), '1987'],
    [{ precision: 'vers', year: 1850 }, 'vers 1850'],
    [{ precision: 'avant', year: 1900 }, 'avant 1900'],
    [{ precision: 'apres', year: 1900 }, 'après 1900'],
    [{ precision: 'entre', from: 1880, to: 1885 }, 'entre 1880 et 1885'],
  ])('%j -> « %s »', (date, expected) => {
    expect(formatFuzzyDate(date)).toBe(expected);
  });

  it('relit ce qu’il écrit', () => {
    const dates: FuzzyDate[] = [
      exacte(1987, 3, 1),
      { precision: 'mois', year: 1987, month: 8 },
      { precision: 'entre', from: 1880, to: 1885 },
      { precision: 'apres', year: 1900 },
    ];
    for (const date of dates) expect(parseFuzzyDate(formatFuzzyDate(date))).toEqual(date);
  });
});

describe('fuzzyDateRange', () => {
  it('borne une date exacte sur elle-même', () => {
    expect(fuzzyDateRange(exacte(1987, 3, 12))).toEqual({
      min: { year: 1987, month: 3, day: 12 },
      max: { year: 1987, month: 3, day: 12 },
    });
  });

  it('borne un mois du premier au dernier jour, années bissextiles comprises', () => {
    expect(fuzzyDateRange({ precision: 'mois', year: 2000, month: 2 })).toEqual({
      min: { year: 2000, month: 2, day: 1 },
      max: { year: 2000, month: 2, day: 29 },
    });
  });

  it('élargit « vers » de la marge par défaut', () => {
    expect(VERS_MARGIN_YEARS).toBe(5);
    expect(fuzzyDateRange({ precision: 'vers', year: 1850 })).toEqual({
      min: { year: 1845, month: 1, day: 1 },
      max: { year: 1855, month: 12, day: 31 },
    });
  });

  it('laisse ouvertes les bornes de « avant » et « après »', () => {
    expect(fuzzyDateRange({ precision: 'avant', year: 1900 })).toEqual({
      min: null,
      max: { year: 1899, month: 12, day: 31 },
    });
    expect(fuzzyDateRange({ precision: 'apres', year: 1900 })).toEqual({
      min: { year: 1901, month: 1, day: 1 },
      max: null,
    });
  });

  it('couvre les deux années de « entre »', () => {
    expect(fuzzyDateRange({ precision: 'entre', from: 1880, to: 1885 })).toEqual({
      min: { year: 1880, month: 1, day: 1 },
      max: { year: 1885, month: 12, day: 31 },
    });
  });
});

describe('compareFuzzyDates', () => {
  it('ordonne des dates exactes', () => {
    expect(compareFuzzyDates(exacte(1987, 3, 12), exacte(1992, 7, 3))).toBeLessThan(0);
    expect(compareFuzzyDates(exacte(1992, 7, 3), exacte(1987, 3, 12))).toBeGreaterThan(0);
    expect(compareFuzzyDates(exacte(1987, 3, 12), exacte(1987, 3, 12))).toBe(0);
  });

  it('place une année avant une date exacte de la même année (début de période)', () => {
    expect(compareFuzzyDates(annee(1987), exacte(1987, 3, 12))).toBeLessThan(0);
    expect(compareFuzzyDates(annee(1987), exacte(1987, 1, 1))).toBeGreaterThan(0);
  });

  it('place « avant 1900 » juste avant 1900', () => {
    expect(compareFuzzyDates({ precision: 'avant', year: 1900 }, annee(1899))).toBeGreaterThan(0);
    expect(compareFuzzyDates({ precision: 'avant', year: 1900 }, annee(1900))).toBeLessThan(0);
  });

  it('donne un tri stable et total', () => {
    const dates: FuzzyDate[] = [
      { precision: 'apres', year: 1900 },
      annee(1900),
      { precision: 'vers', year: 1900 },
      { precision: 'entre', from: 1899, to: 1901 },
      { precision: 'avant', year: 1900 },
      exacte(1900, 1, 1),
    ];
    const sorted = [...dates].sort(compareFuzzyDates).map(formatFuzzyDate);
    expect(sorted).toEqual([
      'vers 1900',
      'entre 1899 et 1901',
      'avant 1900',
      '1er janvier 1900',
      '1900',
      'après 1900',
    ]);
  });
});

describe('ageAt', () => {
  it('calcule un âge exact', () => {
    expect(ageAt(exacte(1963, 8, 21), exacte(2026, 10, 9))).toEqual({
      value: 63,
      min: 63,
      max: 63,
      approx: false,
    });
  });

  it('tient compte de l’anniversaire pas encore passé', () => {
    expect(ageAt(exacte(1995, 11, 26), exacte(2026, 10, 9))?.value).toBe(30);
  });

  it('rend un âge approché à partir d’une année', () => {
    expect(ageAt(annee(1963), exacte(2026, 10, 9))).toEqual({
      value: 63,
      min: 62,
      max: 63,
      approx: true,
    });
  });

  it('calcule l’âge au décès', () => {
    expect(ageAt(annee(1902), annee(1979))).toEqual({ value: 77, min: 76, max: 77, approx: true });
  });

  it('reste approché avec une borne ouverte', () => {
    const age = ageAt({ precision: 'avant', year: 1900 }, annee(1950));
    expect(age?.approx).toBe(true);
    expect(age?.max).toBeNull();
  });

  it('refuse un âge négatif certain', () => {
    expect(ageAt(exacte(2000, 1, 1), exacte(1990, 1, 1))).toBeNull();
  });
});

describe('durcissement (mutation testing)', () => {
  it.each([
    'le 12/03/1987',
    '12/03/1987 environ',
    'x1987-03-12',
    '1987-03-12 midi',
    'le 3 mars 1987',
    'entre 1880 et 1885 env',
    'an 1987',
    '1987 env',
  ])('rejette « %s » (saisie entourée de texte)', (input) => {
    expect(parseFuzzyDate(input)).toBeNull();
  });

  it('tolère les espaces multiples', () => {
    expect(parseFuzzyDate('12   mars    1987')).toEqual(exacte(1987, 3, 12));
  });

  it('départage par la précision à point de tri égal', () => {
    const vers: FuzzyDate = { precision: 'vers', year: 1900 };
    const entre: FuzzyDate = { precision: 'entre', from: 1895, to: 1905 };
    expect(compareFuzzyDates(entre, vers)).toBeLessThan(0);
    expect(compareFuzzyDates(vers, entre)).toBeGreaterThan(0);
  });

  it('départage par la fin de période à précision égale', () => {
    const court: FuzzyDate = { precision: 'entre', from: 1880, to: 1885 };
    const long: FuzzyDate = { precision: 'entre', from: 1880, to: 1890 };
    expect(compareFuzzyDates(court, long)).toBeLessThan(0);
    expect(compareFuzzyDates(long, court)).toBeGreaterThan(0);
  });

  it('égalité entre deux dates ouvertes identiques', () => {
    expect(
      compareFuzzyDates({ precision: 'apres', year: 1900 }, { precision: 'apres', year: 1900 }),
    ).toBe(0);
  });

  it('isCertainlyBefore', () => {
    expect(isCertainlyBefore(annee(1900), annee(1901))).toBe(true);
    expect(isCertainlyBefore(exacte(1900, 5, 1), exacte(1900, 5, 1))).toBe(false);
    expect(isCertainlyBefore(annee(1900), annee(1900))).toBe(false);
    expect(isCertainlyBefore({ precision: 'apres', year: 1900 }, annee(1950))).toBe(false);
    expect(isCertainlyBefore(annee(1950), { precision: 'avant', year: 1900 })).toBe(false);
    expect(
      isCertainlyBefore({ precision: 'avant', year: 1900 }, { precision: 'apres', year: 1900 }),
    ).toBe(true);
  });

  it('âge avec une naissance « après »', () => {
    expect(ageAt({ precision: 'apres', year: 1900 }, annee(1950))).toEqual({
      value: 49,
      min: null,
      max: 49,
      approx: true,
    });
  });

  it('âge nul le jour de la naissance', () => {
    expect(ageAt(exacte(2000, 1, 1), exacte(2000, 1, 1))).toEqual({
      value: 0,
      min: 0,
      max: 0,
      approx: false,
    });
  });

  it('âge inconnu quand aucune borne ne permet de le calculer', () => {
    expect(
      ageAt({ precision: 'apres', year: 1900 }, { precision: 'apres', year: 1950 }),
    ).toBeNull();
  });
});

describe('todayIn', () => {
  it('donne la date du jour au fuseau de la famille, pas en UTC', () => {
    // 23 h 30 UTC le 11 octobre : déjà le 12 à Paris (UTC+2 en été).
    expect(todayIn(new Date('2026-10-11T23:30:00Z'), 'Europe/Paris')).toEqual({
      precision: 'exacte',
      year: 2026,
      month: 10,
      day: 12,
    });
  });
});
