import { z } from 'zod';

// Photo Google d'un membre (décision du 2026-10-16) : importée sur sa fiche quand
// celle-ci n'en a pas encore. Ici, la partie pure : l'URL lue dans l'idToken, et la
// décision d'importer ou non.

/** Seuls les serveurs d'images de Google sont appelés (garde-fou SSRF). */
const GOOGLE_PHOTO_HOST_SUFFIX = '.googleusercontent.com';

/** Google sert 96 px par défaut ; on demande assez grand pour les dérivées de la fiche. */
const SMALL_SIZE_SUFFIX = /=s96-c$/;
const LARGE_SIZE_SUFFIX = '=s800-c';

const pictureClaims = z.object({ picture: z.string().optional() });

/**
 * URL de la photo d'un idToken Google, ou `undefined` si absente ou hors de l'hôte
 * autorisé. La signature n'est pas vérifiée : better-auth vient de recevoir et de
 * vérifier ce jeton auprès de Google.
 */
export function googlePhotoUrl(idToken: string): string | undefined {
  const picture = readPicture(idToken);
  if (!picture || !URL.canParse(picture)) return undefined;
  const url = new URL(picture);
  if (url.protocol !== 'https:' || !url.hostname.endsWith(GOOGLE_PHOTO_HOST_SUFFIX)) {
    return undefined;
  }
  return url.href.replace(SMALL_SIZE_SUFFIX, LARGE_SIZE_SUFFIX);
}

function readPicture(idToken: string): string | undefined {
  const payload = idToken.split('.')[1];
  if (!payload) return undefined;
  try {
    const claims = pictureClaims.safeParse(
      JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')),
    );
    return claims.success ? claims.data.picture : undefined;
  } catch {
    // Charge utile qui n'est pas du JSON : pas de photo, rien de plus.
    return undefined;
  }
}

export type GooglePhotoImport =
  | { import: true; personId: string; url: string }
  | {
      import: false;
      reason: 'no-google-photo' | 'no-member' | 'no-person' | 'already-has-photo';
    };

/** Importer seulement sur la fiche liée au membre, et seulement si elle est vide. */
export function decideGooglePhotoImport(input: {
  url: string | undefined;
  member: { personId: string | undefined; personHasPhoto: boolean } | undefined;
}): GooglePhotoImport {
  if (!input.url) return { import: false, reason: 'no-google-photo' };
  if (!input.member) return { import: false, reason: 'no-member' };
  if (!input.member.personId) return { import: false, reason: 'no-person' };
  if (input.member.personHasPhoto) return { import: false, reason: 'already-has-photo' };
  return { import: true, personId: input.member.personId, url: input.url };
}
