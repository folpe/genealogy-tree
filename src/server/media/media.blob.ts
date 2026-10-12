// tdd-cover: e2e src/server/media/media.service.integration.test.ts
import { get, put } from '@vercel/blob';

// Port vers le stockage des fichiers. L'adaptateur Vercel Blob travaille sur un
// store privé : rien n'y est lisible sans jeton, la route `/media` sert les
// fichiers après vérification de l'URL signée. En test, un store en mémoire
// (tests/fixtures/memory-blob-store.ts) suit la même signature.

export type StoredFile = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  etag: string;
};

export type BlobStore = {
  /** Écrit (ou réécrit) le fichier : les chemins portent l'empreinte du contenu. */
  put(pathname: string, body: Buffer, contentType: string): Promise<void>;
  get(pathname: string): Promise<StoredFile | undefined>;
};

/** Un an : le contenu d'un chemin ne change jamais, il porte son empreinte. */
const CACHE_MAX_AGE_SECONDS = 365 * 24 * 3_600;

/**
 * Jeton explicite pour les scripts hors Vercel ; sur Vercel, le SDK s'authentifie
 * seul (OIDC et `BLOB_STORE_ID`, ou `BLOB_READ_WRITE_TOKEN`).
 */
export function vercelBlobStore(options: { token?: string } = {}): BlobStore {
  const auth = options.token ? { token: options.token } : {};
  return {
    async put(pathname, body, contentType) {
      await put(pathname, body, {
        access: 'private',
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: CACHE_MAX_AGE_SECONDS,
        ...auth,
      });
    },
    async get(pathname) {
      const result = await get(pathname, { access: 'private', ...auth });
      if (result?.statusCode !== 200) return undefined;
      return {
        stream: result.stream,
        contentType: result.blob.contentType,
        etag: result.blob.etag,
      };
    },
  };
}
