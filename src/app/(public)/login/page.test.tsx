// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { googleEnabled } = vi.hoisted(() => ({ googleEnabled: vi.fn(() => false) }));
vi.mock('@/lib/auth-client', () => ({ authClient: { signIn: {} } }));
vi.mock('@/env', () => ({ googleSignInEnabled: googleEnabled }));

import LoginPage from './page';

describe('page de connexion', () => {
  it('invite à entrer dans l’arbre avec son email ou une passkey', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('heading', { level: 1, name: 'Entre dans l’arbre' })).toBeVisible();
    const email = screen.getByRole('textbox', { name: 'Ton email' });
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete', 'email webauthn');
    expect(screen.getByRole('button', { name: 'Recevoir mon lien' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Me connecter avec une passkey' })).toBeEnabled();
  });

  it('rappelle que l’espace est privé', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));
    // Une fois dans la carte (téléphone), une fois dans le canevas (grand écran).
    expect(screen.getAllByText(/seuls les membres invités voient l’arbre/)).toHaveLength(2);
    expect(screen.getByText(/Pas encore invité/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Demander l’accès' })).toHaveAttribute(
      'href',
      '/request-access',
    );
  });

  it('dit qu’un lien n’est plus valable quand better-auth y renvoie', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ error: 'INVALID_TOKEN' }) }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ce lien n’est plus valable');
  });

  it('propose Google seulement quand il est configuré', async () => {
    const { unmount } = render(await LoginPage({ searchParams: Promise.resolve({}) }));
    expect(screen.queryByRole('button', { name: 'Continuer avec Google' })).toBeNull();
    unmount();
    googleEnabled.mockReturnValue(true);
    render(await LoginPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('button', { name: 'Continuer avec Google' })).toBeEnabled();
  });

  it('dit clairement qu’une adresse Google n’est pas invitée', async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({ via: 'google', error: 'unable_to_create_user' }),
      }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Cette adresse Google n’a pas reçu d’invitation',
    );
  });

  it('distingue l’abandon chez Google et les autres échecs Google', async () => {
    const { unmount } = render(
      await LoginPage({ searchParams: Promise.resolve({ via: 'google', error: 'access_denied' }) }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Connexion avec Google annulée');
    unmount();
    render(
      await LoginPage({ searchParams: Promise.resolve({ via: 'google', error: 'invalid_code' }) }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('La connexion avec Google n’a pas abouti');
  });
});
