// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addPasskey, replace } = vi.hoisted(() => ({ addPasskey: vi.fn(), replace: vi.fn() }));
vi.mock('@/lib/auth-client', () => ({ authClient: { passkey: { addPasskey } } }));
vi.stubGlobal('location', { replace });

import { PasskeyOffer } from './passkey-offer';

describe('PasskeyOffer', () => {
  beforeEach(() => {
    addPasskey.mockReset();
    replace.mockReset();
  });

  it('accueille par le prénom et propose Face ID ou Touch ID', () => {
    render(<PasskeyOffer firstName="Léa" />);
    expect(screen.getByText('Bienvenue Léa')).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 1, name: 'La prochaine fois, un simple regard suffit' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Plus tard' })).toHaveAttribute('href', '/tree');
  });

  it('active la passkey puis ouvre l’arbre', async () => {
    addPasskey.mockResolvedValue({ data: {}, error: null });
    render(<PasskeyOffer firstName="Léa" />);
    await userEvent.click(screen.getByRole('button', { name: 'Activer Face ID ou Touch ID' }));
    expect(addPasskey).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/tree');
  });

  it('reste sur place si l’appareil refuse, sans bloquer l’entrée', async () => {
    addPasskey.mockResolvedValue({ data: null, error: { message: 'NotAllowedError' } });
    render(<PasskeyOffer firstName="Léa" />);
    await userEvent.click(screen.getByRole('button', { name: 'Activer Face ID ou Touch ID' }));
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('depuis le menu de ton compte');
    expect(screen.getByRole('link', { name: 'Plus tard' })).toBeVisible();
  });

  it('remet à plus tard sans laisser la proposition dans l’historique', async () => {
    render(<PasskeyOffer firstName="Léa" />);
    await userEvent.click(screen.getByRole('link', { name: 'Plus tard' }));
    expect(replace).toHaveBeenCalledWith('/tree');
  });
});
