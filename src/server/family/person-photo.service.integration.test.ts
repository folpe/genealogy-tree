import sharp from 'sharp';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { memoryBlobStore } from '../../../tests/fixtures/memory-blob-store';
import { testDb } from '../../../tests/integration/test-db';
import { memberships, users } from '../db/schema';
import { loadProfilePhotos } from '../media/media.service';
import { insertFamilyGraph } from './family.repository';
import { changePhoto } from './person-photo.service';

// Changer la photo d'une fiche : la policy, puis le service média (normalisation,
// EXIF retiré, dérivées) et la photo de profil. Image de synthèse, jamais réelle.
const db = testDb();
const aJpeg = () =>
  sharp({ create: { width: 600, height: 800, channels: 3, background: { r: 120, g: 90, b: 60 } } })
    .jpeg()
    .toBuffer();

describe.skipIf(!db)('person-photo.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;

  beforeEach(async () => {
    await reset();
    await insertFamilyGraph(client, marchandFamily);
    for (const [id, personId] of [
      ['u-luc', 'luc'],
      ['u-hugo', 'hugo'],
      ['u-anne', 'anne'],
      ['u-isabelle', 'isabelle'],
    ] as const) {
      await client.insert(users).values({ id, email: `${id}@exemple.fr`, name: '' });
      await client.insert(memberships).values({ userId: id, personId });
    }
  });
  afterAll(async () => {
    await close();
  });

  it('dans sa lignée : la photo est rangée et devient celle de la fiche', async () => {
    const blob = memoryBlobStore();
    await changePhoto({ db: client, blob: blob.store }, 'u-hugo', 'luc', await aJpeg());
    expect(blob.puts.some((p) => p.startsWith('persons/luc/'))).toBe(true);
    expect((await loadProfilePhotos(client)).has('luc')).toBe(true);
  });

  it('hors de sa lignée : refusé, rien n’est rangé', async () => {
    const blob = memoryBlobStore();
    await expect(
      changePhoto({ db: client, blob: blob.store }, 'u-isabelle', 'bernard', await aJpeg()),
    ).rejects.toMatchObject({ code: 'FAMILY_OUTSIDE_PERIMETER' });
    expect(blob.puts).toEqual([]);
  });

  it('refuse un fichier qui n’est pas une image, ou trop lourd', async () => {
    const blob = memoryBlobStore();
    const deps = { db: client, blob: blob.store };
    await expect(
      changePhoto(deps, 'u-hugo', 'luc', Buffer.from('pas une image')),
    ).rejects.toMatchObject({
      code: 'MEDIA_UNSUPPORTED',
    });
    await expect(
      changePhoto(deps, 'u-hugo', 'luc', Buffer.alloc(5 * 1024 * 1024)),
    ).rejects.toMatchObject({
      code: 'MEDIA_TOO_LARGE',
    });
  });
});
