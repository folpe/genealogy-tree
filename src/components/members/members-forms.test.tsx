// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccessRequestCard, AdminToggle, InviteForm, RequestAccessForm } from './members-forms';

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
    expect(await screen.findByRole('heading', { name: 'Merci, on te répond vite' })).toBeVisible();
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

describe('InviteForm', () => {
  const invitable = [
    { personId: 'lea', label: 'Léa Marchand' },
    { personId: 'sophie', label: 'Sophie Marchand' },
  ];

  it('invite une fiche de mon cercle avec son adresse', async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ ok: true, message: 'Invitation envoyée à lea@exemple.fr.' });
    render(<InviteForm action={action} invitable={invitable} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Qui inviter ?' }), 'lea');
    await userEvent.type(screen.getByRole('textbox', { name: 'Son email' }), 'lea@exemple.fr');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer l’invitation' }));
    expect(sentFields(action)).toEqual({ personId: 'lea', email: 'lea@exemple.fr' });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Invitation envoyée à lea@exemple.fr.',
    );
  });

  it('dit quand il n’y a plus personne à inviter', () => {
    render(<InviteForm action={vi.fn()} invitable={[]} />);
    expect(screen.getByText(/Tout ton cercle proche a déjà un compte/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Envoyer l’invitation' })).toBeNull();
  });
});

describe('AdminToggle', () => {
  it('nomme admin un membre', async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<AdminToggle action={action} membershipId="m1" isAdmin={false} label="Hugo" />);
    await userEvent.click(screen.getByRole('button', { name: 'Nommer Hugo admin' }));
    expect(sentFields(action)).toEqual({ membershipId: 'm1', makeAdmin: 'true' });
  });

  it('retire le rôle et affiche un refus', async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, error: 'Il faut au moins un admin' });
    render(<AdminToggle action={action} membershipId="m1" isAdmin label="Hugo" />);
    await userEvent.click(screen.getByRole('button', { name: 'Retirer le rôle d’admin de Hugo' }));
    expect(sentFields(action)).toEqual({ membershipId: 'm1', makeAdmin: 'false' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Il faut au moins un admin');
  });
});

describe('AccessRequestCard', () => {
  const request = {
    id: 'r1',
    name: 'Isabelle Lefèvre',
    email: 'isabelle@exemple.fr',
    relation: 'Cousine de Luc',
  };
  const persons = [{ personId: 'isabelle', label: 'Isabelle Lefèvre' }];

  it('accepte en reliant la fiche choisie', async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<AccessRequestCard action={action} request={request} persons={persons} />);
    expect(screen.getByText('Cousine de Luc')).toBeVisible();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sa fiche' }), 'isabelle');
    await userEvent.click(screen.getByRole('button', { name: 'Accepter' }));
    expect(sentFields(action)).toEqual({
      requestId: 'r1',
      personId: 'isabelle',
      decision: 'accept',
    });
  });

  it('refuse', async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<AccessRequestCard action={action} request={request} persons={persons} />);
    await userEvent.click(screen.getByRole('button', { name: 'Refuser' }));
    expect(sentFields(action)).toMatchObject({ requestId: 'r1', decision: 'refuse' });
  });
});
