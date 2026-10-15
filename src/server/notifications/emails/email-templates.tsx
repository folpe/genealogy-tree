// tdd-cover: e2e src/server/notifications/email.test.ts

import { APP_NAME } from '@/lib/brand';
import {
  EmailLayout,
  FallbackLink,
  Note,
  Paragraph,
  PersonCard,
  PrimaryButton,
  Quote,
} from './email-layout';

// Les quatre emails de la phase 3 : connexion, invitation, demande acceptée et
// demande d'accès reçue (admins). Textes en français, tutoiement.

const FAMILY_FOOTER = `Tu reçois cet email parce que tu fais partie de ${APP_NAME}, l’arbre privé de la famille.`;

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

export function MagicLinkEmail({ origin, url }: { origin: string; url: string }) {
  return (
    <EmailLayout
      origin={origin}
      preview="Valable 15 minutes, pour une seule connexion."
      kicker="Connexion"
      title="Ton lien pour entrer dans l’arbre"
      footer={`Tu reçois cet email parce qu’une connexion à ${APP_NAME} a été demandée avec cette adresse.`}
    >
      <Paragraph>
        Bonjour, voici ton lien pour entrer dans l’arbre de la famille. Pas de mot de passe à
        retenir : un clic suffit.
      </Paragraph>
      <PrimaryButton href={url}>Entrer dans l’arbre</PrimaryButton>
      <Note>
        Le lien est valable 15 minutes et ne sert qu’une fois. Si tu n’as rien demandé, ignore
        simplement cet email : personne n’entre sans lui.
      </Note>
      <FallbackLink href={url} />
    </EmailLayout>
  );
}

export type InvitationReason = 'invitation' | 'accepted-request';

export function InvitationEmail({
  origin,
  url,
  inviterName,
  firstName,
  reason,
}: {
  origin: string;
  url: string;
  inviterName: string;
  firstName: string;
  reason: InvitationReason;
}) {
  const accepted = reason === 'accepted-request';
  return (
    <EmailLayout
      origin={origin}
      preview={
        accepted
          ? 'Ta fiche t’attend dans l’arbre de la famille.'
          : `${inviterName} t’a réservé une place dans l’arbre de la famille.`
      }
      kicker={accepted ? 'Demande acceptée' : 'Invitation'}
      title={
        accepted ? `Bienvenue dans l’arbre, ${firstName}` : `${inviterName} t’invite dans l’arbre`
      }
      footer={FAMILY_FOOTER}
    >
      <Paragraph>
        Bonjour {firstName},{' '}
        {accepted
          ? `${inviterName} a accepté ta demande et relié ton compte à ta fiche.`
          : `${inviterName} t’invite à rejoindre l’arbre de la famille.`}{' '}
        C’est un espace privé où chacun complète sa branche : dates, lieux, photos et souvenirs.
      </Paragraph>
      <PersonCard
        initials={initialsOf(firstName)}
        name={firstName}
        detail="Ta fiche t’attend dans l’arbre"
      />
      <PrimaryButton href={url}>Rejoindre l’arbre</PrimaryButton>
      <Note>
        Le lien reste valable 14 jours. Pas de mot de passe : tu recevras un lien de connexion par
        email.
      </Note>
      <FallbackLink href={url} />
    </EmailLayout>
  );
}

export function AccessRequestEmail({
  origin,
  url,
  name,
  email,
  relation,
}: {
  origin: string;
  url: string;
  name: string;
  email: string;
  relation: string;
}) {
  return (
    <EmailLayout
      origin={origin}
      preview={`${name} attend ta réponse pour entrer dans l’arbre.`}
      kicker="Demande d’accès"
      title={`${name} demande à rejoindre l’arbre`}
      footer={`Tu reçois cet email parce que tu es admin de l’arbre de la famille sur ${APP_NAME}.`}
    >
      <PersonCard initials={initialsOf(name)} name={name} detail={email} />
      <Quote label="Qui est-ce dans la famille">{relation}</Quote>
      <Paragraph>
        Si tu reconnais cette personne, relie-la à sa fiche : elle recevra son invitation. Sinon,
        refuse la demande.
      </Paragraph>
      <PrimaryButton href={url}>Voir la demande</PrimaryButton>
      <FallbackLink href={url} />
    </EmailLayout>
  );
}
