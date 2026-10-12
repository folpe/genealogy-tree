// tdd-cover: e2e src/server/migration/notion.media.integration.test.ts
import { type MediaDeps, setProfilePhoto, storeImage } from '../media/media.service';

// Photos de la reprise Notion : chacune passe par le pipeline des médias (EXIF et
// GPS retirés, dérivées, déduplication) puis devient la photo de profil de sa
// fiche. Une photo en échec n'arrête pas les autres : elle est rapportée.

export type NotionPhoto = { pageId: string; name: string; bytes: Buffer };

export type NotionPhotosResult = {
  stored: number;
  reused: number;
  failures: { pageId: string; name: string; error: string }[];
};

export async function loadNotionPhotos(
  deps: MediaDeps,
  photos: NotionPhoto[],
): Promise<NotionPhotosResult> {
  const result: NotionPhotosResult = { stored: 0, reused: 0, failures: [] };
  for (const photo of photos) {
    try {
      const { mediaId, created } = await storeImage(deps, {
        personId: photo.pageId,
        bytes: photo.bytes,
        legacyNotionId: photo.pageId,
      });
      await setProfilePhoto(deps.db, photo.pageId, mediaId);
      if (created) result.stored += 1;
      else result.reused += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.failures.push({ pageId: photo.pageId, name: photo.name, error: message });
    }
  }
  return result;
}
