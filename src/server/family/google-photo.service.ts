// tdd-cover: e2e src/server/family/google-photo.service.integration.test.ts
import { eq } from 'drizzle-orm';
import { memberships, persons } from '../db/schema';
import type { MediaDeps } from '../media/media.service';
import { fetchRemoteImage } from '../media/remote-image';
import { decideGooglePhotoImport, type GooglePhotoImport, googlePhotoUrl } from './google-photo';
import { changePhoto, PHOTO_MAX_BYTES } from './person-photo.service';

// Photo Google importée à la création du compte Google (décision du 2026-10-16),
// sur la fiche du membre si elle n'en a pas. L'import passe par `changePhoto` au nom
// du membre : mêmes droits, mêmes dérivées qu'un ajout de photo à la main.

export type GooglePhotoDeps = MediaDeps & { fetch: typeof fetch };

/** Le membre attend la fin de sa connexion : le téléchargement ne la retient pas plus. */
const GOOGLE_PHOTO_TIMEOUT_MS = 5000;

export async function importGooglePhoto(
  deps: GooglePhotoDeps,
  input: { userId: string; idToken: string | undefined },
): Promise<GooglePhotoImport> {
  const [member] = await deps.db
    .select({ personId: memberships.personId, photoMediaId: persons.photoMediaId })
    .from(memberships)
    .leftJoin(persons, eq(persons.id, memberships.personId))
    .where(eq(memberships.userId, input.userId));
  const decision = decideGooglePhotoImport({
    url: input.idToken ? googlePhotoUrl(input.idToken) : undefined,
    member: member && {
      personId: member.personId ?? undefined,
      personHasPhoto: Boolean(member.photoMediaId),
    },
  });
  if (!decision.import) return decision;
  const bytes = await fetchRemoteImage(deps.fetch, decision.url, {
    timeoutMs: GOOGLE_PHOTO_TIMEOUT_MS,
    maxBytes: PHOTO_MAX_BYTES,
  });
  await changePhoto(deps, input.userId, decision.personId, bytes);
  return decision;
}
