'use client';

import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import {
  fieldLabel,
  KeyIcon,
  Kicker,
  MailIcon,
  pillField,
  pillPrimary,
  pillSecondary,
  StepBadge,
} from '@/components/auth/auth-ui';
import { RevealTitle } from '@/components/auth/reveal-title';
import { authClient } from '@/lib/auth-client';

// Étapes « email » et « envoyé » de la maquette Connexion. Le lien ramène sur
// /login/passkey, qui propose la passkey une fois connecté (étape « passkey »).

type Step = { name: 'email' } | { name: 'sent'; email: string };

type Intro = { kicker: string; title: string; lead: ReactNode };

const LOGIN_INTRO: Intro = {
  kicker: 'Bon retour',
  title: 'Entre dans l’arbre',
  lead: 'Pas de mot de passe. On t’envoie un lien de connexion par email.',
};

/** Où le lien magique ramène : la proposition de passkey, qui renvoie à l'arbre. */
const AFTER_LINK = '/login/passkey';
/** Lien expiré ou déjà servi : better-auth y ajoute `?error=…`, lu par la page. */
const LINK_FAILED = '/login';

export function LoginForm({
  defaultEmail = '',
  intro = LOGIN_INTRO,
  notice,
  footer,
}: {
  defaultEmail?: string;
  intro?: Intro;
  /** Message d'accueil de l'étape email (lien expiré). */
  notice?: string | undefined;
  /** Sous l'étape email seulement (lien vers la demande d'accès). */
  footer?: ReactNode;
}) {
  const [step, setStep] = useState<Step>({ name: 'email' });
  const [email, setEmail] = useState(defaultEmail);
  const [pending, setPending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | undefined>(notice);
  /** Une étape atteinte par un geste entre en fondu ; celle du chargement est là d'emblée (LCP). */
  const [moved, setMoved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);

  // Au changement d'étape, le focus suit le nouveau titre ; pas au premier affichage.
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    heading.current?.focus();
  });

  function goTo(next: Step) {
    focusHeading.current = true;
    setMoved(true);
    setError(undefined);
    setResent(false);
    setStep(next);
  }

  async function sendLink() {
    setPending(true);
    setError(undefined);
    const { error: failure } = await authClient.signIn.magicLink({
      email,
      callbackURL: AFTER_LINK,
      errorCallbackURL: LINK_FAILED,
    });
    setPending(false);
    if (failure) setError('L’envoi n’a pas abouti. Réessaie dans une minute.');
    return !failure;
  }

  if (step.name === 'sent') {
    return (
      <SentStep
        email={step.email}
        heading={heading}
        pending={pending}
        resent={resent}
        error={error}
        onResend={async () => setResent(await sendLink())}
        onChangeEmail={() => goTo({ name: 'email' })}
      />
    );
  }

  return (
    <EmailStep
      intro={intro}
      heading={heading}
      email={email}
      onEmail={setEmail}
      pending={pending}
      error={error}
      onError={setError}
      onSubmit={async () => {
        if (await sendLink()) goTo({ name: 'sent', email });
      }}
      footer={footer}
      entering={moved}
    />
  );
}

type HeadingRef = RefObject<HTMLHeadingElement | null>;

function EmailStep(props: {
  intro: Intro;
  heading: HeadingRef;
  email: string;
  onEmail: (email: string) => void;
  pending: boolean;
  error: string | undefined;
  onError: (error: string) => void;
  onSubmit: () => Promise<void>;
  footer: ReactNode;
  entering: boolean;
}) {
  async function signInWithPasskey() {
    const result = await authClient.signIn.passkey();
    if (result?.error) {
      // Fermer la fenêtre de Face ID n'est pas une absence de passkey.
      props.onError(
        'code' in result.error && result.error.code === 'AUTH_CANCELLED'
          ? 'Connexion annulée. Réessaie, ou reçois plutôt un lien par email.'
          : 'Aucune passkey reconnue sur cet appareil. Reçois plutôt un lien par email.',
      );
      return;
    }
    // Chargement complet : l'arbre joue son entrée au premier document de l'onglet.
    globalThis.location.assign('/tree');
  }

  return (
    <div className={`flex flex-col gap-[22px] ${props.entering ? 'step-in' : ''}`}>
      <div className="flex flex-col gap-2.5">
        <Kicker>{props.intro.kicker}</Kicker>
        <RevealTitle ref={props.heading} text={props.intro.title} />
        <p className="text-base leading-normal text-ink-2">{props.intro.lead}</p>
      </div>
      <div className="flex flex-col gap-3">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void props.onSubmit();
          }}
        >
          <label htmlFor="email" className={fieldLabel}>
            Ton email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email webauthn"
            placeholder="prenom@exemple.fr"
            required
            value={props.email}
            onChange={(event) => props.onEmail(event.target.value)}
            className={pillField}
          />
          <button type="submit" disabled={props.pending} className={`${pillPrimary} mt-1`}>
            Recevoir mon lien
          </button>
        </form>
        <button type="button" onClick={signInWithPasskey} className={pillSecondary}>
          <KeyIcon />
          Me connecter avec une passkey
        </button>
      </div>
      {props.error ? <ErrorNote>{props.error}</ErrorNote> : undefined}
      {props.footer}
    </div>
  );
}

function SentStep(props: {
  email: string;
  heading: HeadingRef;
  pending: boolean;
  resent: boolean;
  error: string | undefined;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
}) {
  return (
    <div className="step-in flex flex-col items-center gap-[18px] text-center">
      <StepBadge tone="accent">
        <MailIcon />
      </StepBadge>
      <Kicker>Lien envoyé</Kicker>
      <RevealTitle ref={props.heading} text="Regarde tes emails" />
      <p className="text-base leading-normal text-ink-2">
        On vient d’envoyer un lien à{' '}
        <strong className="font-semibold text-ink">{props.email}</strong>. Il est valable 15 minutes
        et ne sert qu’une fois.
      </p>
      <div className="mt-2 flex w-full flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={() => void props.onResend()}
          disabled={props.pending}
          className={pillSecondary}
        >
          {props.resent ? 'Lien renvoyé' : 'Renvoyer le lien'}
        </button>
        <button type="button" onClick={props.onChangeEmail} className={pillSecondary}>
          Changer d’email
        </button>
      </div>
      {props.error ? <ErrorNote>{props.error}</ErrorNote> : undefined}
      <p className="text-[13px] text-ink-3">Rien reçu ? Pense à regarder dans les indésirables.</p>
    </div>
  );
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-accent">
      {children}
    </p>
  );
}
