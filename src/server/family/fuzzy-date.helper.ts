import { type FuzzyDate, type FuzzyDatePrecision, fuzzyDateSchema } from './family.types';

/** Marge appliquée de part et d'autre d'une date « vers ». */
export const VERS_MARGIN_YEARS = 5;

export type Ymd = { year: number; month: number; day: number };

/** Intervalle couvert par une date ; `null` = borne ouverte. */
export type FuzzyDateRange = { min: Ymd | null; max: Ymd | null };

export type Age = {
  /** Âge à afficher : le plus grand âge possible, sinon le plus petit. */
  value: number;
  min: number | null;
  max: number | null;
  approx: boolean;
};

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const MONTH_BY_NAME = new Map(MONTHS.map((name, i) => [fold(name), i + 1]));

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function validated(candidate: unknown): FuzzyDate | null {
  const result = fuzzyDateSchema.safeParse(candidate);
  return result.success ? result.data : null;
}

/**
 * Lit une saisie libre en français : « 12/03/1987 », « 1er mars 1987 »,
 * « mars 1987 », « 1987 », « vers 1850 », « avant 1900 », « après 1900 »,
 * « entre 1880 et 1885 ». Retourne `null` si la saisie est illisible ou impossible.
 */
const PREFIXES: Record<string, 'vers' | 'avant' | 'apres'> = {
  vers: 'vers',
  environ: 'vers',
  avant: 'avant',
  apres: 'apres',
};

/** Règles de lecture, essayées dans l'ordre ; chacune reçoit les groupes capturés. */
const PARSE_RULES: [RegExp, (g: string[]) => unknown][] = [
  [
    /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/,
    ([d, m, y]) => ({ precision: 'exacte', year: Number(y), month: Number(m), day: Number(d) }),
  ],
  [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    ([y, m, d]) => ({ precision: 'exacte', year: Number(y), month: Number(m), day: Number(d) }),
  ],
  [
    /^(\d{1,2})(?:er)? ([a-z]+) (\d{1,4})$/,
    ([d, name, y]) => {
      const month = MONTH_BY_NAME.get(name ?? '');
      return month && { precision: 'exacte', year: Number(y), month, day: Number(d) };
    },
  ],
  [
    /^([a-z]+) (\d{1,4})$/,
    ([word, y]) => {
      const month = MONTH_BY_NAME.get(word ?? '');
      if (month) return { precision: 'mois', year: Number(y), month };
      const prefix = PREFIXES[word ?? ''];
      return prefix && { precision: prefix, year: Number(y) };
    },
  ],
  [
    /^entre (\d{1,4}) et (\d{1,4})$/,
    ([from, to]) => ({ precision: 'entre', from: Number(from), to: Number(to) }),
  ],
  [/^(\d{1,4})$/, ([y]) => ({ precision: 'annee', year: Number(y) })],
];

/**
 * Lit une saisie libre en français : « 12/03/1987 », « 1er mars 1987 »,
 * « mars 1987 », « 1987 », « vers 1850 », « avant 1900 », « après 1900 »,
 * « entre 1880 et 1885 ». Retourne `null` si la saisie est illisible ou impossible.
 */
export function parseFuzzyDate(input: string): FuzzyDate | null {
  const s = fold(input.trim()).replace(/\s+/g, ' ');
  for (const [pattern, build] of PARSE_RULES) {
    const match = s.match(pattern);
    if (match) return validated(build(match.slice(1)));
  }
  return null;
}

/** Format français : « 1er mars 1987 », « mars 1987 », « vers 1850 »... */
export function formatFuzzyDate(date: FuzzyDate): string {
  switch (date.precision) {
    case 'exacte':
      return `${date.day === 1 ? '1er' : date.day} ${MONTHS[date.month - 1]} ${date.year}`;
    case 'mois':
      return `${MONTHS[date.month - 1]} ${date.year}`;
    case 'annee':
      return String(date.year);
    case 'vers':
      return `vers ${date.year}`;
    case 'avant':
      return `avant ${date.year}`;
    case 'apres':
      return `après ${date.year}`;
    case 'entre':
      return `entre ${date.from} et ${date.to}`;
  }
}

const startOfYear = (year: number): Ymd => ({ year, month: 1, day: 1 });
const endOfYear = (year: number): Ymd => ({ year, month: 12, day: 31 });

/** Intervalle de jours que la date peut désigner. */
export function fuzzyDateRange(date: FuzzyDate): FuzzyDateRange {
  switch (date.precision) {
    case 'exacte': {
      const day = { year: date.year, month: date.month, day: date.day };
      return { min: day, max: { ...day } };
    }
    case 'mois':
      return {
        min: { year: date.year, month: date.month, day: 1 },
        max: { year: date.year, month: date.month, day: daysInMonth(date.year, date.month) },
      };
    case 'annee':
      return { min: startOfYear(date.year), max: endOfYear(date.year) };
    case 'vers':
      return {
        min: startOfYear(date.year - VERS_MARGIN_YEARS),
        max: endOfYear(date.year + VERS_MARGIN_YEARS),
      };
    case 'avant':
      return { min: null, max: endOfYear(date.year - 1) };
    case 'apres':
      return { min: startOfYear(date.year + 1), max: null };
    case 'entre':
      return { min: startOfYear(date.from), max: endOfYear(date.to) };
  }
}

function compareYmd(a: Ymd, b: Ymd): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Ordre de départage entre précisions, de la plus sûre à la plus vague. */
const PRECISION_RANK: Record<FuzzyDatePrecision, number> = {
  exacte: 0,
  mois: 1,
  annee: 2,
  entre: 3,
  vers: 4,
  apres: 5,
  avant: 6,
};

/** Point de tri : début de l'intervalle, ou sa fin pour une borne basse ouverte (« avant »). */
function sortPoint(date: FuzzyDate): Ymd {
  const { min, max } = fuzzyDateRange(date);
  // Une date a toujours au moins une borne fermée.
  return (min ?? max) as Ymd;
}

/**
 * Ordre total et stable entre dates de précisions différentes : par point de tri
 * (début de la période couverte, fin pour « avant »), puis de la précision la plus
 * sûre à la plus vague, puis par fin de période.
 */
export function compareFuzzyDates(a: FuzzyDate, b: FuzzyDate): number {
  const byPoint = compareYmd(sortPoint(a), sortPoint(b));
  if (byPoint !== 0) return byPoint;
  const byRank = PRECISION_RANK[a.precision] - PRECISION_RANK[b.precision];
  if (byRank !== 0) return byRank;
  const maxA = fuzzyDateRange(a).max;
  const maxB = fuzzyDateRange(b).max;
  if (maxA && maxB) return compareYmd(maxA, maxB);
  return maxA ? -1 : maxB ? 1 : 0;
}

function yearsBetween(from: Ymd, to: Ymd): number {
  const beforeBirthday = to.month < from.month || (to.month === from.month && to.day < from.day);
  return to.year - from.year - (beforeBirthday ? 1 : 0);
}

/**
 * Âge à une date donnée (ou au décès). Exact si les deux dates le sont, sinon
 * approché avec ses bornes. `null` si la personne n'est certainement pas née.
 */
export function ageAt(birth: FuzzyDate, at: FuzzyDate): Age | null {
  const b = fuzzyDateRange(birth);
  const t = fuzzyDateRange(at);
  const rawMin = b.max && t.min ? yearsBetween(b.max, t.min) : null;
  const max = b.min && t.max ? yearsBetween(b.min, t.max) : null;
  if (max !== null && max < 0) return null;
  const min = rawMin === null ? null : Math.max(0, rawMin);
  const value = max ?? min;
  if (value === null) return null;
  return { value, min, max, approx: min !== max };
}

/** Vrai seulement si `a` précède `b` quelle que soit l'interprétation des deux dates. */
export function isCertainlyBefore(a: FuzzyDate, b: FuzzyDate): boolean {
  const endOfA = fuzzyDateRange(a).max;
  const startOfB = fuzzyDateRange(b).min;
  return endOfA !== null && startOfB !== null && compareYmd(endOfA, startOfB) < 0;
}

/** Date du jour, au jour près, dans un fuseau donné (l'âge d'un vivant en dépend). */
export function todayIn(now: Date, timeZone: string): FuzzyDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { precision: 'exacte', year: part('year'), month: part('month'), day: part('day') };
}
