import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn(), requireSession: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ set: mocks.set, delete: mocks.delete }),
}));
vi.mock('@/server/auth/session', () => ({ requireSession: mocks.requireSession }));

import { setThemeAction } from './preferences.actions';

describe('setThemeAction', () => {
  beforeEach(() => {
    mocks.set.mockReset();
    mocks.delete.mockReset();
    mocks.requireSession.mockReset().mockResolvedValue({ user: { id: 'u-hugo' } });
  });

  it('retient le thème un an, pour ce seul site', async () => {
    await setThemeAction('dark');
    expect(mocks.set).toHaveBeenCalledWith(
      'racines-theme',
      'dark',
      expect.objectContaining({ maxAge: 31_536_000, sameSite: 'lax', httpOnly: true, path: '/' }),
    );
  });

  it('efface le cookie d’avant le renommage : un seul thème fait foi', async () => {
    await setThemeAction('dark');
    expect(mocks.delete).toHaveBeenCalledWith('ances-tree-theme');
  });

  it('une valeur inconnue revient à « Système »', async () => {
    await setThemeAction('violet');
    expect(mocks.set).toHaveBeenCalledWith('racines-theme', 'system', expect.anything());
  });

  it('réservé aux comptes connectés', async () => {
    mocks.requireSession.mockRejectedValue(new Error('redirect'));
    await expect(setThemeAction('dark')).rejects.toThrow('redirect');
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
