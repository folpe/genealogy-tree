// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { googleEnabled, preview } = vi.hoisted(() => ({
  googleEnabled: vi.fn(() => false),
  preview: vi.fn(),
}));
vi.mock('@/lib/auth-client', () => ({ authClient: { signIn: {} } }));
vi.mock('@/env', () => ({ googleSignInEnabled: googleEnabled }));
vi.mock('@/server/db/client', () => ({ getDb: () => ({}) }));
vi.mock('@/server/members/members.service', () => ({ getInvitationPreview: preview }));

import InvitePage from './page';

const params = Promise.resolve({ token: 'jeton-de-test' });

describe('page d’invitation', () => {
  beforeEach(() => {
    googleEnabled.mockReset().mockReturnValue(false);
    preview.mockReset().mockResolvedValue({
      email: 'lea@exemple.fr',
      firstName: 'Léa',
      inviterName: 'Hugo',
    });
  });

  it('accueille l’invitée avec son adresse préremplie', async () => {
    render(await InvitePage({ params }));
    expect(screen.getByRole('heading', { level: 1, name: 'Bonjour Léa' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Ton email' })).toHaveValue('lea@exemple.fr');
  });

  it('propose Google seulement quand il est configuré', async () => {
    const { unmount } = render(await InvitePage({ params }));
    expect(screen.queryByRole('button', { name: 'Continuer avec Google' })).toBeNull();
    unmount();
    googleEnabled.mockReturnValue(true);
    render(await InvitePage({ params }));
    expect(screen.getByRole('button', { name: 'Continuer avec Google' })).toBeEnabled();
  });

  it('une invitation qui n’est plus valable ne propose aucune connexion', async () => {
    preview.mockResolvedValue(undefined);
    googleEnabled.mockReturnValue(true);
    render(await InvitePage({ params }));
    expect(screen.getByRole('heading', { name: 'Ce lien n’est plus valable' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Continuer avec Google' })).toBeNull();
  });
});
