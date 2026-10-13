'use server';

import { revalidatePath } from 'next/cache';
import { isAppError, ValidationError } from '@/server/_shared/errors';
import { requireSession } from '@/server/auth/session';
import { getMembersDeps } from '@/server/members/members.instance';
import {
  claimOwnPerson,
  decideAccessRequest,
  inviteMember,
  requestAccess,
  setAdmin,
} from '@/server/members/members.service';

// Actions des écrans Membres et Admin. L'identité vient toujours de la session ;
// les droits sont revérifiés dans le service.

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const field = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
};

/** Un refus métier devient un message ; une panne inattendue remonte. */
function toResult(error: unknown): ActionResult {
  if (error instanceof ValidationError) {
    return { ok: false, error: 'Vérifie les champs du formulaire.' };
  }
  if (isAppError(error)) return { ok: false, error: error.message };
  throw error;
}

export async function inviteAction(_: ActionResult | undefined, data: FormData) {
  const { user } = await requireSession();
  const email = field(data, 'email');
  try {
    await inviteMember(getMembersDeps(), user.id, { personId: field(data, 'personId'), email });
  } catch (error) {
    return toResult(error);
  }
  revalidatePath('/members');
  return { ok: true, message: `Invitation envoyée à ${email}.` } satisfies ActionResult;
}

export async function requestAccessAction(
  _: ActionResult | undefined,
  data: FormData,
): Promise<ActionResult> {
  try {
    await requestAccess(getMembersDeps(), {
      name: field(data, 'name'),
      email: field(data, 'email'),
      relation: field(data, 'relation'),
    });
  } catch (error) {
    return toResult(error);
  }
  return { ok: true };
}

export async function decideAccessRequestAction(
  _: ActionResult | undefined,
  data: FormData,
): Promise<ActionResult> {
  const { user } = await requireSession();
  const decision =
    field(data, 'decision') === 'accept'
      ? ({ accept: true, personId: field(data, 'personId') } as const)
      : ({ accept: false } as const);
  try {
    await decideAccessRequest(getMembersDeps(), user.id, field(data, 'requestId'), decision);
  } catch (error) {
    return toResult(error);
  }
  revalidatePath('/admin');
  return { ok: true };
}

export async function setAdminAction(
  _: ActionResult | undefined,
  data: FormData,
): Promise<ActionResult> {
  const { user } = await requireSession();
  try {
    await setAdmin(
      getMembersDeps(),
      user.id,
      field(data, 'membershipId'),
      field(data, 'makeAdmin') === 'true',
    );
  } catch (error) {
    return toResult(error);
  }
  revalidatePath('/members');
  return { ok: true };
}

/** « C'est moi » : relie le compte de la session à sa fiche (admin sans fiche). */
export async function claimPersonAction(
  _: ActionResult | undefined,
  data: FormData,
): Promise<ActionResult> {
  const { user } = await requireSession();
  try {
    await claimOwnPerson(getMembersDeps(), user.id, field(data, 'personId'));
  } catch (error) {
    return toResult(error);
  }
  // L'avatar, le menu et la vue par défaut de l'arbre dépendent de la fiche reliée.
  revalidatePath('/', 'layout');
  return { ok: true, message: 'C’est noté : l’arbre part maintenant de toi.' };
}
