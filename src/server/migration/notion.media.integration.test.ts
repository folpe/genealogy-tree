import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { exact } from '../../../tests/fixtures/builders';
import { memoryBlobStore } from '../../../tests/fixtures/memory-blob-store';
import { marchandNotionPages, NOTION_IDS as N } from '../../../tests/fixtures/notion-pages';
import { testDb } from '../../../tests/integration/test-db';
import { media, persons } from '../db/schema';
import { loadNotionPhotos } from './notion.media';
import { loadNotionGraph } from './notion.repository';
import { transformNotionExport } from './notion.transform';

const db = testDb();
// Image de synthèse : aucune photo réelle dans les tests.
const aJpeg = () =>
  sharp({ create: { width: 640, height: 480, channels: 3, background: '#a0785a' } })
    .jpeg()
    .toBuffer();

describe.skipIf(!db)('notion.media (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;

  beforeEach(async () => {
    await reset();
    const { graph } = transformNotionExport(marchandNotionPages(), {
      today: exact(2026, 10, 12),
      photos: [],
    });
    await loadNotionGraph(client, graph);
  });
  afterAll(async () => {
    await close();
  });

  it('envoie la photo et en fait la photo de profil de la fiche', async () => {
    const blob = memoryBlobStore();
    const result = await loadNotionPhotos({ db: client, blob: blob.store }, [
      { pageId: N.luc, name: 'luc.jpg', bytes: await aJpeg() },
    ]);

    expect(result).toEqual({ stored: 1, reused: 0, failures: [] });
    const [luc] = await client.select().from(persons).where(eq(persons.id, N.luc));
    const [photo] = await client.select().from(media);
    expect(luc?.photoMediaId).toBe(photo?.id);
    expect(photo?.legacyNotionId).toBe(N.luc);
  });

  it('rejouer ne réenvoie rien', async () => {
    const blob = memoryBlobStore();
    const deps = { db: client, blob: blob.store };
    const photos = [{ pageId: N.luc, name: 'luc.jpg', bytes: await aJpeg() }];
    await loadNotionPhotos(deps, photos);
    const puts = blob.puts.length;

    expect(await loadNotionPhotos(deps, photos)).toEqual({ stored: 0, reused: 1, failures: [] });
    expect(blob.puts).toHaveLength(puts);
  });

  it('une photo illisible est signalée, les autres passent', async () => {
    const blob = memoryBlobStore();
    const result = await loadNotionPhotos({ db: client, blob: blob.store }, [
      { pageId: N.hugo, name: 'abimee.jpg', bytes: Buffer.from('pas une image') },
      { pageId: N.luc, name: 'luc.jpg', bytes: await aJpeg() },
    ]);

    expect(result.stored).toBe(1);
    expect(result.failures).toEqual([
      { pageId: N.hugo, name: 'abimee.jpg', error: expect.any(String) },
    ]);
    const [hugo] = await client.select().from(persons).where(eq(persons.id, N.hugo));
    expect(hugo?.photoMediaId).toBeNull(); // allow-null: colonne vide en base
  });
});
