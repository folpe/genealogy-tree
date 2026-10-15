import { describe, expect, it } from 'vitest';
import banEmpty from '../../../tests/fixtures/geocoding/ban-empty.json';
import banRodez from '../../../tests/fixtures/geocoding/ban-rodez.json';
import banSaintDenis from '../../../tests/fixtures/geocoding/ban-saint-denis.json';
import nominatimPorto from '../../../tests/fixtures/geocoding/nominatim-porto.json';
import nominatimPortugal from '../../../tests/fixtures/geocoding/nominatim-portugal.json';
import { banGeocoder, type FetchLike, nominatimGeocoder } from './places.geocoder';

// Réponses réelles de la Géoplateforme (BAN) et de Nominatim, enregistrées le
// 2026-10-12 sur des lieux publics sans lien avec la famille.

function recordedFetch(body: unknown, status = 200) {
  const calls: { url: URL; headers: Record<string, string> }[] = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({ url: new URL(url), headers: init.headers });
    return new Response(JSON.stringify(body), { status });
  };
  return { fetch, calls };
}

describe('banGeocoder', () => {
  it('cherche une commune et la décrit', async () => {
    const { fetch, calls } = recordedFetch(banRodez);
    const candidates = await banGeocoder({ fetch }).search({ name: 'Rodez' });

    expect(candidates).toEqual([
      {
        geocoder: 'ban',
        ref: '12202',
        name: 'Rodez',
        postcode: '12000',
        region: 'Occitanie',
        countryCode: 'FR',
        lat: 44.359272,
        lng: 2.566732,
        score: expect.closeTo(0.95, 2),
        context: '12, Aveyron, Occitanie',
      },
    ]);
    const params = calls[0]?.url.searchParams;
    expect(calls[0]?.url.href.split('?')[0]).toBe('https://data.geopf.fr/geocodage/search');
    expect(params?.get('q')).toBe('Rodez');
    expect(params?.get('index')).toBe('address');
    expect(params?.get('type')).toBe('municipality');
    expect(params?.get('autocomplete')).toBe('0');
    expect(params?.has('depcode')).toBe(false);
  });

  it('filtre par département quand le libellé le donne', async () => {
    const { fetch, calls } = recordedFetch(banRodez);
    await banGeocoder({ fetch }).search({ name: 'Rodez', department: '12' });
    expect(calls[0]?.url.searchParams.get('depcode')).toBe('12');
  });

  it('rend tous les homonymes, outre-mer compris', async () => {
    const { fetch } = recordedFetch(banSaintDenis);
    const candidates = await banGeocoder({ fetch }).search({ name: 'Saint-Denis' });
    expect(candidates.map((c) => c.ref).slice(0, 3)).toEqual(['97411', '93066', '11339']);
    expect(candidates[0]).toMatchObject({ region: 'La Réunion', countryCode: 'FR' });
  });

  it('rend une liste vide quand rien ne correspond', async () => {
    const { fetch } = recordedFetch(banEmpty);
    expect(await banGeocoder({ fetch }).search({ name: 'Atlantide' })).toEqual([]);
  });

  it('échoue sur une erreur HTTP ou une réponse inattendue', async () => {
    await expect(
      banGeocoder({ fetch: recordedFetch({}, 503).fetch }).search({ name: 'Rodez' }),
    ).rejects.toThrow('503');
    await expect(
      banGeocoder({ fetch: recordedFetch({ features: 'non' }).fetch }).search({ name: 'Rodez' }),
    ).rejects.toThrow();
  });
});

describe('nominatimGeocoder', () => {
  const clock = () => {
    let now = 0;
    const waits: number[] = [];
    return {
      waits,
      now: () => now,
      sleep: async (ms: number) => {
        waits.push(ms);
        now += ms;
      },
      advance: (ms: number) => {
        now += ms;
      },
    };
  };
  const userAgent = 'racines/test (+https://famille.test)';

  it('cherche une ville dans un pays, en français, en se présentant', async () => {
    const { fetch, calls } = recordedFetch(nominatimPorto);
    const time = clock();
    const geocoder = nominatimGeocoder({ fetch, userAgent, now: time.now, sleep: time.sleep });
    const candidates = await geocoder.locality({ name: 'Porto', countryCode: 'PT' });

    expect(candidates).toEqual([
      {
        geocoder: 'nominatim',
        ref: 'relation/3372453',
        name: 'Porto',
        postcode: undefined,
        region: 'Porto',
        countryCode: 'PT',
        lat: 41.1502195,
        lng: -8.6103497,
        score: undefined,
        context: expect.stringContaining('Portugal'),
      },
    ]);
    const params = calls[0]?.url.searchParams;
    expect(calls[0]?.headers['User-Agent']).toBe(userAgent);
    expect(params?.get('city')).toBe('Porto');
    expect(params?.get('countrycodes')).toBe('pt');
    expect(params?.get('accept-language')).toBe('fr');
    expect(params?.get('format')).toBe('jsonv2');
  });

  it('cherche un pays seul', async () => {
    const { fetch, calls } = recordedFetch(nominatimPortugal);
    const time = clock();
    const geocoder = nominatimGeocoder({ fetch, userAgent, now: time.now, sleep: time.sleep });
    const [portugal] = await geocoder.country('PT');

    expect(portugal).toMatchObject({ name: 'Portugal', countryCode: 'PT', region: undefined });
    expect(calls[0]?.url.searchParams.get('country')).toBe('pt');
    expect(calls[0]?.url.searchParams.get('featureType')).toBe('country');
  });

  it('attend entre deux requêtes pour rester sous une par seconde', async () => {
    const { fetch } = recordedFetch(nominatimPortugal);
    const time = clock();
    const geocoder = nominatimGeocoder({ fetch, userAgent, now: time.now, sleep: time.sleep });
    await geocoder.country('PT');
    time.advance(300);
    await geocoder.country('PT');
    time.advance(5_000);
    await geocoder.country('PT');

    expect(time.waits).toEqual([800]);
  });

  it('échoue sur une erreur HTTP', async () => {
    const time = clock();
    const geocoder = nominatimGeocoder({
      fetch: recordedFetch([], 429).fetch,
      userAgent,
      now: time.now,
      sleep: time.sleep,
    });
    await expect(geocoder.country('PT')).rejects.toThrow('429');
  });
});
