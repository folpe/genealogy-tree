import type { BlobStore } from '../../src/server/media/media.blob';

/** Store Blob en mémoire, à la signature de l'adaptateur Vercel ; compte les écritures. */
export function memoryBlobStore() {
  const files = new Map<string, { body: Buffer; contentType: string }>();
  const puts: string[] = [];
  const store: BlobStore = {
    async put(pathname, body, contentType) {
      puts.push(pathname);
      files.set(pathname, { body, contentType });
    },
    async get(pathname) {
      const file = files.get(pathname);
      if (!file) return undefined;
      return {
        stream: new Blob([new Uint8Array(file.body)]).stream(),
        contentType: file.contentType,
        etag: `"${pathname}"`,
      };
    },
  };
  return { store, files, puts };
}
