'use client';

import { useActionState } from 'react';
import type { ActionResult } from '@/actions/members.actions';

// Formulaires des écrans Membres et Admin. Fonctionnels et sobres :
// la mise en forme des maquettes Membres arrive en phase 6.

type Action = (state: ActionResult | undefined, data: FormData) => Promise<ActionResult>;

const fieldClass =
  'h-[50px] w-full rounded-[var(--radius-field)] border border-line bg-surface px-4 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ink';
const primary =
  'h-[50px] rounded-full bg-ink px-6 text-[15px] font-semibold text-on-ink disabled:opacity-60';
const secondary =
  'h-11 rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink disabled:opacity-60';
const labelClass = 'text-sm font-medium text-ink-2';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

const longDate = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
});

function Feedback({ state }: { state: ActionResult | undefined }) {
  if (!state) return undefined;
  if (!state.ok) {
    return (
      <p role="alert" className="text-sm text-accent">
        {state.error}
      </p>
    );
  }
  return state.message ? (
    <p role="status" className="text-sm text-ink-2">
      {state.message}
    </p>
  ) : undefined;
}

export function InviteForm({
  action,
  invitable,
}: {
  action: Action;
  invitable: { personId: string; label: string }[];
}) {
  const [state, submit, pending] = useActionState(action, undefined);
  if (invitable.length === 0) {
    return (
      <p className="text-[15px] text-ink-2">
        Tout ton cercle proche a déjà un compte. Pour quelqu’un d’autre, demande à un proche de
        cette personne ou à un administrateur.
      </p>
    );
  }
  return (
    <form action={submit} className="flex flex-col gap-3">
      <label htmlFor="personId" className={labelClass}>
        Qui inviter ?
      </label>
      <select id="personId" name="personId" required className={fieldClass} defaultValue="">
        <option value="" disabled>
          Choisis une fiche
        </option>
        {invitable.map((p) => (
          <option key={p.personId} value={p.personId}>
            {p.label}
          </option>
        ))}
      </select>
      <label htmlFor="invite-email" className={labelClass}>
        Son email
      </label>
      <input id="invite-email" name="email" type="email" required className={fieldClass} />
      <button type="submit" disabled={pending} className={primary}>
        Envoyer l’invitation
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function AdminToggle({
  action,
  membershipId,
  isAdmin,
  label,
}: {
  action: Action;
  membershipId: string;
  isAdmin: boolean;
  label: string;
}) {
  const [state, submit, pending] = useActionState(action, undefined);
  return (
    <form action={submit} className="flex flex-col items-end gap-1">
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="makeAdmin" value={String(!isAdmin)} />
      <button type="submit" disabled={pending} className={secondary}>
        {isAdmin ? `Retirer le rôle d’admin de ${label}` : `Nommer ${label} admin`}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function AccessRequestCard({
  action,
  request,
  persons,
}: {
  action: Action;
  request: { id: string; name: string; email: string; relation: string };
  persons: { personId: string; label: string }[];
}) {
  const [state, submit, pending] = useActionState(action, undefined);
  const selectId = `person-${request.id}`;
  return (
    <form
      action={submit}
      className="flex flex-col gap-3 rounded-[var(--radius-panel)] border border-line bg-card p-5"
    >
      <input type="hidden" name="requestId" value={request.id} />
      <p className="font-display text-xl">{request.name}</p>
      <p className="text-sm text-ink-2">{request.email}</p>
      <p className="text-[15px]">{request.relation}</p>
      <label htmlFor={selectId} className={labelClass}>
        Sa fiche
      </label>
      <select id={selectId} name="personId" className={fieldClass} defaultValue="">
        <option value="" disabled>
          Choisis la fiche à relier
        </option>
        {persons.map((p) => (
          <option key={p.personId} value={p.personId}>
            {p.label}
          </option>
        ))}
      </select>
      <div className="flex gap-3">
        <button type="submit" name="decision" value="accept" disabled={pending} className={primary}>
          Accepter
        </button>
        <button
          type="submit"
          name="decision"
          value="refuse"
          disabled={pending}
          className={secondary}
        >
          Refuser
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

/** « C'est moi » : relie le compte d'un admin sans fiche à celle qu'il regarde. */
export function ClaimPersonForm({
  action,
  personId,
  label,
}: {
  action: Action;
  personId: string;
  label: string;
}) {
  const [state, submit, pending] = useActionState(action, undefined);
  return (
    <form action={submit} className="flex flex-col items-start gap-2">
      <input type="hidden" name="personId" value={personId} />
      <p className="text-sm text-ink-2">
        Ton compte n’est relié à aucune fiche. Si {label}, c’est toi, relie-la : l’arbre partira de
        toi.
      </p>
      <button type="submit" disabled={pending || state?.ok === true} className={secondary}>
        C’est moi
      </button>
      <Feedback state={state} />
    </form>
  );
}

/** Invitation en attente (page Membres, admin) : la renvoyer avec un nouveau lien, ou l'annuler. */
export function PendingInvitation({
  action,
  invitation,
}: {
  action: Action;
  invitation: {
    id: string;
    label: string;
    email: string;
    sentAt: Date;
    expiresAt: Date;
    expired: boolean;
  };
}) {
  const [state, submit, pending] = useActionState(action, undefined);
  const deadline = `${invitation.expired ? 'expirée' : 'expire'} le ${longDate.format(invitation.expiresAt)}`;
  return (
    <form action={submit} className="flex flex-col gap-3 p-4">
      <input type="hidden" name="invitationId" value={invitation.id} />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-display text-xl">{invitation.label}</p>
        <p className="break-all text-[15px]">{invitation.email}</p>
        <p className={`text-sm ${invitation.expired ? 'text-accent' : 'text-ink-2'}`}>
          Envoyée le {longDate.format(invitation.sentAt)}, {deadline}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="intent"
          value="resend"
          disabled={pending}
          aria-label={`Renvoyer l’invitation de ${invitation.label}`}
          className={`${secondary} ${focusRing}`}
        >
          Renvoyer
        </button>
        <button
          type="submit"
          name="intent"
          value="cancel"
          disabled={pending}
          aria-label={`Annuler l’invitation de ${invitation.label}`}
          className={`${secondary} ${focusRing}`}
        >
          Annuler
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}
