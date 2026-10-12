import { normalizePlaceLabel } from '../family/family.mapper';

// Lecture d'un libellé de lieu saisi à la main (plan phase 3, lot 7) avant le
// géocodage : « Rodez (12) », « Rodez, Aveyron », « Paris 13 (France) », « Cambodge ».
// Le libellé lui-même n'est jamais réécrit ; cette lecture ne sert qu'à interroger
// les géocodeurs.

export type PlaceQuery =
  | { kind: 'unknown' }
  | { kind: 'country'; countryCode: string }
  | {
      kind: 'locality';
      name: string;
      /** Code ISO 3166 alpha-2 ; absent, la commune est d'abord cherchée en France. */
      countryCode: string | undefined;
      /** Code de département français : « 12 », « 2A », « 974 ». */
      department: string | undefined;
      /** Autre précisant (département ou région en toutes lettres). */
      hint: string | undefined;
    };

const PLACEHOLDERS = new Set(['', '?', '-', 'n/a', 'nc', 'inconnu', 'non renseigne', 'nowhere']);
const DEPARTMENT = /^(?:\d{2,3}|2[ab])$/i;
const QUALIFIED = /^(.*?)\s*(?:\(([^)]*)\)|,\s*([^,]+))\s*$/;
const ARRONDISSEMENT = /^(paris|lyon|marseille)\s+(\d{1,2})\s*(?:e|er|eme|ème)?$/i;

/** Codes connus d'ICU mais retirés de l'ISO 3166 ou qui ne sont pas des pays. */
const NOT_COUNTRIES = new Set(
  'AN BU CS DD DY EU EZ FX HV NH NT QO RH SU TP UK UN VD XA XB YD YU ZR'.split(' '),
);

/** Noms de pays en français, accents et casse ignorés, vers leur code ISO. */
const COUNTRIES: ReadonlyMap<string, string> = (() => {
  const names = new Intl.DisplayNames(['fr'], { type: 'region' });
  const countries = new Map<string, string>();
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const name = names.of(code);
      if (name && name !== code && !NOT_COUNTRIES.has(code)) {
        countries.set(normalizePlaceLabel(name), code);
      }
    }
  }
  return countries;
})();

const countryCodeOf = (name: string) => COUNTRIES.get(normalizePlaceLabel(name));

/** « St » et « Ste » en toutes lettres, apostrophe droite, arrondissement nommé comme la BAN. */
function expandName(name: string): string {
  const expanded = name
    .replace(/’/g, "'")
    .replace(
      /(^|[\s-])(Ste?)(?=$|[\s-])/g,
      (_, before: string, short: string) => `${before}${short === 'St' ? 'Saint' : 'Sainte'}`,
    );
  const arrondissement = ARRONDISSEMENT.exec(expanded);
  if (!arrondissement) return expanded;
  const [, city = '', number = ''] = arrondissement;
  const city_name = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  return `${city_name} ${number}${number === '1' ? 'er' : 'e'} Arrondissement`;
}

export function parsePlaceLabel(label: string): PlaceQuery {
  const trimmed = label.trim();
  if (PLACEHOLDERS.has(normalizePlaceLabel(trimmed))) return { kind: 'unknown' };
  const country = countryCodeOf(trimmed);
  if (country) return { kind: 'country', countryCode: country };

  const qualified = QUALIFIED.exec(trimmed);
  const name = (qualified?.[1] || trimmed).trim();
  const qualifier = (qualified?.[2] ?? qualified?.[3] ?? '').trim();
  const qualifierCountry = qualifier ? countryCodeOf(qualifier) : undefined;
  const department = DEPARTMENT.test(qualifier) ? qualifier.toUpperCase() : undefined;
  return {
    kind: 'locality',
    name: expandName(name),
    countryCode: qualifierCountry ?? (department ? 'FR' : undefined),
    department,
    hint: qualifier && !qualifierCountry && !department ? qualifier : undefined,
  };
}
