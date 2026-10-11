import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError, ValidationError } from '@/server/_shared/errors';

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  inviteMember: vi.fn(),
  requestAccess: vi.fn(),
  decideAccessRequest: vi.fn(),
  setAdmin: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/server/auth/session', () => ({ requireSession: mocks.requireSession }));
vi.mock('@/server/members/members.instance', () => ({ getMembersDeps: () => ({ deps: true }) }));
vi.mock('@/server/members/members.service', () => ({
  inviteMember: mocks.inviteMember,
  requestAccess: mocks.requestAccess,
  decideAccessRequest: mocks.decideAccessRequest,
  setAdmin: mocks.setAdmin,
}));

import {
  decideAccessRequestAction,
  inviteAction,
  requestAccessAction,
  setAdminAction,
} from './members.actions';

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

describe('members.actions', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.requireSession.mockResolvedValue({ user: { id: 'u-hugo' } });
  });

  it('invite au nom de la session, jamais d’un identifiant envoyé par le client', async () => {
    const result = await inviteAction(
      undefined,
      form({ personId: 'lea', email: 'lea@exemple.fr', userId: 'u-pirate' }),
    );
    expect(mocks.inviteMember).toHaveBeenCalledWith({ deps: true }, 'u-hugo', {
      personId: 'lea',
      email: 'lea@exemple.fr',
    });
    expect(result).toEqual({ ok: true, message: 'Invitation envoyée à lea@exemple.fr.' });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/members');
  });

  it('traduit un refus métier en message pour l’écran', async () => {
    mocks.inviteMember.mockRejectedValue(
      new AppError({ message: 'Cette personne a déjà un compte', code: 'X', status: 409 }),
    );
    expect(await inviteAction(undefined, form({ personId: 'luc', email: 'l@e.fr' }))).toEqual({
      ok: false,
      error: 'Cette personne a déjà un compte',
    });
  });

  it('une saisie invalide dit de vérifier les champs', async () => {
    mocks.inviteMember.mockRejectedValue(new ValidationError('Invitation invalide'));
    expect(await inviteAction(undefined, form({ personId: '', email: 'x' }))).toEqual({
      ok: false,
      error: 'Vérifie les champs du formulaire.',
    });
  });

  it('laisse remonter une panne inattendue', async () => {
    mocks.inviteMember.mockRejectedValue(new Error('base indisponible'));
    await expect(
      inviteAction(undefined, form({ personId: 'lea', email: 'l@e.fr' })),
    ).rejects.toThrow('base indisponible');
  });

  it('la demande d’accès est publique et donne la même réponse dans tous les cas', async () => {
    mocks.requestAccess.mockResolvedValue({ id: 'r1' });
    const result = await requestAccessAction(
      undefined,
      form({ name: 'Xavier Roux', email: 'x@exemple.fr', relation: 'Voisin' }),
    );
    expect(mocks.requireSession).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it('accepte une demande en reliant la fiche choisie', async () => {
    await decideAccessRequestAction(
      undefined,
      form({ requestId: 'r1', decision: 'accept', personId: 'isabelle' }),
    );
    expect(mocks.decideAccessRequest).toHaveBeenCalledWith({ deps: true }, 'u-hugo', 'r1', {
      accept: true,
      personId: 'isabelle',
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('refuse une demande', async () => {
    await decideAccessRequestAction(undefined, form({ requestId: 'r1', decision: 'refuse' }));
    expect(mocks.decideAccessRequest).toHaveBeenCalledWith({ deps: true }, 'u-hugo', 'r1', {
      accept: false,
    });
  });

  it('nomme ou retire un admin', async () => {
    await setAdminAction(undefined, form({ membershipId: 'm1', makeAdmin: 'true' }));
    expect(mocks.setAdmin).toHaveBeenCalledWith({ deps: true }, 'u-hugo', 'm1', true);
    await setAdminAction(undefined, form({ membershipId: 'm1', makeAdmin: 'false' }));
    expect(mocks.setAdmin).toHaveBeenLastCalledWith({ deps: true }, 'u-hugo', 'm1', false);
  });
});
