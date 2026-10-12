import type { FuzzyDate, Gender, Person, Union } from '../family/family.types';
import type { VisibilityLevel } from './access.types';

// Projection d'une fiche selon le niveau de visibilité. Les champs retirés sont
// absents de l'objet (jamais `null`), pour ne rien laisser fuiter vers le client,
// et le type de sortie reflète ce qui reste.

type Identity = { id: string; firstName: string; lastName: string; gender: Gender };

export type RedactedPerson =
  | ({ level: 'full' } & Person)
  | ({ level: 'family' } & Identity & {
        birthName?: string;
        birth?: { date?: FuzzyDate; place?: string };
        death?: Person['death'];
      })
  | ({ level: 'structure' } & Identity & { birthName?: string })
  | { level: 'minor'; id: string; firstName: string; initials: string; gender: Gender };

/** Ramène une date à l'année (les précisions déjà à l'année sont gardées). */
function toYear(date: FuzzyDate): FuzzyDate {
  return date.precision === 'exacte' || date.precision === 'mois'
    ? { precision: 'annee', year: date.year }
    : date;
}

function identity(person: Person): Identity {
  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    gender: person.gender,
  };
}

export function redactPerson(person: Person, level: VisibilityLevel): RedactedPerson {
  switch (level) {
    case 'full':
      return { level, ...person };
    case 'family': {
      const birth = person.birth && {
        ...(person.birth.date ? { date: toYear(person.birth.date) } : {}),
        ...(person.birth.place ? { place: person.birth.place } : {}),
      };
      return {
        level,
        ...identity(person),
        ...(person.birthName ? { birthName: person.birthName } : {}),
        ...(birth ? { birth } : {}),
        ...(person.death ? { death: person.death } : {}),
      };
    }
    case 'structure':
      return {
        level,
        ...identity(person),
        ...(person.birthName ? { birthName: person.birthName } : {}),
      };
    case 'minor':
      return {
        level,
        id: person.id,
        firstName: person.firstName,
        initials: `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase(),
        gender: person.gender,
      };
  }
}

/**
 * Projection d'une union selon le niveau le plus restrictif de ses partenaires :
 * dates gardées en `full`, ramenées à l'année en `family`, retirées au-delà (le
 * lien et sa nature restent, comme le nom sur une fiche restreinte).
 */
export function redactUnion(union: Union, level: VisibilityLevel): Union {
  if (level === 'full') return union;
  const { start, end, ...rest } = union;
  if (level !== 'family') {
    return { ...rest, ...(end ? { end: { reason: end.reason } } : {}) };
  }
  return {
    ...rest,
    ...(start ? { start: toYear(start) } : {}),
    ...(end
      ? { end: { reason: end.reason, ...(end.date ? { date: toYear(end.date) } : {}) } }
      : {}),
  };
}
