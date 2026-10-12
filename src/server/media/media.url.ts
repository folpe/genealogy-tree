import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';

// URLs des photos privées (plan phase 3, lot 6). Le serveur ne signe une URL
// qu'après avoir appliqué la policy ; la route `/media` vérifie seulement la
// signature, sans recharger l'arbre pour chaque image. L'expiration est arrondie
// à l'heure suivante plus une heure : l'URL reste stable une heure (le navigateur
// garde l'image en cache) et ne sert jamais plus de deux heures.

export const MEDIA_WIDTHS = [256, 768, 1600] as const;
export type MediaWidth = (typeof MEDIA_WIDTHS)[number];

const WINDOW_SECONDS = 3_600;

/** Clé dédiée, dérivée du secret d'auth : pas de variable d'environnement de plus. */
export function mediaUrlKey(authSecret: string): Buffer {
  return Buffer.from(hkdfSync('sha256', authSecret, '', 'ances-tree/media-url', 32));
}

function signature(key: Buffer, mediaId: string, width: number, expires: number): Buffer {
  return createHmac('sha256', key).update(`${mediaId}/${width}/${expires}`).digest();
}

export function signMediaUrl(input: {
  mediaId: string;
  width: MediaWidth;
  now: Date;
  key: Buffer;
}): string {
  const nowSeconds = Math.floor(input.now.getTime() / 1_000);
  const expires = (Math.floor(nowSeconds / WINDOW_SECONDS) + 2) * WINDOW_SECONDS;
  const sig = signature(input.key, input.mediaId, input.width, expires).toString('base64url');
  return `/media/${encodeURIComponent(input.mediaId)}/${input.width}?e=${expires}&s=${sig}`;
}

export type MediaUrlVerdict =
  | { ok: true; width: MediaWidth; maxAgeSeconds: number }
  | { ok: false };

const toWidth = (raw: string): MediaWidth | undefined =>
  MEDIA_WIDTHS.find((w) => String(w) === raw);

export function verifyMediaUrl(input: {
  mediaId: string;
  width: string;
  expires: string | undefined;
  signature: string | undefined;
  now: Date;
  key: Buffer;
}): MediaUrlVerdict {
  const width = toWidth(input.width);
  if (!width || !input.expires || !input.signature || !/^\d{1,12}$/.test(input.expires)) {
    return { ok: false };
  }
  const expires = Number(input.expires);
  const remaining = expires - Math.floor(input.now.getTime() / 1_000);
  if (remaining <= 0) return { ok: false };
  const expected = signature(input.key, input.mediaId, width, expires);
  const given = Buffer.from(input.signature, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false };
  return { ok: true, width, maxAgeSeconds: remaining };
}

/** Photo prête pour `<img>`, avec les URLs signées de ses dérivées. */
export type PersonPhoto = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  blurDataUrl?: string;
};

/** À n'appeler qu'après la policy : la signature vaut droit de lecture. */
export function signedPhoto(
  photo: { mediaId: string; width: number; height: number; blurDataUrl?: string | undefined },
  now: Date,
  key: Buffer,
): PersonPhoto {
  const url = (width: MediaWidth) => signMediaUrl({ mediaId: photo.mediaId, width, now, key });
  // Une dérivée n'agrandit jamais : sa largeur réelle plafonne à celle de l'original.
  const candidates = new Map<number, string>();
  for (const width of MEDIA_WIDTHS) {
    const actual = Math.min(width, photo.width);
    if (!candidates.has(actual)) candidates.set(actual, url(width));
  }
  return {
    src: url(768),
    srcSet: [...candidates].map(([actual, src]) => `${src} ${actual}w`).join(', '),
    width: photo.width,
    height: photo.height,
    ...(photo.blurDataUrl ? { blurDataUrl: photo.blurDataUrl } : {}),
  };
}
