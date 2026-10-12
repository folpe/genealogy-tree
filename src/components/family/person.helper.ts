import type { RedactedPerson } from '@/server/access/access.redact';
import type { FuzzyDate } from '@/server/family/family.types';

// Ce qu'on écrit d'une personne, selon ce que son niveau de visibilité laisse voir.
// Partagé par la fiche et par l'arbre, qui doivent dire la même chose.

export function personLabel(person: RedactedPerson): string {
  if (person.level === 'minor') return `${person.firstName} ${person.initials.slice(1)}.`;
  return `${person.firstName} ${person.lastName}`;
}

export function personInitials(person: RedactedPerson): string {
  if (person.level === 'minor') return person.initials;
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

const yearOf = (date: FuzzyDate) => (date.precision === 'entre' ? date.from : date.year);

export function lifeYears(person: RedactedPerson): string | undefined {
  if (person.level === 'minor' || person.level === 'structure') return undefined;
  const birth = person.birth?.date ? String(yearOf(person.birth.date)) : undefined;
  if (!person.death) return birth;
  const death = person.death.date ? String(yearOf(person.death.date)) : '?';
  return `${birth ?? '?'} - ${death}`;
}

export function isDeceased(person: RedactedPerson): boolean {
  return (person.level === 'full' || person.level === 'family') && person.death !== undefined;
}
