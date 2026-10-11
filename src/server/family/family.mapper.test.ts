import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson, emptyGraph, exact } from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import {
  columnsToFuzzyDate,
  type FamilyRows,
  fuzzyDateToColumns,
  graphToRows,
  normalizePlaceLabel,
  rowsToGraph,
} from './family.mapper';
import type { FamilyGraph, FuzzyDate } from './family.types';

const byId = <T extends { id: string }>(items: T[]) =>
  [...items].sort((a, b) => a.id.localeCompare(b.id));
const sorted = (graph: FamilyGraph): FamilyGraph => ({
  persons: byId(graph.persons),
  unions: byId(graph.unions),
  parentChildren: [...graph.parentChildren].sort((a, b) =>
    `${a.parentId}>${a.childId}`.localeCompare(`${b.parentId}>${b.childId}`),
  ),
});

describe('fuzzyDateToColumns / columnsToFuzzyDate', () => {
  it.each<[FuzzyDate, { value: string; valueEnd?: string }]>([
    [exact(1987, 3, 1), { value: '1987-03-01' }],
    [{ precision: 'mois', year: 1987, month: 11 }, { value: '1987-11-01' }],
    [{ precision: 'annee', year: 1902 }, { value: '1902-01-01' }],
    [{ precision: 'vers', year: 850 }, { value: '0850-01-01' }],
    [{ precision: 'avant', year: 1900 }, { value: '1900-01-01' }],
    [{ precision: 'apres', year: 1900 }, { value: '1900-01-01' }],
    [
      { precision: 'entre', from: 1890, to: 1895 },
      { value: '1890-01-01', valueEnd: '1895-01-01' },
    ],
  ])('%o fait l’aller-retour', (date, columns) => {
    const encoded = fuzzyDateToColumns(date);
    expect(encoded).toEqual({ precision: date.precision, ...columns });
    expect(columnsToFuzzyDate(encoded)).toEqual(date);
  });

  it('une date absente reste absente', () => {
    expect(fuzzyDateToColumns(undefined)).toEqual({});
    expect(columnsToFuzzyDate({ precision: null, value: null, valueEnd: null })).toBeUndefined();
  });

  it('refuse une ligne incohérente plutôt que d’inventer une date', () => {
    expect(() => columnsToFuzzyDate({ precision: null, value: '1890-01-01' })).toThrow(
      'Date en base invalide',
    );
    expect(() =>
      columnsToFuzzyDate({ precision: 'entre', value: '1890-01-01', valueEnd: null }),
    ).toThrow('Date en base invalide');
    expect(() => columnsToFuzzyDate({ precision: 'annee', value: null, valueEnd: null })).toThrow(
      'Date en base invalide',
    );
  });
});

describe('normalizePlaceLabel', () => {
  it('ignore casse, accents et espaces pour dédupliquer les lieux', () => {
    expect(normalizePlaceLabel('  Saint-Étienne ')).toBe(normalizePlaceLabel('saint-etienne'));
    expect(normalizePlaceLabel('Rodez')).not.toBe(normalizePlaceLabel('Albi'));
  });

  it('produit une clé en minuscules, sans accents, aux espaces resserrés', () => {
    expect(normalizePlaceLabel('  Saint-Étienne   du\tMont ')).toBe('saint-etienne du mont');
  });
});

describe('graphToRows / rowsToGraph', () => {
  it('la famille Marchand fait l’aller-retour sans perte', () => {
    expect(sorted(rowsToGraph(graphToRows(marchandFamily)))).toEqual(sorted(marchandFamily));
  });

  it('un lieu cité plusieurs fois n’est créé qu’une fois', () => {
    const rows = graphToRows(
      emptyGraph([
        aPerson('a', { birth: { place: 'Rodez' }, residence: 'rodez' }),
        aPerson('b', { death: { place: 'Rodez' } }),
      ]),
    );
    expect(rows.places).toHaveLength(1);
  });

  it('une fiche sans événement ne produit ni événement, ni résidence, ni fait sourcé', () => {
    const rows = graphToRows(emptyGraph([aPerson('a')]));
    expect(rows).toMatchObject({ events: [], residences: [], sourcedFacts: [], places: [] });
    expect(rows.persons).toHaveLength(1);
  });

  it('un décès connu ne devient pas une naissance', () => {
    const graph = emptyGraph([aPerson('a', { death: { date: exact(1950, 1, 2) } })]);
    const [person] = rowsToGraph(graphToRows(graph)).persons;
    expect(person?.birth).toBeUndefined();
    expect(person?.death).toEqual({ date: exact(1950, 1, 2) });
  });

  it('les champs sourcés reviennent dans un ordre stable', () => {
    const graph = emptyGraph([aPerson('a', { sourcedFields: ['death.date', 'birth.date'] })]);
    expect(rowsToGraph(graphToRows(graph)).persons[0]?.sourcedFields).toEqual([
      'birth.date',
      'death.date',
    ]);
  });

  it('le décès sans date ni lieu reste un décès', () => {
    const graph = emptyGraph([aPerson('a', { death: {} })]);
    expect(rowsToGraph(graphToRows(graph)).persons[0]?.death).toEqual({});
  });

  it('une union avec un partenaire inconnu et une fin datée', () => {
    const graph: FamilyGraph = {
      persons: [aPerson('a'), aPerson('c')],
      unions: [
        anUnion('u', 'a', null, {
          kind: 'union_libre',
          start: { precision: 'annee', year: 1980 },
          end: { reason: 'separation', date: { precision: 'vers', year: 1990 } },
        }),
      ],
      parentChildren: [aChildOf('a', 'c', { unionId: 'u', kind: 'adoptive' })],
    };
    expect(rowsToGraph(graphToRows(graph))).toEqual(graph);
  });

  it('retient la résidence en cours, la plus récente, même face à une résidence non datée', () => {
    const rows: FamilyRows = graphToRows(emptyGraph([aPerson('a')]));
    rows.places.push(
      { id: 'p1', label: 'Lyon', normalizedLabel: 'lyon' },
      { id: 'p2', label: 'Nantes', normalizedLabel: 'nantes' },
      { id: 'p3', label: 'Brest', normalizedLabel: 'brest' },
    );
    rows.residences.push(
      residence('r1', 'p1', null, null),
      residence('r2', 'p2', '2010-01-01', null),
      residence('r4', 'p1', null, null),
      residence('r3', 'p3', '2015-01-01', '2018-01-01'),
    );
    expect(rowsToGraph(rows).persons[0]?.residence).toBe('Nantes');
  });
});

function residence(id: string, placeId: string, start: string | null, end: string | null) {
  return {
    id,
    personId: 'a',
    placeId,
    startPrecision: start ? ('annee' as const) : null,
    startValue: start,
    startValueEnd: null,
    endPrecision: end ? ('annee' as const) : null,
    endValue: end,
    endValueEnd: null,
  };
}
