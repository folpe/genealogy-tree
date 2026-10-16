import { AppError } from '../_shared/errors';
import { buildAccessContext, canEdit } from '../access/access.policy';
import { ImageTooLargeError } from '../media/media.image';
import { type MediaDeps, setProfilePhoto, storeImage } from '../media/media.service';
import { loadAccessMembers } from '../members/members.repository';
import { buildFamilyIndex } from './family.helper';
import { loadFamilyGraph } from './family.repository';

// Changer la photo d'une fiche (retour de Folpe). La policy décide comme pour les
// autres champs ; le service média normalise (rotation, EXIF et GPS retirés,
// dérivées WebP) et la photo devient celle de la fiche. L'ancienne reste rangée.

/** Au-delà, l'envoi est refusé : le navigateur réduit la photo avant de l'envoyer. */
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;

const UNREADABLE = /Image non prise en charge|unsupported image format|Input buffer/i;

export async function changePhoto(
  deps: MediaDeps,
  viewerUserId: string,
  personId: string,
  bytes: Buffer,
): Promise<void> {
  if (bytes.length > PHOTO_MAX_BYTES) {
    throw new AppError({
      message: 'Photo trop lourde : 4 Mo au plus.',
      code: 'MEDIA_TOO_LARGE',
      status: 413,
    });
  }
  const [members, graph] = await Promise.all([
    loadAccessMembers(deps.db),
    loadFamilyGraph(deps.db),
  ]);
  const viewer = members.find((m) => m.userId === viewerUserId);
  if (!viewer) {
    throw new AppError({ message: 'Accès réservé', code: 'FAMILY_FORBIDDEN', status: 403 });
  }
  const index = buildFamilyIndex(graph);
  if (!index.persons.has(personId)) {
    throw new AppError({ message: 'Fiche introuvable', code: 'FAMILY_NOT_FOUND', status: 404 });
  }
  const decision = canEdit(buildAccessContext(index, members), viewer, personId, {
    fields: ['photo'],
  });
  if (decision.mode !== 'direct') {
    throw new AppError({
      message: 'Cette fiche est hors de ta lignée : tu ne peux pas encore en changer la photo.',
      code: 'FAMILY_OUTSIDE_PERIMETER',
      status: 403,
    });
  }
  let mediaId: string;
  try {
    ({ mediaId } = await storeImage(deps, { personId, bytes }));
  } catch (error) {
    // Refusée sur l'en-tête, ou au décodage si l'en-tête taisait ses dimensions.
    if (
      error instanceof ImageTooLargeError ||
      (error instanceof Error && /pixel limit/i.test(error.message))
    ) {
      throw new AppError({
        message: 'Photo trop grande : choisis-en une plus petite.',
        code: 'MEDIA_TOO_LARGE',
        status: 413,
        cause: error,
      });
    }
    // Octets qui ne sont pas une image, ou format refusé : sharp ou le normaliseur.
    if (error instanceof Error && UNREADABLE.test(error.message)) {
      throw new AppError({
        message: 'Ce fichier n’est pas une photo lisible (JPEG, PNG ou WebP).',
        code: 'MEDIA_UNSUPPORTED',
        status: 415,
        cause: error,
      });
    }
    throw error;
  }
  await setProfilePhoto(deps.db, personId, mediaId);
}
