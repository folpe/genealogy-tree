import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, redirect } = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  }),
}));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ cookie: 'c=1' }) }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('./auth.instance', () => ({ getAuth: () => ({ api: { getSession } }) }));

import { requireSession } from './session';

describe('requireSession', () => {
  beforeEach(() => {
    getSession.mockReset();
    redirect.mockClear();
  });

  it('renvoie la session quand elle est valide', async () => {
    const session = { user: { id: 'u1', email: 'luc@exemple.fr' }, session: { id: 's1' } };
    getSession.mockResolvedValue(session);
    await expect(requireSession()).resolves.toBe(session);
    expect(getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });

  it('renvoie vers la connexion sans session, même si le proxy a laissé passer', async () => {
    getSession.mockResolvedValue(null);
    await expect(requireSession()).rejects.toThrow('redirect:/login');
  });
});
