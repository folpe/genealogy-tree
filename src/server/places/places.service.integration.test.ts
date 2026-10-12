import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { testDb } from '../../../tests/integration/test-db';
import { places } from '../db/schema';
import { normalizePlaceLabel } from '../family/family.mapper';
import type { GeocodeCandidate } from './places.geocoder';
import { geocodePlaces, type PlacesDeps, pickPlace } from './places.service';

const db = testDb();

const aCandidate = (patch: Partial<GeocodeCandidate>): GeocodeCandidate => ({
  geocoder: 'ban',
  ref: '12202',
  name: 'Rodez',
  postcode: '12000',
  region: 'Occitanie',
  countryCode: 'FR',
  lat: 44.36,
  lng: 2.57,
  score: 0.95,
  context: '12, Aveyron, Occitanie',
  ...patch,
});
const porto = aCandidate({
  geocoder: 'nominatim',
  ref: 'relation/1',
  name: 'Porto',
  postcode: undefined,
  region: 'Porto',
  countryCode: 'PT',
  lat: 41.15,
  lng: -8.61,
  score: undefined,
  context: 'Porto, Portugal',
});
const portugal = aCandidate({ ...porto, ref: 'relation/2', name: 'Portugal', region: undefined });

/** Géocodeurs enregistrés : chaque appel est noté, les réponses viennent de la table. */
function fakeGeocoders(answers: {
  ban?: Record<string, GeocodeCandidate[]>;
  nominatim?: Record<string, GeocodeCandidate[]>;
}) {
  const calls: string[] = [];
  const deps: Omit<PlacesDeps, 'db'> = {
    ban: {
      search: async ({ name, department }) => {
        calls.push(`ban:${name}${department ? `/${department}` : ''}`);
        if (name === 'Panne') throw new Error('data.geopf.fr : HTTP 503');
        return answers.ban?.[name] ?? [];
      },
    },
    nominatim: {
      locality: async ({ name, countryCode }) => {
        calls.push(`nominatim:${name}/${countryCode ?? '-'}`);
        return answers.nominatim?.[name] ?? [];
      },
      country: async (code) => {
        calls.push(`nominatim:pays/${code}`);
        return answers.nominatim?.[code] ?? [];
      },
    },
  };
  return { deps, calls };
}

describe.skipIf(!db)('places.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;

  const seed = (...labels: string[]) =>
    client
      .insert(places)
      .values(labels.map((label) => ({ label, normalizedLabel: normalizePlaceLabel(label) })));
  const row = async (label: string) => {
    const [found] = await client
      .select()
      .from(places)
      .where(eq(places.normalizedLabel, normalizePlaceLabel(label)));
    return found;
  };

  beforeEach(async () => {
    await reset();
  });
  afterAll(async () => {
    await close();
  });

  it('géocode une commune française, une ville étrangère et un pays', async () => {
    await seed('Rodez (12)', 'Porto, Portugal', 'Portugal');
    const { deps } = fakeGeocoders({
      ban: { Rodez: [aCandidate({})] },
      nominatim: { Porto: [porto], PT: [portugal] },
    });

    const report = await geocodePlaces({ db: client, ...deps }, { dryRun: false });

    expect(report).toEqual({ geocoded: 3, alreadyDone: 0, reviews: [] });
    expect(await row('Rodez (12)')).toMatchObject({
      city: 'Rodez',
      postcode: '12000',
      region: 'Occitanie',
      country: 'FR',
      lat: 44.36,
      lng: 2.57,
      geocoder: 'ban',
      geocodeScore: expect.closeTo(0.95, 5),
    });
    expect(await row('Porto, Portugal')).toMatchObject({
      city: 'Porto',
      country: 'PT',
      geocoder: 'nominatim',
      geocodeScore: null, // allow-null: Nominatim ne donne pas de score
    });
    expect(await row('Portugal')).toMatchObject({
      city: null, // allow-null: un pays seul n'a pas de commune
      country: 'PT',
      lat: 41.15,
    });
  });

  it('interroge la BAN avec le département, Nominatim avec le pays', async () => {
    await seed('Rodez (12)', 'Porto (Portugal)');
    const { deps, calls } = fakeGeocoders({});
    await geocodePlaces({ db: client, ...deps }, { dryRun: false });
    expect(calls.sort()).toEqual(['ban:Rodez/12', 'nominatim:Porto/PT']);
  });

  it('cherche à l’étranger une commune seule introuvable en France, sans l’inscrire', async () => {
    await seed('Porto');
    const { deps, calls } = fakeGeocoders({ nominatim: { Porto: [porto] } });

    const report = await geocodePlaces({ db: client, ...deps }, { dryRun: false });

    // Le pays n'est pas écrit dans le libellé : une faute de frappe sur une commune
    // française tomberait sur un homonyme étranger. La revue tranche.
    expect(calls).toEqual(['ban:Porto', 'nominatim:Porto/-']);
    expect(report.geocoded).toBe(0);
    expect(report.reviews).toMatchObject([{ reason: 'pays_incertain', candidates: [porto] }]);
    expect(await row('Porto')).toMatchObject({ geocoder: null, lat: null });
  });

  it('ne compte pas un lieu géocodé à la main pendant le passage', async () => {
    await seed('Rodez');
    const { deps } = fakeGeocoders({});
    deps.ban.search = async () => {
      await client.update(places).set({ geocoder: 'manuel', lat: 1, lng: 2 });
      return [aCandidate({})];
    };

    const report = await geocodePlaces({ db: client, ...deps }, { dryRun: false });

    expect(report.geocoded).toBe(0);
    expect(await row('Rodez')).toMatchObject({ geocoder: 'manuel', lat: 1 });
  });

  it('n’inscrit rien de douteux et le rapporte avec ses candidats', async () => {
    await seed('non renseigné', 'Atlantide', 'Saint-Denis', 'Panne');
    const saintDenis = [
      aCandidate({ ref: '97411', name: 'Saint-Denis', score: 0.958 }),
      aCandidate({ ref: '93066', name: 'Saint-Denis', score: 0.958 }),
    ];
    const { deps } = fakeGeocoders({ ban: { 'Saint-Denis': saintDenis } });

    const report = await geocodePlaces({ db: client, ...deps }, { dryRun: false });

    expect(report.geocoded).toBe(0);
    const reasons = Object.fromEntries(report.reviews.map((r) => [r.label, r.reason]));
    expect(reasons).toEqual({
      'non renseigné': 'non_geocodable',
      Atlantide: 'introuvable',
      'Saint-Denis': 'homonymes',
      Panne: 'erreur',
    });
    const homonyms = report.reviews.find((r) => r.label === 'Saint-Denis');
    expect(homonyms?.candidates.map((c) => c.ref)).toEqual(['97411', '93066']);
    expect(report.reviews.find((r) => r.label === 'Panne')?.error).toContain('503');
    const rows = await client.select().from(places);
    expect(rows.every((r) => r.geocoder === null && r.lat === null)).toBe(true);
  });

  it('ne refait ni ne réécrit un lieu déjà géocodé, même à la main', async () => {
    await seed('Rodez', 'Albi');
    await client
      .update(places)
      .set({ geocoder: 'manuel', lat: 1, lng: 2 })
      .where(eq(places.label, 'Albi'));
    const { deps, calls } = fakeGeocoders({ ban: { Rodez: [aCandidate({})] } });

    await geocodePlaces({ db: client, ...deps }, { dryRun: false });
    const replay = await geocodePlaces({ db: client, ...deps }, { dryRun: false });

    expect(calls).toEqual(['ban:Rodez']);
    expect(replay).toEqual({ geocoded: 0, alreadyDone: 2, reviews: [] });
    expect(await row('Albi')).toMatchObject({ geocoder: 'manuel', lat: 1, lng: 2 });
  });

  it('n’interroge qu’une fois deux libellés qui désignent le même lieu', async () => {
    await seed('Rodez', 'Rodez (France)');
    const { deps, calls } = fakeGeocoders({ ban: { Rodez: [aCandidate({})] } });

    const report = await geocodePlaces({ db: client, ...deps }, { dryRun: false });

    expect(calls).toEqual(['ban:Rodez']);
    expect(report.geocoded).toBe(2);
  });

  it('en dry-run, compte sans rien écrire', async () => {
    await seed('Rodez');
    const { deps } = fakeGeocoders({ ban: { Rodez: [aCandidate({})] } });

    const report = await geocodePlaces({ db: client, ...deps }, { dryRun: true });

    expect(report.geocoded).toBe(1);
    expect(await row('Rodez')).toMatchObject({ geocoder: null, lat: null });
  });

  describe('pickPlace', () => {
    const saintDenis = [
      aCandidate({ ref: '97411', name: 'Saint-Denis', score: 0.958, lat: -20.9 }),
      aCandidate({ ref: '93066', name: 'Saint-Denis', score: 0.958, lat: 48.9 }),
    ];

    it('place un lieu en revue sur le candidat choisi, comme un choix manuel', async () => {
      await seed('Saint-Denis');
      const { deps } = fakeGeocoders({ ban: { 'Saint-Denis': saintDenis } });

      const picked = await pickPlace(
        { db: client, ...deps },
        { label: 'Saint-Denis', ref: '93066' },
      );

      expect(picked).toMatchObject({ ref: '93066' });
      expect(await row('Saint-Denis')).toMatchObject({
        city: 'Saint-Denis',
        lat: 48.9,
        geocoder: 'manuel',
        geocodeScore: null, // allow-null: un choix manuel n'a pas de score
      });
    });

    it('refuse un candidat absent des réponses du géocodeur', async () => {
      await seed('Saint-Denis');
      const { deps } = fakeGeocoders({ ban: { 'Saint-Denis': saintDenis } });
      await expect(
        pickPlace({ db: client, ...deps }, { label: 'Saint-Denis', ref: '11339' }),
      ).rejects.toThrow('11339');
    });

    it('refuse un libellé inconnu ou un lieu déjà géocodé', async () => {
      await seed('Saint-Denis');
      await client.update(places).set({ geocoder: 'ban', lat: 1, lng: 2 });
      const { deps } = fakeGeocoders({ ban: { 'Saint-Denis': saintDenis } });
      await expect(
        pickPlace({ db: client, ...deps }, { label: 'Atlantide', ref: '1' }),
      ).rejects.toThrow('Atlantide');
      await expect(
        pickPlace({ db: client, ...deps }, { label: 'Saint-Denis', ref: '93066' }),
      ).rejects.toThrow('déjà géocodé');
      expect(await row('Saint-Denis')).toMatchObject({ geocoder: 'ban', lat: 1 });
    });
  });
});
