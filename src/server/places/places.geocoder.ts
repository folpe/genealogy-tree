import { z } from 'zod';

// Géocodeurs des lieux (plan phase 3, lot 7).
// - BAN, servie depuis le 2026-01-31 par la Géoplateforme de l'IGN
//   (https://data.geopf.fr/geocodage/openapi.yaml) : communes françaises, outre-mer
//   compris ; 50 requêtes par seconde.
// - Nominatim (https://operations.osmfoundation.org/policies/nominatim/) pour
//   l'étranger : une requête par seconde au plus, application identifiée par son
//   User-Agent, résultats gardés en base. Pas d'autocomplétion avec ce service.

export type FetchLike = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<Response>;

export type GeocodeCandidate = {
  geocoder: 'ban' | 'nominatim';
  /** Identifiant stable chez le géocodeur : code INSEE, ou type et numéro OSM. */
  ref: string;
  name: string;
  postcode: string | undefined;
  region: string | undefined;
  countryCode: string;
  lat: number;
  lng: number;
  /** Pertinence de 0 à 1 selon la BAN ; Nominatim n'en donne pas. */
  score: number | undefined;
  /** Contexte lisible (département, région, pays) pour départager des homonymes. */
  context: string;
};

const TIMEOUT_MS = 10_000;
const BAN_URL = 'https://data.geopf.fr/geocodage/search';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const CANDIDATES_MAX = 5;

async function getJson(fetch: FetchLike, url: URL, headers: Record<string, string> = {}) {
  const response = await fetch(url.toString(), {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url.hostname} : HTTP ${response.status}`);
  return response.json();
}

const banResponse = z.object({
  features: z.array(
    z.object({
      geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
      properties: z.object({
        citycode: z.string(),
        name: z.string(),
        postcode: z.string().optional(),
        context: z.string(),
        score: z.number(),
      }),
    }),
  ),
});

export function banGeocoder(deps: { fetch: FetchLike }) {
  return {
    async search(query: { name: string; department?: string }): Promise<GeocodeCandidate[]> {
      const url = new URL(BAN_URL);
      url.searchParams.set('q', query.name);
      url.searchParams.set('index', 'address');
      url.searchParams.set('type', 'municipality');
      url.searchParams.set('autocomplete', '0');
      url.searchParams.set('limit', String(CANDIDATES_MAX));
      if (query.department) url.searchParams.set('depcode', query.department);
      const { features } = banResponse.parse(await getJson(deps.fetch, url));
      return features.map(({ geometry, properties }) => ({
        geocoder: 'ban',
        ref: properties.citycode,
        name: properties.name,
        postcode: properties.postcode,
        // « 12, Aveyron, Occitanie » : la région vient en dernier.
        region: properties.context.split(', ').at(-1),
        countryCode: 'FR',
        lat: geometry.coordinates[1],
        lng: geometry.coordinates[0],
        score: properties.score,
        context: properties.context,
      }));
    },
  };
}

const nominatimResponse = z.array(
  z.object({
    osm_type: z.string(),
    osm_id: z.number(),
    name: z.string(),
    display_name: z.string(),
    lat: z.coerce.number(),
    lon: z.coerce.number(),
    address: z.object({
      country_code: z.string(),
      postcode: z.string().optional(),
      state: z.string().optional(),
      county: z.string().optional(),
    }),
  }),
);

export function nominatimGeocoder(deps: {
  fetch: FetchLike;
  userAgent: string;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  intervalMs?: number;
}) {
  const interval_ms = deps.intervalMs ?? 1_100;
  let last_request_ms: number | undefined;

  async function search(params: Record<string, string>): Promise<GeocodeCandidate[]> {
    if (last_request_ms !== undefined) {
      const wait_ms = last_request_ms + interval_ms - deps.now();
      if (wait_ms > 0) await deps.sleep(wait_ms);
    }
    last_request_ms = deps.now();
    const url = new URL(NOMINATIM_URL);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'fr');
    url.searchParams.set('limit', String(CANDIDATES_MAX));
    const json = await getJson(deps.fetch, url, { 'User-Agent': deps.userAgent });
    return nominatimResponse.parse(json).map((place) => ({
      geocoder: 'nominatim',
      ref: `${place.osm_type}/${place.osm_id}`,
      name: place.name,
      postcode: place.address.postcode,
      region: place.address.state ?? place.address.county,
      countryCode: place.address.country_code.toUpperCase(),
      lat: place.lat,
      lng: place.lon,
      score: undefined,
      context: place.display_name,
    }));
  }

  return {
    locality: (query: { name: string; countryCode?: string | undefined }) =>
      search({
        city: query.name,
        ...(query.countryCode ? { countrycodes: query.countryCode.toLowerCase() } : {}),
      }),
    country: (countryCode: string) =>
      search({ country: countryCode.toLowerCase(), featureType: 'country' }),
  };
}
