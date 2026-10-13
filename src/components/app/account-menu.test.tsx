// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addPasskey, signOut, push, refresh } = vi.hoisted(() => ({
  addPasskey: vi.fn(),
  signOut: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/lib/auth-client', () => ({
  authClient: { passkey: { addPasskey }, signOut },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

import { AccountMenu } from './account-menu';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

const hugo = {
  personId: 'hugo',
  name: 'Hugo Marchand',
  initials: 'HM',
  email: 'hugo@exemple.fr',
  isAdmin: false,
};

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: 'Mon compte, Hugo Marchand' }));
  return screen.findByRole('menu');
}

function setUserAgent(userAgent: string) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
}

describe('AccountMenu', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    addPasskey.mockReset().mockResolvedValue({ data: {}, error: null });
    signOut.mockReset().mockResolvedValue({});
    push.mockReset();
    refresh.mockReset();
  });

  it('l’avatar porte les initiales et ouvre le menu du compte', async () => {
    render(<AccountMenu account={hugo} hasPasskey />);
    expect(screen.getByRole('button', { name: 'Mon compte, Hugo Marchand' })).toHaveTextContent(
      'HM',
    );
    const menu = await openMenu();
    expect(within(menu).getByText('hugo@exemple.fr')).toBeVisible();
    expect(within(menu).getByRole('menuitem', { name: 'Ma fiche' })).toHaveAttribute(
      'href',
      '/people/hugo',
    );
    expect(within(menu).getByRole('menuitem', { name: 'Membres' })).toHaveAttribute(
      'href',
      '/members',
    );
    expect(within(menu).queryByRole('menuitem', { name: 'Demandes d’accès' })).toBeNull();
  });

  it('un admin voit les demandes d’accès ; sans fiche, pas de « Ma fiche »', async () => {
    render(<AccountMenu account={{ ...hugo, personId: undefined, isAdmin: true }} hasPasskey />);
    const menu = await openMenu();
    expect(within(menu).getByRole('menuitem', { name: 'Demandes d’accès' })).toHaveAttribute(
      'href',
      '/admin',
    );
    expect(within(menu).queryByRole('menuitem', { name: 'Ma fiche' })).toBeNull();
  });

  it('se déconnecte depuis le menu et revient à la connexion', async () => {
    render(<AccountMenu account={hugo} hasPasskey />);
    const menu = await openMenu();
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Me déconnecter' }));
    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('propose Face ID tant que l’appareil n’a pas de passkey, et confirme', async () => {
    render(<AccountMenu account={hugo} hasPasskey={false} />);
    const menu = await openMenu();
    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'Activer Face ID / Touch ID' }),
    );
    expect(addPasskey).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent('un simple regard suffit');
    expect(refresh).toHaveBeenCalled();
  });

  it('dit que c’est remis à plus tard si l’activation échoue', async () => {
    addPasskey.mockResolvedValue({ data: undefined, error: { message: 'annulé' } });
    render(<AccountMenu account={hugo} hasPasskey={false} />);
    const menu = await openMenu();
    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'Activer Face ID / Touch ID' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('tu pourras l’activer plus tard');
  });

  it('sur iPhone, « Installer l’app » explique le bouton Partager', async () => {
    setUserAgent(IPHONE);
    render(<AccountMenu account={hugo} hasPasskey />);
    const menu = await openMenu();
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Installer l’app' }));
    const dialog = await screen.findByRole('dialog', { name: 'Installer Ances-Tree' });
    expect(dialog).toHaveTextContent('Partager');
    expect(dialog).toHaveTextContent('Sur l’écran d’accueil');
  });

  it('sans moyen d’installer, rien n’est proposé', async () => {
    render(<AccountMenu account={hugo} hasPasskey />);
    const menu = await openMenu();
    expect(within(menu).queryByRole('menuitem', { name: 'Installer l’app' })).toBeNull();
  });
});
