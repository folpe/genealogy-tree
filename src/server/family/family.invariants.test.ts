import { describe, expect, it } from 'vitest';
import {
  aChildOf,
  anUnion,
  aPerson,
  emptyGraph,
  exact,
  yearOnly,
} from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import {
  CycleError,
  InconsistentDatesError,
  SelfUnionError,
  TooManyBiologicalParentsError,
} from './family.errors';
import { buildFamilyIndex } from './family.helper';
import {
  assertCanAddParentChild,
  assertCanAddUnion,
  assertCanUpdateDates,
} from './family.invariants';

const index = buildFamilyIndex(marchandFamily);

describe('assertCanAddParentChild', () => {
  it('accepte une filiation valide', () => {
    expect(() =>
      assertCanAddParentChild(index, aChildOf('lea', 'hugo', { kind: 'a_eleve' })),
    ).not.toThrow();
  });

  it('refuse d’être son propre parent', () => {
    expect(() => assertCanAddParentChild(index, aChildOf('hugo', 'hugo'))).toThrow(CycleError);
  });

  it('refuse un cycle : Hugo parent de son arrière-grand-père', () => {
    const error = catchError(() =>
      assertCanAddParentChild(index, aChildOf('hugo', 'henri', { kind: 'adoptive' })),
    );
    expect(error).toBeInstanceOf(CycleError);
    expect(error).toMatchObject({ code: 'FAMILY_CYCLE', status: 422 });
  });

  it('refuse un troisième parent biologique', () => {
    expect(() => assertCanAddParentChild(index, aChildOf('anne', 'hugo'))).toThrow(
      TooManyBiologicalParentsError,
    );
  });

  it('accepte un troisième parent adoptif ou « a élevé »', () => {
    expect(() =>
      assertCanAddParentChild(index, aChildOf('anne', 'hugo', { kind: 'adoptive' })),
    ).not.toThrow();
  });

  it('refuse un enfant certainement né avant son parent', () => {
    expect(() => assertCanAddParentChild(index, aChildOf('hugo', 'claire'))).toThrow(
      InconsistentDatesError,
    );
  });

  it('accepte des dates approximatives qui se recouvrent', () => {
    const graph = {
      ...emptyGraph([
        aPerson('p', { birth: { date: { precision: 'vers', year: 1850 } } }),
        aPerson('e', { birth: { date: yearOnly(1848) } }),
      ]),
    };
    expect(() =>
      assertCanAddParentChild(buildFamilyIndex(graph), aChildOf('p', 'e')),
    ).not.toThrow();
  });
});

describe('assertCanAddUnion', () => {
  it('accepte une union valide', () => {
    expect(() => assertCanAddUnion(index, anUnion('u-new', 'claude', null))).not.toThrow();
  });

  it('refuse une union avec soi-même', () => {
    expect(() => assertCanAddUnion(index, anUnion('u', 'hugo', 'hugo'))).toThrow(SelfUnionError);
  });

  it('refuse une union commencée avant la naissance d’un partenaire', () => {
    expect(() =>
      assertCanAddUnion(index, anUnion('u', 'hugo', null, { start: yearOnly(1990) })),
    ).toThrow(InconsistentDatesError);
  });

  it('refuse une fin d’union avant son début', () => {
    expect(() =>
      assertCanAddUnion(
        index,
        anUnion('u', 'luc', 'anne', {
          start: yearOnly(2000),
          end: { date: yearOnly(1999), reason: 'divorce' },
        }),
      ),
    ).toThrow(InconsistentDatesError);
  });
});

describe('assertCanUpdateDates', () => {
  it('accepte une correction cohérente', () => {
    expect(() =>
      assertCanUpdateDates(index, 'henri', { death: exact(1978, 11, 12) }),
    ).not.toThrow();
  });

  it('refuse un décès avant la naissance', () => {
    expect(() => assertCanUpdateDates(index, 'henri', { death: yearOnly(1900) })).toThrow(
      InconsistentDatesError,
    );
  });

  it('refuse une naissance après celle d’un enfant', () => {
    expect(() => assertCanUpdateDates(index, 'luc', { birth: yearOnly(1996) })).toThrow(
      InconsistentDatesError,
    );
  });

  it('refuse une naissance avant celle d’un parent', () => {
    expect(() => assertCanUpdateDates(index, 'luc', { birth: yearOnly(1930) })).toThrow(
      InconsistentDatesError,
    );
  });
});

function catchError(fn: () => void): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
}
