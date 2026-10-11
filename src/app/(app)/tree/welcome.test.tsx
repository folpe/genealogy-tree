// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addPasskey, signOut, push } = vi.hoisted(() => ({
  addPasskey: vi.fn(),
  signOut: vi.fn(),
  push: vi.fn(),
}));
vi.mock('@/lib/auth-client', () => ({
  authClient: { passkey: { addPasskey }, signOut },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import { Welcome } from './welcome';

describe('Welcome', () => {
  beforeEach(() => {
    addPasskey.mockReset().mockResolvedValue({ data: {}, error: null });
    signOut.mockReset().mockResolvedValue({});
    push.mockReset();
  });

  it('propose d’activer une passkey quand l’appareil n’en a pas', async () => {
    render(<Welcome email="luc@exemple.fr" hasPasskey={false} />);
    expect(screen.getByText('luc@exemple.fr')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Activer Face ID / Touch ID' }));
    expect(addPasskey).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'La prochaine fois, un simple regard suffit',
    );
  });

  it('dit simplement que c’est remis à plus tard si l’activation échoue', async () => {
    addPasskey.mockResolvedValue({ data: null, error: { message: 'annulé' } });
    render(<Welcome email="luc@exemple.fr" hasPasskey={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Activer Face ID / Touch ID' }));
    expect(screen.getByRole('status')).toHaveTextContent('tu pourras l’activer plus tard');
  });

  it('ne propose rien quand une passkey existe déjà', () => {
    render(<Welcome email="luc@exemple.fr" hasPasskey />);
    expect(screen.queryByRole('button', { name: 'Activer Face ID / Touch ID' })).toBeNull();
  });

  it('se déconnecte et revient à la connexion', async () => {
    render(<Welcome email="luc@exemple.fr" hasPasskey />);
    await userEvent.click(screen.getByRole('button', { name: 'Me déconnecter' }));
    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/login');
  });
});
