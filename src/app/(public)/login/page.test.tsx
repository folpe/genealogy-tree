// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth-client', () => ({ authClient: { signIn: {} } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

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
});
