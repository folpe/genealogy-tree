import { describe, expect, it, vi } from 'vitest';
import { fetchRemoteImage } from './remote-image';

const URL_PHOTO = 'https://lh3.googleusercontent.com/a/photo-de-test=s800-c';
const LIMITS = { timeoutMs: 1000, maxBytes: 8 };

const aResponse = (body: BodyInit, headers: Record<string, string> = {}, status = 200) =>
  new Response(body, { status, headers: { 'content-type': 'image/jpeg', ...headers } });

/** Corps envoyé par morceaux, sans longueur annoncée, pour la borne pendant la lecture. */
const chunked = (...chunks: number[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const size of chunks) controller.enqueue(new Uint8Array(size));
      controller.close();
    },
  });

describe('fetchRemoteImage', () => {
  it('lit les octets d’une image, avec un délai et sans suivre de redirection', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(aResponse(new Uint8Array([1, 2, 3])));
    const bytes = await fetchRemoteImage(fetchFn, URL_PHOTO, LIMITS);
    expect([...bytes]).toEqual([1, 2, 3]);
    const init = fetchFn.mock.calls[0]?.[1];
    expect(init?.redirect).toBe('error');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('refuse une réponse en erreur', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(aResponse('absent', {}, 404));
    await expect(fetchRemoteImage(fetchFn, URL_PHOTO, LIMITS)).rejects.toThrow(/404/);
  });

  it('refuse ce qui n’est pas une image', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(aResponse('<html>', { 'content-type': 'text/html' }));
    await expect(fetchRemoteImage(fetchFn, URL_PHOTO, LIMITS)).rejects.toThrow(/image/);
  });

  it('refuse une taille annoncée trop grande, avant de lire', async () => {
    const body = chunked(4);
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(aResponse(body, { 'content-length': '9' }));
    await expect(fetchRemoteImage(fetchFn, URL_PHOTO, LIMITS)).rejects.toThrow(/trop lourde/);
  });

  it('s’arrête pendant la lecture dès que la borne est franchie', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(aResponse(chunked(4, 4, 4)));
    await expect(fetchRemoteImage(fetchFn, URL_PHOTO, LIMITS)).rejects.toThrow(/trop lourde/);
  });

  it('accepte exactement la borne', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(aResponse(chunked(4, 4)));
    expect(await fetchRemoteImage(fetchFn, URL_PHOTO, LIMITS)).toHaveLength(8);
  });

  it('abandonne passé le délai', async () => {
    const fetchFn = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    await expect(
      fetchRemoteImage(fetchFn, URL_PHOTO, { timeoutMs: 10, maxBytes: 8 }),
    ).rejects.toThrow();
  });
});
