import sharp from 'sharp';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { memoryBlobStore } from '../../../tests/fixtures/memory-blob-store';
import { testDb } from '../../../tests/integration/test-db';
import { memberships, users } from '../db/schema';
import { loadProfilePhotos } from '../media/media.service';
import { insertFamilyGraph } from './family.repository';
import { importGooglePhoto } from './google-photo.service';
import { changePhoto } from './person-photo.service';

// Import de la photo Google contre une vraie base : la policy et le service média
// d'un ajout de photo normal. Image et jeton de synthèse, jamais réels.
const db = testDb();
const PICTURE = 'https://lh3.googleusercontent.com/a/photo-de-test';
const aJpeg = (shade: number) =>
  sharp({
    create: { width: 400, height: 400, channels: 3, background: { r: shade, g: 90, b: 60 } },
  })
    .jpeg()
    .toBuffer();
const anIdToken = (claims: Record<string, unknown>) =>
  ['e30', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'sig'].join('.');

describe.skipIf(!db)('google-photo.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;

  async function aMember(userId: string, personId: string | undefined) {
    await client.insert(users).values({ id: userId, email: `${userId}@exemple.fr`, name: '' });
    // Un compte sans fiche n'existe que pour un admin (contrainte de la table).
    await client.insert(memberships).values({ userId, personId, isAdmin: !personId });
  }

  async function googleFetch() {
    const bytes = await aJpeg(150);
    return vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(bytes, { headers: { 'content-type': 'image/jpeg' } }));
  }

  beforeEach(async () => {
    await reset();
    await insertFamilyGraph(client, marchandFamily);
  });
  afterAll(async () => {
    await close();
  });

  it('fiche sans photo : la photo Google, en grand, devient celle de la fiche', async () => {
    await aMember('u-luc', 'luc');
    const blob = memoryBlobStore();
    const fetchFn = await googleFetch();

    const decision = await importGooglePhoto(
      { db: client, blob: blob.store, fetch: fetchFn },
      { userId: 'u-luc', idToken: anIdToken({ picture: `${PICTURE}=s96-c` }) },
    );

    expect(decision).toMatchObject({ import: true, personId: 'luc' });
    expect(fetchFn).toHaveBeenCalledWith(`${PICTURE}=s800-c`, expect.anything());
    expect(blob.puts.some((p) => p.startsWith('persons/luc/'))).toBe(true);
    expect((await loadProfilePhotos(client)).has('luc')).toBe(true);
  });

  it('fiche déjà photographiée : rien n’est téléchargé ni remplacé', async () => {
    await aMember('u-luc', 'luc');
    const blob = memoryBlobStore();
    await changePhoto({ db: client, blob: blob.store }, 'u-luc', 'luc', await aJpeg(30));
    const before = await loadProfilePhotos(client);
    const fetchFn = await googleFetch();

    const decision = await importGooglePhoto(
      { db: client, blob: blob.store, fetch: fetchFn },
      { userId: 'u-luc', idToken: anIdToken({ picture: PICTURE }) },
    );

    expect(decision).toEqual({ import: false, reason: 'already-has-photo' });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(await loadProfilePhotos(client)).toEqual(before);
  });

  it('compte sans fiche liée, ou sans membre : rien', async () => {
    await aMember('u-admin', undefined);
    const fetchFn = await googleFetch();
    const deps = { db: client, blob: memoryBlobStore().store, fetch: fetchFn };
    const idToken = anIdToken({ picture: PICTURE });

    expect(await importGooglePhoto(deps, { userId: 'u-admin', idToken })).toEqual({
      import: false,
      reason: 'no-person',
    });
    expect(await importGooglePhoto(deps, { userId: 'u-inconnu', idToken })).toEqual({
      import: false,
      reason: 'no-member',
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
