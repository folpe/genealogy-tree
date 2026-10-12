// tdd-cover: e2e src/server/places/places.service.integration.test.ts
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { places } from '../db/schema';
import type { Db } from '../db/types';
import type { banGeocoder, GeocodeCandidate, nominatimGeocoder } from './places.geocoder';
import { type PlaceQuery, parsePlaceLabel } from './places.label';
import { type GeocodeVerdict, judgeCandidates } from './places.verdict';

// Géocodage des lieux en attente (plan phase 3, lot 7). La table `places` sert de
// cache : un lieu déjà géocodé, à la main ou non, n'est plus jamais interrogé ni
// réécrit. Ce qui reste douteux est rapporté pour une revue, sans rien inscrire.

export type PlacesDeps = {
  db: Db;
  ban: ReturnType<typeof banGeocoder>;
  nominatim: ReturnType<typeof nominatimGeocoder>;
};

type PlaceReview = {
  placeId: string;
  label: string;
  reason:
    | 'non_geocodable'
    | 'introuvable'
    | 'homonymes'
    | 'score_faible'
    | 'precisant_absent'
    | 'pays_incertain'
    | 'erreur';
  candidates: GeocodeCandidate[];
  error?: string;
};

export type GeocodeReport = { geocoded: number; alreadyDone: number; reviews: PlaceReview[] };

/** Un même appel n'est fait qu'une fois par passage, quel que soit le libellé d'origine. */
function memoize<A extends unknown[]>(
  call: (...args: A) => Promise<GeocodeCandidate[]>,
): (...args: A) => Promise<GeocodeCandidate[]> {
  const seen = new Map<string, Promise<GeocodeCandidate[]>>();
  return (...args) => {
    const key = JSON.stringify(args);
    const known = seen.get(key);
    if (known) return known;
    const pending = call(...args);
    seen.set(key, pending);
    return pending;
  };
}

type Lookups = {
  ban: PlacesDeps['ban']['search'];
  locality: PlacesDeps['nominatim']['locality'];
  country: PlacesDeps['nominatim']['country'];
};

async function geocode(query: PlaceQuery, lookups: Lookups): Promise<GeocodeVerdict> {
  if (query.kind === 'unknown') return { status: 'not_found' };
  if (query.kind === 'country') {
    return judgeCandidates(await lookups.country(query.countryCode), { hint: undefined });
  }
  const { name, countryCode, department, hint } = query;
  if (countryCode && countryCode !== 'FR') {
    return judgeCandidates(await lookups.locality({ name, countryCode }), { hint });
  }
  const banQuery = department ? { name, department } : { name };
  const ban = judgeCandidates(await lookups.ban(banQuery), { hint });
  const doubtful =
    ban.status === 'not_found' || (ban.status === 'review' && ban.reason === 'score_faible');
  // Une commune seule, absente de la BAN, est peut-être à l'étranger.
  if (countryCode || !doubtful) return ban;
  const abroad = judgeCandidates(await lookups.locality({ name, countryCode: undefined }), {
    hint,
  });
  if (abroad.status !== 'found') return abroad.status === 'not_found' ? ban : abroad;
  // Pays deviné, pas lu : une faute sur une commune française tomberait à l'étranger.
  return { status: 'review', reason: 'pays_incertain', candidates: [abroad.best] };
}

function reviewOf(
  place: { id: string; label: string },
  query: PlaceQuery,
  verdict: Exclude<GeocodeVerdict, { status: 'found' }>,
): PlaceReview {
  const base = { placeId: place.id, label: place.label };
  if (verdict.status === 'review') {
    return { ...base, reason: verdict.reason, candidates: verdict.candidates };
  }
  const reason = query.kind === 'unknown' ? 'non_geocodable' : 'introuvable';
  return { ...base, reason, candidates: [] };
}

/** Champs d'un lieu encore vide : seuls les champs connus sont écrits. */
function placeFields(query: PlaceQuery, best: GeocodeCandidate) {
  return {
    ...(query.kind === 'locality' ? { city: best.name } : {}),
    ...(best.postcode ? { postcode: best.postcode } : {}),
    ...(best.region ? { region: best.region } : {}),
    ...(best.score !== undefined ? { geocodeScore: best.score } : {}),
    country: best.countryCode,
    lat: best.lat,
    lng: best.lng,
    geocoder: best.geocoder,
  };
}

export async function geocodePlaces(
  deps: PlacesDeps,
  options: { dryRun: boolean },
): Promise<GeocodeReport> {
  const done = await deps.db.$count(places, isNotNull(places.geocoder));
  const pending = await deps.db
    .select({ id: places.id, label: places.label })
    .from(places)
    .where(isNull(places.geocoder))
    .orderBy(places.label);
  const lookups: Lookups = {
    ban: memoize(deps.ban.search),
    locality: memoize(deps.nominatim.locality),
    country: memoize(deps.nominatim.country),
  };

  const report: GeocodeReport = { geocoded: 0, alreadyDone: done, reviews: [] };
  // En série : Nominatim impose une requête par seconde, et le volume est petit.
  for (const place of pending) {
    const query = parsePlaceLabel(place.label);
    let verdict: GeocodeVerdict;
    try {
      verdict = await geocode(query, lookups);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.reviews.push({
        placeId: place.id,
        label: place.label,
        reason: 'erreur',
        candidates: [],
        error: message,
      });
      continue;
    }
    if (verdict.status !== 'found') {
      report.reviews.push(reviewOf(place, query, verdict));
      continue;
    }
    if (options.dryRun) {
      report.geocoded += 1;
      continue;
    }
    const written = await deps.db
      .update(places)
      .set(placeFields(query, verdict.best))
      // Un lieu géocodé entre-temps, à la main par exemple, n'est pas écrasé.
      .where(and(eq(places.id, place.id), isNull(places.geocoder)))
      .returning({ id: places.id });
    report.geocoded += written.length;
  }
  return report;
}
