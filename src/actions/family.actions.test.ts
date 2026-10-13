import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError, ValidationError } from '@/server/_shared/errors';

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  addRelative: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/server/auth/session', () => ({ requireSession: mocks.requireSession }));
vi.mock('@/server/family/family.instance', () => ({ getFamilyDeps: () => ({ deps: true }) }));
vi.mock('@/server/family/relatives.service', () => ({ addRelative: mocks.addRelative }));

import { addRelativeAction } from './family.actions';

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

describe('addRelativeAction', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.requireSession.mockResolvedValue({ user: { id: 'u-hugo' } });
  });

  it('ajoute au nom de la session, et rafraîchit les vues', async () => {
    mocks.addRelative.mockResolvedValue({ personId: 'p-new' });
    const result = await addRelativeAction(
      undefined,
      form({ anchorId: 'bernard', relation: 'parent', firstName: 'Marcel', userId: 'u-pirate' }),
    );
    expect(mocks.addRelative).toHaveBeenCalledWith(
      { deps: true },
      'u-hugo',
      expect.objectContaining({ anchorId: 'bernard', firstName: 'Marcel' }),
    );
    expect(result).toEqual({ ok: true, personId: 'p-new', message: 'Fiche de Marcel créée.' });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('traduit un refus métier ou une saisie invalide en message', async () => {
    mocks.addRelative.mockRejectedValueOnce(
      new AppError({ message: 'Hugo a déjà ses deux parents', code: 'X', status: 422 }),
    );
    expect(await addRelativeAction(undefined, form({}))).toEqual({
      ok: false,
      error: 'Hugo a déjà ses deux parents',
    });
    mocks.addRelative.mockRejectedValueOnce(new ValidationError('Fiche invalide'));
    expect(await addRelativeAction(undefined, form({}))).toEqual({
      ok: false,
      error: 'Vérifie les champs du formulaire.',
    });
    const zod = z.object({ birth: z.string().refine(() => false, 'Date illisible') });
    mocks.addRelative.mockRejectedValueOnce(
      new ValidationError('Fiche invalide', zod.safeParse({ birth: '' }).error),
    );
    expect(await addRelativeAction(undefined, form({}))).toEqual({
      ok: false,
      error: 'Date illisible',
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('laisse remonter une panne inattendue', async () => {
    mocks.addRelative.mockRejectedValue(new Error('base injoignable'));
    await expect(addRelativeAction(undefined, form({}))).rejects.toThrow('base injoignable');
  });
});
