'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import type { ActionResult } from '@/actions/members.actions';
import {
  CheckIcon,
  fieldLabel,
  Kicker,
  pillField,
  pillPrimary,
  pillSecondary,
  StepBadge,
} from '@/components/auth/auth-ui';
import { RevealTitle } from '@/components/auth/reveal-title';

// Étapes « demande » et « demande envoyée » de la maquette Connexion.

type Action = (state: ActionResult | undefined, data: FormData) => Promise<ActionResult>;

export function RequestAccessForm({ action }: { action: Action }) {
  const [state, submit, pending] = useActionState(action, undefined);
  const thanks = useRef<HTMLHeadingElement>(null);
  const sent = state?.ok === true;

  useEffect(() => {
    if (sent) thanks.current?.focus();
  }, [sent]);

  if (sent) {
    return (
      <div className="step-in flex flex-col items-center gap-[18px] text-center">
        <StepBadge tone="accent">
          <CheckIcon />
        </StepBadge>
        <Kicker>Demande envoyée</Kicker>
        <RevealTitle ref={thanks} text="Merci, on te répond vite" />
        <p className="text-base leading-normal text-ink-2">
          Dès qu’un administrateur valide ta demande, tu reçois un lien de connexion par email. En
          général, sous 48 heures.
        </p>
        <Link href="/login" className={`${pillSecondary} mt-2`}>
          Revenir à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="step-in flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2.5">
        <Kicker>Demande d’accès</Kicker>
        <RevealTitle text="Rejoins la famille" />
        <p className="text-[15px] leading-normal text-ink-2">
          Un administrateur vérifie ta demande et te relie à ta fiche. Le plus simple reste de
          demander à un proche déjà inscrit de t’inviter.
        </p>
      </div>
      <form action={submit} className="flex flex-col gap-3">
        <label htmlFor="name" className={fieldLabel}>
          Prénom et nom
        </label>
        <input id="name" name="name" required autoComplete="name" className={pillField} />
        <label htmlFor="email" className={`${fieldLabel} mt-1`}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="prenom@exemple.fr"
          className={pillField}
        />
        <label htmlFor="relation" className={`${fieldLabel} mt-1`}>
          Qui es-tu dans la famille ?
        </label>
        <textarea
          id="relation"
          name="relation"
          required
          rows={3}
          placeholder="Par exemple : petite-fille de …, du côté de …"
          className="w-full resize-none rounded-[24px] border border-line bg-surface px-5 py-3.5 text-base leading-snug text-ink outline-none placeholder:text-ink-4 focus-visible:ring-2 focus-visible:ring-ink"
        />
        <button type="submit" disabled={pending} className={`${pillPrimary} mt-2`}>
          Envoyer ma demande
        </button>
        {state && !state.ok ? (
          <p role="alert" className="text-sm text-accent">
            {state.error}
          </p>
        ) : undefined}
      </form>
    </div>
  );
}
