// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth-client', () => ({ authClient: { signIn: {} } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import LoginPage from './page';

describe('page de connexion', () => {
  it('invite à entrer dans l’arbre avec son email ou une passkey', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Entre dans l’arbre' })).toBeVisible();
    const email = screen.getByRole('textbox', { name: 'Ton email' });
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete', 'email webauthn');
    expect(screen.getByRole('button', { name: 'Recevoir mon lien' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Me connecter avec une passkey' })).toBeEnabled();
  });

  it('rappelle que l’espace est privé', () => {
    render(<LoginPage />);
    expect(screen.getByText(/seuls les membres invités voient l’arbre/)).toBeVisible();
  });
});
