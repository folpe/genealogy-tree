// Téléchargement borné d'une image distante (photo Google d'un membre). Délai
// explicite, type image exigé, taille vérifiée sur l'en-tête puis pendant la
// lecture : un serveur qui ment sur la longueur ne fait pas déborder la mémoire.
// L'appelant choisit l'URL et en vérifie l'hôte ; les redirections sont refusées
// pour qu'elle ne mène pas ailleurs.

export type RemoteImageLimits = { timeoutMs: number; maxBytes: number };

export async function fetchRemoteImage(
  fetchFn: typeof fetch,
  url: string,
  limits: RemoteImageLimits,
): Promise<Buffer> {
  const response = await fetchFn(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(limits.timeoutMs),
  });
  if (!response.ok) throw new Error(`Image distante refusée : HTTP ${response.status}`);
  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`Pas une image : ${type || 'type absent'}`);
  const announced = Number(response.headers.get('content-length') ?? 0);
  if (announced > limits.maxBytes) throw tooLarge(limits.maxBytes);
  if (!response.body) throw new Error('Image distante vide');
  return readBounded(response.body, limits.maxBytes);
}

async function readBounded(body: ReadableStream<Uint8Array>, maxBytes: number) {
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = body.getReader();
  // Bornée : la lecture s'arrête à la fin du flux ou dès que maxBytes est dépassé.
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw tooLarge(maxBytes);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

const tooLarge = (maxBytes: number) =>
  new Error(`Image distante trop lourde : ${maxBytes} octets au plus`);
