// tdd-cover: e2e src/server/media/media.url.test.ts
import { getMediaDeps, getMediaKey } from '@/server/media/media.instance';
import { readMediaVariant } from '@/server/media/media.service';
import { verifyMediaUrl } from '@/server/media/media.url';

// Sert une dérivée de photo du store Blob privé. La policy a été appliquée quand
// l'URL a été signée (family.service) ; ici, seule la signature est vérifiée. Une
// URL invalide ou expirée répond 404, sans dire si la photo existe.

const notFound = () => new Response('Introuvable', { status: 404 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; width: string }> },
) {
  const { id, width } = await params;
  const { searchParams } = new URL(request.url);
  const verdict = verifyMediaUrl({
    mediaId: id,
    width,
    expires: searchParams.get('e') ?? undefined,
    signature: searchParams.get('s') ?? undefined,
    now: new Date(),
    key: getMediaKey(),
  });
  if (!verdict.ok) return notFound();

  const file = await readMediaVariant(getMediaDeps(), id, verdict.width);
  if (!file) return notFound();
  return new Response(file.stream, {
    headers: {
      'Content-Type': file.contentType,
      // Privé : jamais dans un cache partagé ; pas au-delà de l'expiration de l'URL.
      'Cache-Control': `private, max-age=${verdict.maxAgeSeconds}, immutable`,
      ETag: file.etag,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
