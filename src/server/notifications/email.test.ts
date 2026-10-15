import { describe, expect, it, vi } from 'vitest';
import { accessRequestEmail, createEmailSender, invitationEmail, magicLinkEmail } from './email';

const message = { to: 'luc@exemple.fr', subject: 'Sujet', text: 'Texte', html: '<p>Texte</p>' };

describe('createEmailSender', () => {
  it('passe par Resend quand la clé est là', async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: 'e1' }, error: null });
    const log = vi.fn();
    const sender = createEmailSender({
      from: 'Racines <famille@folpe.me>',
      isProduction: true,
      transport: { send },
      log,
    });
    await sender(message);
    expect(send).toHaveBeenCalledWith({ from: 'Racines <famille@folpe.me>', ...message });
    expect(log).not.toHaveBeenCalled();
  });

  it('remonte une erreur de Resend au lieu de l’avaler', async () => {
    const send = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'domaine non vérifié' } });
    const sender = createEmailSender({
      from: 'f',
      isProduction: true,
      transport: { send },
      log: vi.fn(),
    });
    await expect(sender(message)).rejects.toThrow('domaine non vérifié');
  });

  it('en local sans clé, affiche l’email dans la console', async () => {
    const log = vi.fn();
    const sender = createEmailSender({ from: 'f', isProduction: false, log });
    await sender(message);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Texte'));
  });

  it('en production sans clé, refuse plutôt que d’écrire un lien dans les logs', async () => {
    const log = vi.fn();
    const sender = createEmailSender({ from: 'f', isProduction: true, log });
    await expect(sender(message)).rejects.toThrow('RESEND_API_KEY');
    expect(log).not.toHaveBeenCalled();
  });
});

/** Attributs `href` du HTML, décodés comme le ferait un client mail. */
const hrefs = (html: string) =>
  [...html.matchAll(/href="([^"]*)"/g)].map((m) => (m[1] ?? '').replaceAll('&amp;', '&'));

describe('gabarits (React Email, style Album)', () => {
  it('posent la mise en page commune : français, 600 px, logo servi par l’app, aperçu', async () => {
    const email = await magicLinkEmail(
      'luc@exemple.fr',
      'https://famille.folpe.me/api/auth/x?token=t',
    );
    expect(email.html).toMatch(/^<!DOCTYPE html/);
    expect(email.html).toContain('lang="fr"');
    expect(email.html).toContain('max-width:600px');
    expect(email.html).toContain('src="https://famille.folpe.me/email/logo.png"');
    expect(email.html).toContain('Fraunces');
    // Aperçu affiché par les boîtes mail à côté de l'objet.
    expect(email.html).toContain('Valable 15 minutes, pour une seule connexion.');
  });

  it('n’ont qu’un texte brut lisible, sans balise', async () => {
    const email = await magicLinkEmail(
      'luc@exemple.fr',
      'https://famille.folpe.me/api/auth/x?token=t',
    );
    expect(email.text).not.toMatch(/<[a-z]/i);
    expect(email.text).not.toContain('Valable 15 minutes, pour une seule connexion.');
  });
});

describe('magicLinkEmail', () => {
  it('donne le lien, sa durée et son usage unique, en tutoyant', async () => {
    const url = 'https://famille.folpe.me/api/auth/x?token=t&callbackURL=%2Ftree';
    const email = await magicLinkEmail('luc@exemple.fr', url);
    expect(email.to).toBe('luc@exemple.fr');
    expect(email.subject).toBe('Ton lien pour entrer dans l’arbre');
    expect(email.text).toContain(url);
    expect(email.text).toContain('15 minutes');
    expect(hrefs(email.html)).toContain(url);
    expect(email.html).toContain('Entrer dans l’arbre');
  });

  it('échappe le lien dans le HTML', async () => {
    const email = await magicLinkEmail('a@b.fr', 'https://x.fr/?a=1&b="2"');
    expect(email.html).not.toContain('b="2"');
    expect(email.html).toContain('&quot;2&quot;');
  });
});

describe('invitationEmail', () => {
  const invitation = {
    to: 'lea@exemple.fr',
    inviterName: 'Hugo',
    firstName: 'Léa',
    url: 'https://famille.folpe.me/invite/jeton',
  };

  it('dit qui invite, pour quelle fiche, et donne le lien', async () => {
    const email = await invitationEmail(invitation);
    expect(email.subject).toBe('Hugo t’invite dans l’arbre de la famille');
    expect(email.text).toContain('Bonjour Léa');
    expect(email.text).toContain('https://famille.folpe.me/invite/jeton');
    expect(email.text).toContain('14 jours');
    expect(hrefs(email.html)).toContain('https://famille.folpe.me/invite/jeton');
    expect(email.html).toContain('Rejoindre l’arbre');
  });

  it('annonce une demande acceptée quand l’invitation y répond', async () => {
    const email = await invitationEmail({ ...invitation, reason: 'accepted-request' });
    expect(email.subject).toBe('Ta demande est acceptée : bienvenue dans l’arbre');
    expect(email.text).toContain('Hugo a accepté ta demande');
    expect(hrefs(email.html)).toContain('https://famille.folpe.me/invite/jeton');
  });

  it('échappe les noms saisis par la famille', async () => {
    const email = await invitationEmail({ ...invitation, inviterName: '<b>Hugo</b>' });
    expect(email.html).not.toContain('<b>Hugo</b>');
    expect(email.html).toContain('&lt;b&gt;Hugo&lt;/b&gt;');
  });
});

describe('accessRequestEmail', () => {
  it('résume la demande pour les admins et renvoie vers l’administration', async () => {
    const email = await accessRequestEmail({
      to: 'folpe@exemple.fr',
      name: 'Isabelle Lefèvre',
      email: 'isabelle@exemple.fr',
      relation: 'Cousine de Luc',
      url: 'https://famille.folpe.me/admin',
    });
    expect(email.subject).toBe('Demande d’accès : Isabelle Lefèvre');
    expect(email.text).toContain('isabelle@exemple.fr');
    expect(email.text).toContain('Cousine de Luc');
    expect(email.text).toContain('https://famille.folpe.me/admin');
    expect(hrefs(email.html)).toContain('https://famille.folpe.me/admin');
  });
});
