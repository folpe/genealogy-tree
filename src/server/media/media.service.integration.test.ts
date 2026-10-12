import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { aPerson } from '../../../tests/fixtures/builders';
import { memoryBlobStore } from '../../../tests/fixtures/memory-blob-store';
import { testDb } from '../../../tests/integration/test-db';
import { media, mediaPersons } from '../db/schema';
import { insertFamilyGraph } from '../family/family.repository';
import { loadProfilePhotos, readMediaVariant, setProfilePhoto, storeImage } from './media.service';

const db = testDb();
// Image de synthèse : aucune photo réelle dans les tests.
const aJpeg = (shade: number) =>
  sharp({
    create: { width: 900, height: 600, channels: 3, background: { r: shade, g: 90, b: 60 } },
  })
    .jpeg()
    .toBuffer();
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

describe.skipIf(!db)('media.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;

  beforeEach(async () => {
    await reset();
    await insertFamilyGraph(client, {
      persons: [aPerson('luc'), aPerson('anne')],
      unions: [],
      parentChildren: [],
    });
  });
  afterAll(async () => {
    await close();
  });

  it('range l’original et ses dérivées sous persons/<fiche>/<empreinte>', async () => {
    const blob = memoryBlobStore();
    const bytes = await aJpeg(120);
    const { mediaId, created } = await storeImage(
      { db: client, blob: blob.store },
      { personId: 'luc', bytes, originUrl: 'https://files.notion.test/luc.jpg' },
    );

    const hash = sha256(bytes);
    expect(created).toBe(true);
    expect(blob.puts.sort()).toEqual(
      [
        `persons/luc/${hash}.jpg`,
        `persons/luc/${hash}-256.webp`,
        `persons/luc/${hash}-768.webp`,
        `persons/luc/${hash}-1600.webp`,
      ].sort(),
    );
    const [row] = await client.select().from(media).where(eq(media.id, mediaId));
    expect(row).toMatchObject({
      kind: 'photo',
      pathname: `persons/luc/${hash}.jpg`,
      sha256: hash,
      mime: 'image/jpeg',
      width: 900,
      height: 600,
      originUrl: 'https://files.notion.test/luc.jpg',
    });
    expect(row?.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    expect(await client.select().from(mediaPersons)).toEqual([{ mediaId, personId: 'luc' }]);
  });

  it('ne réenvoie pas un doublon : même média, relié à la nouvelle fiche', async () => {
    const blob = memoryBlobStore();
    const deps = { db: client, blob: blob.store };
    const bytes = await aJpeg(120);
    const first = await storeImage(deps, { personId: 'luc', bytes });
    const putsAfterFirst = blob.puts.length;

    const again = await storeImage(deps, { personId: 'anne', bytes });
    expect(again).toEqual({ mediaId: first.mediaId, created: false });
    expect(blob.puts).toHaveLength(putsAfterFirst);
    expect(await client.select().from(media)).toHaveLength(1);
    const links = await client.select().from(mediaPersons);
    expect(links.map((l) => l.personId).sort()).toEqual(['anne', 'luc']);

    // Rejouer sur la même fiche ne duplique pas le lien.
    await storeImage(deps, { personId: 'luc', bytes });
    expect(await client.select().from(mediaPersons)).toHaveLength(2);
  });

  it('n’écrit rien quand le fichier n’est pas une image', async () => {
    const blob = memoryBlobStore();
    await expect(
      storeImage({ db: client, blob: blob.store }, { personId: 'luc', bytes: Buffer.from('x') }),
    ).rejects.toThrow();
    expect(blob.puts).toEqual([]);
    expect(await client.select().from(media)).toEqual([]);
  });

  it('relit une dérivée en WebP ; rien pour un média inconnu', async () => {
    const blob = memoryBlobStore();
    const deps = { db: client, blob: blob.store };
    const { mediaId } = await storeImage(deps, { personId: 'luc', bytes: await aJpeg(30) });

    const file = await readMediaVariant(deps, mediaId, 768);
    expect(file?.contentType).toBe('image/webp');
    const body = Buffer.from(await new Response(file?.stream).arrayBuffer());
    expect((await sharp(body).metadata()).width).toBe(768);
    expect(await readMediaVariant(deps, 'inconnu', 768)).toBeUndefined();
  });

  it('donne la photo de profil de chaque fiche qui en a une', async () => {
    const blob = memoryBlobStore();
    const deps = { db: client, blob: blob.store };
    const { mediaId } = await storeImage(deps, { personId: 'luc', bytes: await aJpeg(200) });
    await setProfilePhoto(client, 'luc', mediaId);

    const photos = await loadProfilePhotos(client);
    expect([...photos.keys()]).toEqual(['luc']);
    expect(photos.get('luc')).toMatchObject({ mediaId, width: 900, height: 600 });
    expect(photos.get('luc')?.blurDataUrl).toMatch(/^data:image\/webp/);
  });
});
