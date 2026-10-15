// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RequestAccessForm } from './request-access-form';

function sentFields(action: ReturnType<typeof vi.fn>) {
  const data: unknown = action.mock.calls.at(-1)?.[1];
  if (!(data instanceof FormData)) throw new Error('aucun formulaire envoyé');
  return Object.fromEntries(data.entries());
}

describe('RequestAccessForm', () => {
  it('envoie nom, email et lien de parenté, puis remercie', async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<RequestAccessForm action={action} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Prénom et nom' }), 'Xavier Roux');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'x@exemple.fr');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Qui es-tu dans la famille ?' }),
      'Le cousin de Luc',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer ma demande' }));
    expect(sentFields(action)).toEqual({
      name: 'Xavier Roux',
      email: 'x@exemple.fr',
      relation: 'Le cousin de Luc',
    });
    const thanks = await screen.findByRole('heading', {
      level: 1,
      name: 'Merci, on te répond vite',
    });
    expect(thanks).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Revenir à la connexion' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('affiche le refus', async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, error: 'Trop de demandes' });
    render(<RequestAccessForm action={action} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Prénom et nom' }), 'Xavier Roux');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'x@exemple.fr');
    await userEvent.type(screen.getByRole('textbox', { name: 'Qui es-tu dans la famille ?' }), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer ma demande' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de demandes');
  });
});
