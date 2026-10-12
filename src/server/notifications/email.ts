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

export function invitationEmail(input: {
  to: string;
  inviterName: string;
  firstName: string;
  url: string;
}): EmailMessage {
  const inviter = escapeHtml(input.inviterName);
  const firstName = escapeHtml(input.firstName);
  return {
    to: input.to,
    subject: `${input.inviterName} t’invite dans l’arbre de la famille`,
    text: [
      `Bonjour ${input.firstName},`,
      '',
      `${input.inviterName} t’invite à rejoindre l’arbre de la famille : un espace privé où chacun complète sa branche.`,
      '',
      'Pour entrer, ouvre ce lien :',
      input.url,
      '',
      'Il reste valable 14 jours. Pas de mot de passe : tu recevras un lien de connexion par email.',
    ].join('\n'),
    html: `<p>Bonjour ${firstName},</p><p>${inviter} t’invite à rejoindre l’arbre de la famille : un espace privé où chacun complète sa branche.</p><p><a href="${escapeHtml(input.url)}">Rejoindre l’arbre</a></p><p>Le lien reste valable 14 jours. Pas de mot de passe : tu recevras un lien de connexion par email.</p>`,
  };
}

export function accessRequestEmail(input: {
  to: string;
  name: string;
  email: string;
  relation: string;
  url: string;
}): EmailMessage {
  return {
    to: input.to,
    subject: `Demande d’accès : ${input.name}`,
    text: [
      `${input.name} (${input.email}) demande à rejoindre l’arbre.`,
      `Qui est-ce dans la famille : ${input.relation}`,
      '',
      'Pour l’accepter et la relier à sa fiche :',
      input.url,
    ].join('\n'),
    html: `<p>${escapeHtml(input.name)} (${escapeHtml(input.email)}) demande à rejoindre l’arbre.</p><p>Qui est-ce dans la famille : ${escapeHtml(input.relation)}</p><p><a href="${escapeHtml(input.url)}">Voir la demande</a></p>`,
  };
}
