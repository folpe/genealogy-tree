// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoginPage from './page';

describe('page de connexion', () => {
  it('invite à entrer dans l’arbre avec son email', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Entre dans l’arbre' })).toBeVisible();
    const email = screen.getByRole('textbox', { name: 'Ton email' });
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete', 'email');
  });

  it('n’envoie rien tant que les comptes ne sont pas ouverts', () => {
    render(<LoginPage />);
    const submit = screen.getByRole('button', { name: 'Recevoir mon lien' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAccessibleDescription('Les comptes ouvrent très bientôt.');
  });

  it('rappelle que l’espace est privé', () => {
    render(<LoginPage />);
    expect(screen.getByText(/seuls les membres invités voient l’arbre/)).toBeVisible();
  });
});
