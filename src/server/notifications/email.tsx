import type { ReactElement } from 'react';
import { render, toPlainText } from 'react-email';
import {
  AccessRequestEmail,
  InvitationEmail,
  type InvitationReason,
  MagicLinkEmail,
} from './emails/email-templates';

// Envoi des emails de l'app. Resend en ligne ; en local sans clé, l'email est
// affiché dans la console pour suivre le lien. Gabarits React Email au style
// Album dans emails/ ; chaque message part en HTML et en texte brut.

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

/** HTML du gabarit, et sa version texte pour les clients qui n'affichent pas le HTML. */
async function compose(to: string, subject: string, element: ReactElement): Promise<EmailMessage> {
  const html = await render(element);
  return { to, subject, html, text: toPlainText(html) };
}

/** Le logo est servi par l'app elle-même : on reprend l'origine du lien envoyé. */
const originOf = (url: string) => new URL(url).origin;

export function magicLinkEmail(to: string, url: string): Promise<EmailMessage> {
  return compose(
    to,
    'Ton lien pour entrer dans l’arbre',
    <MagicLinkEmail origin={originOf(url)} url={url} />,
  );
}

export function invitationEmail(input: {
  to: string;
  inviterName: string;
  firstName: string;
  url: string;
  reason?: InvitationReason;
}): Promise<EmailMessage> {
  const reason = input.reason ?? 'invitation';
  return compose(
    input.to,
    reason === 'accepted-request'
      ? 'Ta demande est acceptée : bienvenue dans l’arbre'
      : `${input.inviterName} t’invite dans l’arbre de la famille`,
    <InvitationEmail
      origin={originOf(input.url)}
      url={input.url}
      inviterName={input.inviterName}
      firstName={input.firstName}
      reason={reason}
    />,
  );
}

export function accessRequestEmail(input: {
  to: string;
  name: string;
  email: string;
  relation: string;
  url: string;
}): Promise<EmailMessage> {
  return compose(
    input.to,
    `Demande d’accès : ${input.name}`,
    <AccessRequestEmail
      origin={originOf(input.url)}
      url={input.url}
      name={input.name}
      email={input.email}
      relation={input.relation}
    />,
  );
}
