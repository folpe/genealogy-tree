// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { magicLink, passkeySignIn, push } = vi.hoisted(() => ({
  magicLink: vi.fn(),
  passkeySignIn: vi.fn(),
  push: vi.fn(),
}));
vi.mock('@/lib/auth-client', () => ({
  authClient: { signIn: { magicLink, passkey: passkeySignIn } },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import { LoginForm } from './login-form';

describe('LoginForm', () => {
  beforeEach(() => {
    magicLink.mockReset().mockResolvedValue({ data: { status: true }, error: null });
    passkeySignIn.mockReset();
    push.mockReset();
  });

  it('envoie le lien puis confirme, avec l’adresse saisie', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Ton email' }), 'luc@exemple.fr');
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir mon lien' }));

    expect(magicLink).toHaveBeenCalledWith({ email: 'luc@exemple.fr', callbackURL: '/tree' });
    expect(screen.getByRole('heading', { name: 'Regarde tes emails' })).toBeVisible();
    expect(screen.getByText('luc@exemple.fr')).toBeVisible();
    expect(screen.getByText(/valable 15 minutes et ne sert qu’une fois/)).toBeVisible();
  });

  it('permet de changer d’adresse', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Ton email' }), 'luc@exemple.fr');
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir mon lien' }));
    await userEvent.click(screen.getByRole('button', { name: 'Changer d’email' }));
    expect(screen.getByRole('textbox', { name: 'Ton email' })).toHaveValue('luc@exemple.fr');
  });

  it('dit qu’il faut réessayer si l’envoi échoue, sans rien révéler de plus', async () => {
    magicLink.mockResolvedValue({ data: null, error: { status: 429, message: 'Too many' } });
    render(<LoginForm />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Ton email' }), 'luc@exemple.fr');
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir mon lien' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Réessaie dans une minute');
  });

  it('se connecte avec une passkey et ouvre l’arbre', async () => {
    passkeySignIn.mockResolvedValue({ data: { session: {} }, error: null });
    render(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Me connecter avec une passkey' }));
    expect(passkeySignIn).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/tree');
  });

  it('préremplit l’adresse d’une invitation', () => {
    render(<LoginForm defaultEmail="lea@exemple.fr" />);
    expect(screen.getByRole('textbox', { name: 'Ton email' })).toHaveValue('lea@exemple.fr');
  });
});
