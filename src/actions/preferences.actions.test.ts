import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ set: vi.fn(), requireSession: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: mocks.set }) }));
vi.mock('@/server/auth/session', () => ({ requireSession: mocks.requireSession }));

import { setThemeAction } from './preferences.actions';

describe('setThemeAction', () => {
  beforeEach(() => {
    mocks.set.mockReset();
    mocks.requireSession.mockReset().mockResolvedValue({ user: { id: 'u-hugo' } });
  });

  it('retient le thème un an, pour ce seul site', async () => {
    await setThemeAction('dark');
    expect(mocks.set).toHaveBeenCalledWith(
      'ances-tree-theme',
      'dark',
      expect.objectContaining({ maxAge: 31_536_000, sameSite: 'lax', httpOnly: true, path: '/' }),
    );
  });

  it('une valeur inconnue revient à « Système »', async () => {
    await setThemeAction('violet');
    expect(mocks.set).toHaveBeenCalledWith('ances-tree-theme', 'system', expect.anything());
  });

  it('réservé aux comptes connectés', async () => {
    mocks.requireSession.mockRejectedValue(new Error('redirect'));
    await expect(setThemeAction('dark')).rejects.toThrow('redirect');
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
