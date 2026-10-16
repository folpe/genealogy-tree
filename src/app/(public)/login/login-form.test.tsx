// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { magicLink, passkeySignIn, social, push } = vi.hoisted(() => ({
  magicLink: vi.fn(),
  passkeySignIn: vi.fn(),
  social: vi.fn(),
  push: vi.fn(),
}));
vi.mock('@/lib/auth-client', () => ({
  authClient: { signIn: { magicLink, passkey: passkeySignIn, social } },
}));
vi.stubGlobal('location', { assign: push });

import { LoginForm } from './login-form';

describe('LoginForm', () => {
  beforeEach(() => {
    magicLink.mockReset().mockResolvedValue({ data: { status: true }, error: null });
    passkeySignIn.mockReset();
    social.mockReset().mockResolvedValue({ data: { redirect: true }, error: null });
    push.mockReset();
  });

  it('envoie le lien puis confirme, avec l’adresse saisie', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Ton email' }), 'luc@exemple.fr');
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir mon lien' }));

    expect(magicLink).toHaveBeenCalledWith({
      email: 'luc@exemple.fr',
      callbackURL: '/login/passkey',
      errorCallbackURL: '/login',
    });
    const heading = screen.getByRole('heading', { level: 1, name: 'Regarde tes emails' });
    expect(heading).toHaveFocus();
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

  it('renvoie le lien et le dit', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Ton email' }), 'luc@exemple.fr');
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir mon lien' }));
    await userEvent.click(screen.getByRole('button', { name: 'Renvoyer le lien' }));
    expect(magicLink).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Lien renvoyé' })).toBeVisible();
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

  it('accueille par défaut comme un retour, ou avec l’entrée donnée', () => {
    const { unmount } = render(<LoginForm />);
    expect(screen.getByRole('heading', { level: 1, name: 'Entre dans l’arbre' })).toBeVisible();
    expect(screen.getByRole('heading')).not.toHaveFocus();
    unmount();
    render(
      <LoginForm intro={{ kicker: 'Invitation', title: 'Bonjour Léa', lead: 'Bienvenue.' }} />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Bonjour Léa' })).toBeVisible();
  });

  it('ne montre le pied de l’étape email qu’à cette étape', async () => {
    render(<LoginForm footer={<a href="/request-access">Demander l’accès</a>} />);
    expect(screen.getByRole('link', { name: 'Demander l’accès' })).toBeVisible();
    await userEvent.type(screen.getByRole('textbox', { name: 'Ton email' }), 'luc@exemple.fr');
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir mon lien' }));
    expect(screen.queryByRole('link', { name: 'Demander l’accès' })).toBeNull();
  });

  it('sans Google configuré, pas de bouton Google', () => {
    render(<LoginForm />);
    expect(screen.queryByRole('button', { name: 'Continuer avec Google' })).toBeNull();
  });

  it('avec Google, part chez Google vers la même destination que le lien', async () => {
    render(<LoginForm google />);
    await userEvent.click(screen.getByRole('button', { name: 'Continuer avec Google' }));
    expect(social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/login/passkey',
      errorCallbackURL: '/login?via=google',
    });
  });

  it('dit qu’il faut réessayer si le départ vers Google échoue', async () => {
    social.mockResolvedValue({ data: null, error: { status: 500, message: 'Erreur' } });
    render(<LoginForm google />);
    await userEvent.click(screen.getByRole('button', { name: 'Continuer avec Google' }));
    expect(screen.getByRole('alert')).toHaveTextContent('La connexion avec Google n’a pas abouti');
  });
});
