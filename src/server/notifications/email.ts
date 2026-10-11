// Envoi des emails de l'app. Resend en ligne ; en local sans clé, l'email est
// affiché dans la console pour suivre le lien. Les gabarits au style Album
// (React Email) remplaceront ces versions simples.

export type EmailMessage = { to: string; subject: string; text: string; html: string };

type Transport = {
  send: (
    payload: EmailMessage & { from: string },
  ) => Promise<{ error: { message: string } | null }>; // allow-null: forme de réponse de Resend
};

export function createEmailSender(options: {
  from: string;
  isProduction: boolean;
  transport?: Transport | undefined;
  log: (line: string) => void;
}) {
  return async (message: EmailMessage): Promise<void> => {
    if (!options.transport) {
      if (options.isProduction) {
        throw new Error('Envoi d’email impossible : RESEND_API_KEY manquante');
      }
      options.log(`[email] à ${message.to} : ${message.subject}\n${message.text}`);
      return;
    }
    const result = await options.transport.send({ from: options.from, ...message });
    if (result.error) throw new Error(`Envoi d’email refusé par Resend : ${result.error.message}`);
  };
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function magicLinkEmail(to: string, url: string): EmailMessage {
  const href = escapeHtml(url);
  return {
    to,
    subject: 'Ton lien pour entrer dans l’arbre',
    text: [
      'Bonjour,',
      '',
      'Voici ton lien pour entrer dans l’arbre de la famille :',
      url,
      '',
      'Il est valable 15 minutes et ne sert qu’une fois.',
      'Si tu n’as rien demandé, ignore simplement cet email.',
    ].join('\n'),
    html: `<p>Bonjour,</p><p>Voici ton lien pour entrer dans l’arbre de la famille :</p><p><a href="${href}">Entrer dans l’arbre</a></p><p>Il est valable 15 minutes et ne sert qu’une fois. Si tu n’as rien demandé, ignore simplement cet email.</p>`,
  };
}
