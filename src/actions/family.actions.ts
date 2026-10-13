'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { isAppError, ValidationError } from '@/server/_shared/errors';
import { requireSession } from '@/server/auth/session';
import { getFamilyDeps } from '@/server/family/family.instance';
import {
  getRelationship,
  getSearchDirectory,
  type RelationshipView,
  type SearchDirectory,
} from '@/server/family/family.service';
import { editPerson } from '@/server/family/person-edit.service';
import { changePhoto } from '@/server/family/person-photo.service';
import { addRelative } from '@/server/family/relatives.service';
import { getMediaDeps } from '@/server/media/media.instance';

// Actions d'édition de l'arbre. L'identité vient toujours de la session ; la policy et
// les invariants sont revérifiés dans le service.

export type AddRelativeResult =
  | { ok: true; personId: string; message: string }
  | { ok: false; error: string };

/** Un refus métier devient un message ; une panne inattendue remonte. */
function toResult(error: unknown): AddRelativeResult {
  if (error instanceof ValidationError) {
    const issue = error.cause instanceof z.ZodError ? error.cause.issues[0]?.message : undefined;
    return { ok: false, error: issue ?? 'Vérifie les champs du formulaire.' };
  }
  if (isAppError(error)) return { ok: false, error: error.message };
  throw error;
}

export async function addRelativeAction(
  _: AddRelativeResult | undefined,
  data: FormData,
): Promise<AddRelativeResult> {
  const { user } = await requireSession();
  const fields = Object.fromEntries(
    [...data.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
  let personId: string;
  try {
    ({ personId } = await addRelative(getFamilyDeps(), user.id, fields));
  } catch (error) {
    return toResult(error);
  }
  // L'arbre, l'éventail et les fiches lisent tous le graphe.
  revalidatePath('/', 'layout');
  return { ok: true, personId, message: `Fiche de ${fields['firstName']?.trim() ?? ''} créée.` };
}

/** Annuaire du ⌘K, chargé à la première ouverture : les fiches visibles et les liens. */
export async function searchDirectoryAction(): Promise<SearchDirectory> {
  const { user } = await requireSession();
  return getSearchDirectory(getFamilyDeps(), user.id);
}

export type RelationshipResult =
  | { ok: true; view: RelationshipView }
  | { ok: false; error: string };

const personIdSchema = z.string().min(1).max(64);

/** « Notre lien » avec une fiche, à la demande depuis le panneau. */
export async function relationshipAction(targetId: unknown): Promise<RelationshipResult> {
  const { user } = await requireSession();
  const parsed = personIdSchema.safeParse(targetId);
  if (!parsed.success) return { ok: false, error: 'Fiche invalide.' };
  try {
    return { ok: true, view: await getRelationship(getFamilyDeps(), user.id, parsed.data) };
  } catch (error) {
    if (isAppError(error)) return { ok: false, error: error.message };
    throw error;
  }
}

export type EditResult = { ok: true } | { ok: false; error: string };

/** Modification sur place d'un champ de fiche ; la policy décide au serveur. */
export async function editPersonAction(data: FormData): Promise<EditResult> {
  const { user } = await requireSession();
  const fields = Object.fromEntries(
    [...data.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
  try {
    await editPerson(getFamilyDeps(), user.id, fields);
  } catch (error) {
    const result = toResult(error);
    return result.ok ? { ok: true } : result;
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Nouvelle photo d'une fiche, déjà réduite dans le navigateur. */
export async function changePhotoAction(data: FormData): Promise<EditResult> {
  const { user } = await requireSession();
  const personId = data.get('personId');
  const photo = data.get('photo');
  const id = personIdSchema.safeParse(personId);
  if (!id.success || !(photo instanceof File) || photo.size === 0) {
    return { ok: false, error: 'Choisis une photo.' };
  }
  try {
    await changePhoto(getMediaDeps(), user.id, id.data, Buffer.from(await photo.arrayBuffer()));
  } catch (error) {
    const result = toResult(error);
    return result.ok ? { ok: true } : result;
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}
