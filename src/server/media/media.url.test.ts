import { describe, expect, it } from 'vitest';
import { mediaUrlKey, signedPhoto, signMediaUrl, verifyMediaUrl } from './media.url';

const key = mediaUrlKey('un-secret-de-test-assez-long-pour-better-auth');
const at = (iso: string) => new Date(iso);

function parse(url: string) {
  const parsed = new URL(url, 'https://famille.test');
  const [, , mediaId = '', width = ''] = parsed.pathname.split('/');
  return {
    mediaId,
    width,
    expires: parsed.searchParams.get('e') ?? undefined,
    signature: parsed.searchParams.get('s') ?? undefined,
  };
}

describe('signMediaUrl', () => {
  it('donne un chemin relatif vers la dérivée demandée', () => {
    const url = signMediaUrl({ mediaId: 'm1', width: 768, now: at('2026-10-12T10:20:00Z'), key });
    expect(url).toMatch(/^\/media\/m1\/768\?e=\d+&s=[\w-]+$/);
  });

  it('reste stable dans la même heure, pour le cache du navigateur', () => {
    const first = signMediaUrl({ mediaId: 'm1', width: 256, now: at('2026-10-12T10:01:00Z'), key });
    const later = signMediaUrl({ mediaId: 'm1', width: 256, now: at('2026-10-12T10:59:00Z'), key });
    expect(later).toBe(first);
  });
});

describe('verifyMediaUrl', () => {
  const signedAt = at('2026-10-12T10:20:00Z');
  const signed = parse(signMediaUrl({ mediaId: 'm1', width: 768, now: signedAt, key }));

  it('accepte une URL signée encore valide et renvoie la largeur', () => {
    const verdict = verifyMediaUrl({ ...signed, now: at('2026-10-12T11:30:00Z'), key });
    expect(verdict).toEqual({ ok: true, width: 768, maxAgeSeconds: 1_800 });
  });

  it('refuse une URL expirée (au plus deux heures)', () => {
    expect(verifyMediaUrl({ ...signed, now: at('2026-10-12T12:00:01Z'), key }).ok).toBe(false);
  });

  it('refuse une autre photo ou une autre taille avec la même signature', () => {
    const now = signedAt;
    expect(verifyMediaUrl({ ...signed, mediaId: 'm2', now, key }).ok).toBe(false);
    expect(verifyMediaUrl({ ...signed, width: '1600', now, key }).ok).toBe(false);
  });

  it('refuse une expiration repoussée à la main', () => {
    const expires = String(Number(signed.expires) + 3_600);
    expect(verifyMediaUrl({ ...signed, expires, now: signedAt, key }).ok).toBe(false);
  });

  it('refuse une signature d’une autre clé, absente ou mal formée', () => {
    const other = mediaUrlKey('un-autre-secret-de-test-tout-aussi-long-que-le-premier');
    const now = signedAt;
    expect(verifyMediaUrl({ ...signed, now, key: other }).ok).toBe(false);
    expect(verifyMediaUrl({ ...signed, signature: undefined, now, key }).ok).toBe(false);
    expect(verifyMediaUrl({ ...signed, signature: 'abc', now, key }).ok).toBe(false);
    expect(verifyMediaUrl({ ...signed, expires: 'demain', now, key }).ok).toBe(false);
  });

  it('refuse une taille qui n’est pas une dérivée', () => {
    const url = parse(signMediaUrl({ mediaId: 'm1', width: 256, now: signedAt, key }));
    expect(verifyMediaUrl({ ...url, width: '300', now: signedAt, key }).ok).toBe(false);
  });
});

describe('signedPhoto', () => {
  const now = at('2026-10-12T10:20:00Z');

  it('signe chaque dérivée et décrit sa largeur réelle pour srcset', () => {
    const photo = signedPhoto(
      { mediaId: 'm1', width: 1000, height: 500, blurDataUrl: 'data:image/webp;base64,AA' },
      now,
      key,
    );
    const url = (w: 256 | 768 | 1600) => signMediaUrl({ mediaId: 'm1', width: w, now, key });
    expect(photo).toEqual({
      src: url(768),
      srcSet: `${url(256)} 256w, ${url(768)} 768w, ${url(1600)} 1000w`,
      width: 1000,
      height: 500,
      blurDataUrl: 'data:image/webp;base64,AA',
    });
  });

  it('ne répète pas une largeur quand l’original est petit', () => {
    const photo = signedPhoto({ mediaId: 'm1', width: 200, height: 200 }, now, key);
    expect(photo.srcSet).toBe(`${signMediaUrl({ mediaId: 'm1', width: 256, now, key })} 200w`);
    expect(photo).not.toHaveProperty('blurDataUrl');
  });
});
