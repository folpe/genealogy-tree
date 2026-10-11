import { describe, expect, it, vi } from 'vitest';
import { createEmailSender, magicLinkEmail } from './email';

const message = { to: 'luc@exemple.fr', subject: 'Sujet', text: 'Texte', html: '<p>Texte</p>' };

describe('createEmailSender', () => {
  it('passe par Resend quand la clé est là', async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: 'e1' }, error: null });
    const log = vi.fn();
    const sender = createEmailSender({
      from: 'Ances-Tree <famille@folpe.me>',
      isProduction: true,
      transport: { send },
      log,
    });
    await sender(message);
    expect(send).toHaveBeenCalledWith({ from: 'Ances-Tree <famille@folpe.me>', ...message });
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

describe('magicLinkEmail', () => {
  it('donne le lien, sa durée et son usage unique, en tutoyant', () => {
    const email = magicLinkEmail('luc@exemple.fr', 'https://famille.folpe.me/api/auth/x?token=t');
    expect(email.to).toBe('luc@exemple.fr');
    expect(email.subject).toBe('Ton lien pour entrer dans l’arbre');
    expect(email.text).toContain('https://famille.folpe.me/api/auth/x?token=t');
    expect(email.text).toContain('15 minutes');
    expect(email.html).toContain('href="https://famille.folpe.me/api/auth/x?token=t"');
  });

  it('échappe le lien dans le HTML', () => {
    expect(magicLinkEmail('a@b.fr', 'https://x.fr/?a=1&b="2"').html).toContain(
      'https://x.fr/?a=1&amp;b=&quot;2&quot;',
    );
  });
});
