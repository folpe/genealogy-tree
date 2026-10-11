'use client';

import { useActionState } from 'react';
import type { ActionResult } from '@/actions/members.actions';

// Formulaires des écrans Membres, Admin et demande d'accès. Fonctionnels et sobres :
// la mise en forme des maquettes Membres arrive en phase 6.

type Action = (state: ActionResult | undefined, data: FormData) => Promise<ActionResult>;

const fieldClass =
  'h-[50px] w-full rounded-[var(--radius-field)] border border-line bg-surface px-4 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ink';
const primary =
  'h-[50px] rounded-full bg-ink px-6 text-[15px] font-semibold text-on-ink disabled:opacity-60';
const secondary =
  'h-11 rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink disabled:opacity-60';
const labelClass = 'text-sm font-medium text-ink-2';

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

export function RequestAccessForm({ action }: { action: Action }) {
  const [state, submit, pending] = useActionState(action, undefined);
  if (state?.ok) {
    return (
      <div className="mt-6">
        <h2 className="font-display text-2xl">Merci, on te répond vite</h2>
        <p className="mt-3 text-[15px] text-ink-2">
          Dès qu’un administrateur valide ta demande, tu reçois un lien de connexion par email. En
          général, sous 48 heures.
        </p>
      </div>
    );
  }
  return (
    <form action={submit} className="mt-6 flex flex-col gap-3">
      <label htmlFor="name" className={labelClass}>
        Prénom et nom
      </label>
      <input id="name" name="name" required autoComplete="name" className={fieldClass} />
      <label htmlFor="email" className={labelClass}>
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className={fieldClass}
      />
      <label htmlFor="relation" className={labelClass}>
        Qui es-tu dans la famille ?
      </label>
      <textarea
        id="relation"
        name="relation"
        required
        rows={3}
        className="w-full rounded-[var(--radius-field)] border border-line bg-surface p-4 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ink"
      />
      <button type="submit" disabled={pending} className={primary}>
        Envoyer ma demande
      </button>
      <Feedback state={state} />
    </form>
  );
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
