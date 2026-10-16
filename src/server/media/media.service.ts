// tdd-cover: e2e src/server/media/media.service.integration.test.ts
import { createHash } from 'node:crypto';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { media, mediaPersons, persons } from '../db/schema';
import type { Db } from '../db/types';
import type { BlobStore, StoredFile } from './media.blob';
import { normalizeImage } from './media.image';
import type { MediaWidth } from './media.url';

// Photos des fiches (plan phase 3, lot 6). Un fichier est identifié par l'empreinte
// SHA-256 de ce qui a été reçu : envoyer deux fois la même photo ne crée ni second
// média ni second envoi, seulement un lien de plus vers la fiche.

export type MediaDeps = { db: Db; blob: BlobStore };

export type ProfilePhoto = {
  mediaId: string;
  width: number;
  height: number;
  blurDataUrl: string | undefined;
};

/** `persons/<fiche>/<empreinte>.jpg` -> `persons/<fiche>/<empreinte>-768.webp`. */
const variantPathname = (pathname: string, width: MediaWidth) =>
  pathname.replace(/\.[a-z0-9]+$/, `-${width}.webp`);

async function linkPerson(db: Db, mediaId: string, personId: string) {
  await db.insert(mediaPersons).values({ mediaId, personId }).onConflictDoNothing();
}

export async function storeImage(
  deps: MediaDeps,
  input: { personId: string; bytes: Buffer; originUrl?: string; legacyNotionId?: string },
): Promise<{ mediaId: string; created: boolean }> {
  const sha256 = createHash('sha256').update(input.bytes).digest('hex');
  const [known] = await deps.db
    .select({ id: media.id })
    .from(media)
    .where(eq(media.sha256, sha256));
  if (known) {
    await linkPerson(deps.db, known.id, input.personId);
    return { mediaId: known.id, created: false };
  }

  const image = await normalizeImage(input.bytes);
  const pathname = `persons/${input.personId}/${sha256}.${image.original.extension}`;
  // Les fichiers d'abord : une ligne `media` ne pointe jamais vers un fichier absent.
  // Un envoi interrompu laisse au pire des fichiers réécrits à l'identique au passage suivant.
  await deps.blob.put(pathname, image.original.bytes, image.original.mime);
  for (const variant of image.variants) {
    await deps.blob.put(variantPathname(pathname, variant.width), variant.bytes, 'image/webp');
  }

  const mediaId = await deps.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(media)
      .values({
        kind: 'photo',
        pathname,
        sha256,
        mime: image.original.mime,
        bytes: image.original.bytes.length,
        width: image.original.width,
        height: image.original.height,
        blurDataUrl: image.blurDataUrl,
        originUrl: input.originUrl,
        legacyNotionId: input.legacyNotionId,
      })
      .returning({ id: media.id });
    if (!row) throw new Error('Média non enregistré');
    await linkPerson(tx, row.id, input.personId);
    return row.id;
  });
  return { mediaId, created: true };
}

/**
 * Pose la photo de profil ; renvoie si elle l'a été. `onlyIfEmpty` (import automatique)
 * ne la pose que si la fiche n'en a toujours pas au moment d'écrire : une photo posée
 * entre-temps par la famille n'est jamais écrasée.
 */
export async function setProfilePhoto(
  db: Db,
  personId: string,
  mediaId: string,
  options: { onlyIfEmpty?: boolean } = {},
): Promise<boolean> {
  const target = eq(persons.id, personId);
  const updated = await db
    .update(persons)
    .set({ photoMediaId: mediaId })
    .where(options.onlyIfEmpty ? and(target, isNull(persons.photoMediaId)) : target)
    .returning({ id: persons.id });
  return updated.length > 0;
}

/** Photo de profil par fiche. Ne dit rien des droits : l'appelant applique la policy. */
export async function loadProfilePhotos(db: Db): Promise<Map<string, ProfilePhoto>> {
  const rows = await db
    .select({
      personId: persons.id,
      mediaId: media.id,
      width: media.width,
      height: media.height,
      blurDataUrl: media.blurDataUrl,
    })
    .from(persons)
    .innerJoin(media, eq(media.id, persons.photoMediaId))
    .where(isNotNull(persons.photoMediaId));
  return new Map(
    rows.map((r) => [
      r.personId,
      {
        mediaId: r.mediaId,
        width: r.width ?? 0,
        height: r.height ?? 0,
        blurDataUrl: r.blurDataUrl ?? undefined,
      },
    ]),
  );
}

export async function readMediaVariant(
  deps: MediaDeps,
  mediaId: string,
  width: MediaWidth,
): Promise<StoredFile | undefined> {
  const [row] = await deps.db
    .select({ pathname: media.pathname })
    .from(media)
    .where(eq(media.id, mediaId));
  if (!row) return undefined;
  return deps.blob.get(variantPathname(row.pathname, width));
}
