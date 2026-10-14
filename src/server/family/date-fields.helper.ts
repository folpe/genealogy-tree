import { z } from 'zod';
import { ValidationError } from '../_shared/errors';
import { type FuzzyDate, fuzzyDateSchema } from './family.types';

// Champ date des formulaires (retour de Folpe : « un champ date, affiché en lettres,
// enregistré en date ») : le sélecteur de date du téléphone pour une date exacte ; une
// case « Date approximative » le remplace par une précision et une ou deux années. Pur
// et partagé : l'écran s'en sert pour l'aperçu, le serveur pour enregistrer.

/** Précisions proposées quand la case « Date approximative » est cochée. */
export const APPROX_PRECISIONS = ['annee', 'mois', 'vers', 'avant', 'apres', 'entre'] as const;
type ApproxPrecision = (typeof APPROX_PRECISIONS)[number];

export type DateFieldsResult = { ok: true; date?: FuzzyDate } | { ok: false; message: string };

/** Noms des champs d'une date : `birth`, `birthApprox`, `birthPrecision`... */
export function dateFieldNames(prefix: string) {
  return {
    exact: prefix,
    approx: `${prefix}Approx`,
    precision: `${prefix}Precision`,
    year: `${prefix}Year`,
    month: `${prefix}Month`,
    yearEnd: `${prefix}YearEnd`,
  } as const;
}

const pad = (value: number, length: number) => String(value).padStart(length, '0');

/** Valeurs de formulaire d'une date ; chaque champ en a une, même vide. */
export function dateFieldValues(prefix: string, date?: FuzzyDate): Record<string, string> {
  const n = dateFieldNames(prefix);
  const empty = {
    [n.exact]: '',
    [n.approx]: '',
    [n.precision]: 'annee',
    [n.year]: '',
    [n.month]: '',
    [n.yearEnd]: '',
  };
  if (!date) return empty;
  if (date.precision === 'exacte') {
    return {
      ...empty,
      [n.exact]: `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`,
    };
  }
  const approx = { ...empty, [n.approx]: 'on', [n.precision]: date.precision };
  if (date.precision === 'entre') {
    return { ...approx, [n.year]: String(date.from), [n.yearEnd]: String(date.to) };
  }
  const month = date.precision === 'mois' ? String(date.month) : '';
  return { ...approx, [n.year]: String(date.year), [n.month]: month };
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const NUMBER = /^\d{1,4}$/;
const EXACT = /^(\d{4})-(\d{2})-(\d{2})$/;

const IMPOSSIBLE_DAY = 'Date impossible : vérifie le jour, le mois et l’année';
const IMPOSSIBLE_YEAR = 'Année impossible : entre 1 et 9999';

function checked(candidate: unknown, message = IMPOSSIBLE_YEAR): DateFieldsResult {
  const parsed = fuzzyDateSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, date: parsed.data };
  return { ok: false, message };
}

function readExact(value: string): DateFieldsResult {
  if (value === '') return { ok: true };
  const match = EXACT.exec(value);
  if (!match) return { ok: false, message: 'Date illisible : choisis-la dans le calendrier' };
  const [, year, month, day] = match.map(Number);
  return checked({ precision: 'exacte', year, month, day }, IMPOSSIBLE_DAY);
}

const isApprox = (value: string): value is ApproxPrecision =>
  APPROX_PRECISIONS.some((p) => p === value);

function readApprox(fields: Record<string, unknown>, prefix: string): DateFieldsResult {
  const n = dateFieldNames(prefix);
  const precision = text(fields[n.precision]);
  const year = text(fields[n.year]);
  if (!isApprox(precision)) return { ok: false, message: 'Précision de date inconnue' };
  if (year === '') return { ok: true };
  if (!NUMBER.test(year)) return { ok: false, message: 'L’année s’écrit en chiffres : 1850' };
  if (precision === 'mois') {
    const month = text(fields[n.month]);
    if (month === '') return { ok: false, message: 'Choisis le mois' };
    return checked({ precision, year: Number(year), month: Number(month) });
  }
  if (precision === 'entre') {
    const end = text(fields[n.yearEnd]);
    if (!NUMBER.test(end)) return { ok: false, message: 'Indique la deuxième année' };
    if (Number(year) > Number(end)) {
      return { ok: false, message: 'La première année doit précéder la seconde' };
    }
    return checked({ precision, from: Number(year), to: Number(end) });
  }
  return checked({ precision, year: Number(year) });
}

/** Lit la date d'un formulaire ; rien de saisi donne `{ ok: true }` sans date. */
export function readDateFields(fields: Record<string, unknown>, prefix: string): DateFieldsResult {
  const n = dateFieldNames(prefix);
  const approx = fields[n.approx] === 'on' || fields[n.approx] === true;
  return approx ? readApprox(fields, prefix) : readExact(text(fields[n.exact]));
}

const formFields = z.record(z.string(), z.unknown());

/**
 * Côté serveur : la date d'une saisie brute, ou une erreur de validation dont la
 * cause zod porte le message à montrer (le contrat des actions).
 */
export function parseDateFields(raw: unknown, prefix: string): FuzzyDate | undefined {
  const parsed = formFields
    .catch({})
    .transform((fields, ctx) => {
      const result = readDateFields(fields, prefix);
      if (result.ok) return result.date;
      ctx.addIssue({ code: 'custom', message: result.message, path: [prefix] });
      return z.NEVER;
    })
    .safeParse(raw);
  if (parsed.success) return parsed.data;
  throw new ValidationError(parsed.error.issues[0]?.message ?? 'Date invalide', parsed.error);
}
