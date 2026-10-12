import { describe, expect, it } from 'vitest';
import banParis13 from '../../../tests/fixtures/geocoding/ban-paris-13.json';
import banParis13Raw from '../../../tests/fixtures/geocoding/ban-paris-13-raw.json';
import banRodez from '../../../tests/fixtures/geocoding/ban-rodez.json';
import banSaintDenis from '../../../tests/fixtures/geocoding/ban-saint-denis.json';
import { banGeocoder, type GeocodeCandidate } from './places.geocoder';
import { judgeCandidates } from './places.verdict';

const ban = (body: unknown) =>
  banGeocoder({ fetch: async () => new Response(JSON.stringify(body)) }).search({ name: '' });

const candidate = (patch: Partial<GeocodeCandidate>): GeocodeCandidate => ({
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
  ...patch,
});

describe('judgeCandidates', () => {
  it('accepte une commune sans homonyme au score élevé', async () => {
    const verdict = judgeCandidates(await ban(banRodez), { hint: undefined });
    expect(verdict).toMatchObject({ status: 'found', best: { ref: '12202' } });
  });

  it('garde les homonymes de score voisin pour une revue', async () => {
    const verdict = judgeCandidates(await ban(banSaintDenis), { hint: undefined });
    expect(verdict.status).toBe('review');
    if (verdict.status !== 'review') return;
    expect(verdict.reason).toBe('homonymes');
    expect(verdict.candidates.map((c) => c.ref)).toEqual(['97411', '93066', '11339', '30247']);
  });

  it('départage les homonymes par le précisant du libellé', async () => {
    const verdict = judgeCandidates(await ban(banSaintDenis), { hint: 'Seine-Saint-Denis' });
    expect(verdict).toMatchObject({ status: 'found', best: { ref: '93066' } });
  });

  it('signale un précisant qui ne correspond à aucun candidat', async () => {
    const verdict = judgeCandidates(await ban(banRodez), { hint: 'Bretagne' });
    expect(verdict).toMatchObject({ status: 'review', reason: 'precisant_absent' });
  });

  it('garde un score faible pour une revue', async () => {
    const verdict = judgeCandidates(await ban(banParis13Raw), { hint: undefined });
    expect(verdict).toMatchObject({ status: 'review', reason: 'score_faible' });
    if (verdict.status !== 'review') return;
    expect(verdict.candidates[0]?.ref).toBe('75056');
  });

  it('accepte un arrondissement nommé comme la BAN le nomme', async () => {
    const verdict = judgeCandidates(await ban(banParis13), { hint: undefined });
    expect(verdict).toMatchObject({ status: 'found', best: { ref: '75113' } });
  });

  it('rend « introuvable » sans candidat', () => {
    expect(judgeCandidates([], { hint: undefined })).toEqual({ status: 'not_found' });
  });

  it('sans score (Nominatim), deux lieux de même nom sont des homonymes', () => {
    const one = candidate({});
    expect(judgeCandidates([one], { hint: undefined })).toEqual({ status: 'found', best: one });

    const other = candidate({ ref: 'node/2', context: 'Porto, Corse, France' });
    const verdict = judgeCandidates([one, other], { hint: undefined });
    expect(verdict).toMatchObject({ status: 'review', reason: 'homonymes' });

    const differentName = candidate({ ref: 'node/3', name: 'Porto Santo' });
    expect(judgeCandidates([one, differentName], { hint: undefined }).status).toBe('found');
  });
});
