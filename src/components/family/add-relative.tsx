// tdd-cover: e2e tests/e2e/add-relative.writes.spec.ts
'use client';

import Link from 'next/link';
import { Dialog } from 'radix-ui';
import { useActionState, useId, useState } from 'react';
import type { AddRelativeResult } from '@/actions/family.actions';
import type { Gender } from '@/server/family/family.types';
import type { AddIntent, RelationKind, RelativeOptions } from './add-relative.helper';
import { DateField } from './date-field';

// « + Parent », « + Enfant », « + Conjoint » sur une fiche de sa lignée (maquette
// Arbre, actions rapides ; version minimale de la phase 6). Le serveur revérifie
// la policy et les invariants : l'écran ne fait que proposer.

type Action = (state: AddRelativeResult | undefined, data: FormData) => Promise<AddRelativeResult>;
type Anchor = { id: string; firstName: string; lastName: string };

const TITLES: Record<RelationKind, string> = {
  parent: 'un parent',
  child: 'un enfant',
  partner: 'un conjoint',
};
const GENDERS: { value: Gender; label: string }[] = [
  { value: 'femme', label: 'Femme' },
  { value: 'homme', label: 'Homme' },
  { value: 'autre', label: 'Autre' },
  { value: 'inconnu', label: 'Je ne sais pas' },
];

const trigger =
  'flex h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

export function AddRelative({
  anchor,
  options,
  intent,
  action,
}: {
  anchor: Anchor;
  options: RelativeOptions;
  /** Ajout demandé par l'URL : le dialogue s'ouvre déjà réglé. */
  intent: AddIntent | undefined;
  action: Action;
}) {
  const initial =
    intent && (intent.relation !== 'parent' || !options.parentsFull) ? intent : undefined;
  const [open, setOpen] = useState<AddIntent | undefined>(initial);
  if (!options.canAdd) return undefined;
  const relations = (
    [
      ['parent', '+ Parent'],
      ['child', '+ Enfant'],
      ['partner', '+ Conjoint'],
    ] satisfies [RelationKind, string][]
  ).filter(([relation]) => relation !== 'parent' || !options.parentsFull);
  return (
    <section aria-label="Ajouter un proche" className="flex flex-wrap gap-2">
      {relations.map(([relation, label]) => (
        <button
          key={relation}
          type="button"
          className={trigger}
          onClick={() => setOpen({ relation })}
        >
          {label}
        </button>
      ))}
      <Dialog.Root open={open !== undefined} onOpenChange={(next) => !next && setOpen(undefined)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] max-w-lg overflow-y-auto rounded-t-[var(--radius-card)] bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-float focus-visible:outline-none md:inset-x-4 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:rounded-[var(--radius-card)]">
            {open ? (
              <RelativeForm
                // Un nouveau formulaire à chaque ouverture : rien ne reste d'un ajout précédent.
                key={`${open.relation}-${open.gender ?? ''}`}
                anchor={anchor}
                options={options}
                intent={open}
                action={action}
              />
            ) : undefined}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

const field =
  'h-[50px] w-full rounded-[var(--radius-field)] border border-line bg-surface px-4 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ink';
const labelClass = 'text-sm font-medium text-ink-2';

function RelativeForm({
  anchor,
  options,
  intent,
  action,
}: {
  anchor: Anchor;
  options: RelativeOptions;
  intent: AddIntent;
  action: Action;
}) {
  const [state, submit, pending] = useActionState(action, undefined);
  const [firstName, setFirstName] = useState('');
  const [deceased, setDeceased] = useState(false);
  const id = useId();
  const { relation } = intent;
  // Le nom de famille le plus probable : celui de la fiche, sauf pour une mère.
  const lastName = relation === 'partner' || intent.gender === 'femme' ? '' : anchor.lastName;

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <Dialog.Title className="font-display text-2xl">C’est ajouté</Dialog.Title>
        <Dialog.Description role="status" className="text-[15px] text-ink-2">
          {state.message}
        </Dialog.Description>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={`/people/${state.personId}`}
            className="flex h-[50px] flex-auto items-center justify-center rounded-full bg-ink px-6 text-[15px] font-semibold text-on-ink"
          >
            Ouvrir sa fiche
          </Link>
          <Dialog.Close className="h-[50px] flex-auto rounded-full border border-line px-6 text-[15px] font-semibold">
            Fermer
          </Dialog.Close>
        </div>
      </div>
    );
  }
  return (
    <form action={submit} className="flex flex-col gap-3">
      <Dialog.Title className="font-display text-2xl">
        Ajouter {TITLES[relation]} à {anchor.firstName}
      </Dialog.Title>
      <Dialog.Description className="text-[15px] text-ink-2">
        Le nom suffit pour commencer ; le reste se complète plus tard.
      </Dialog.Description>
      <input type="hidden" name="anchorId" value={anchor.id} />
      <input type="hidden" name="relation" value={relation} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Text
          id={`${id}-first`}
          name="firstName"
          label="Prénom"
          required
          value={firstName}
          onChange={setFirstName}
        />
        <Text id={`${id}-last`} name="lastName" label="Nom" required defaultValue={lastName} />
      </div>
      <Text id={`${id}-birthname`} name="birthName" label="Nom de naissance, s’il diffère" />
      <GenderChoice defaultGender={intent.gender} />
      <fieldset className="flex flex-col gap-1.5">
        <legend className={`${labelClass} mb-1.5`}>Naissance</legend>
        <DateField prefix="birth" label="Naissance" initial={undefined} inputClass={field} />
      </fieldset>
      <Text id={`${id}-place`} name="birthPlace" label="Lieu de naissance" />
      <label className="flex min-h-11 items-center gap-3 text-[15px]">
        <input
          type="checkbox"
          name="deceased"
          checked={deceased}
          onChange={(e) => setDeceased(e.target.checked)}
          className="size-5 accent-ink"
        />
        Décédé ou décédée
      </label>
      {deceased ? (
        <fieldset className="flex flex-col gap-1.5">
          <legend className={`${labelClass} mb-1.5`}>Décès</legend>
          <DateField prefix="death" label="Décès" initial={undefined} inputClass={field} />
        </fieldset>
      ) : undefined}
      <OtherParent relation={relation} options={options} />
      {state && !state.ok ? (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      ) : undefined}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-[50px] rounded-full bg-ink px-6 text-[15px] font-semibold text-on-ink disabled:opacity-60"
      >
        {pending ? 'Ajout en cours…' : `Ajouter ${firstName.trim()}`.trim()}
      </button>
    </form>
  );
}

function Text({
  id,
  name,
  label,
  required,
  defaultValue,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        maxLength={name === 'birthPlace' ? 120 : 80}
        autoComplete="off"
        className={field}
        {...(onChange
          ? {
              value,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
            }
          : { defaultValue })}
      />
    </div>
  );
}

function GenderChoice({ defaultGender }: { defaultGender: Gender | undefined }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={`${labelClass} mb-1.5`}>Genre</legend>
      <div className="flex flex-wrap gap-2">
        {GENDERS.map(({ value, label }) => (
          <label
            key={value}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line px-4 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-on-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
          >
            <input
              type="radio"
              name="gender"
              value={value}
              defaultChecked={value === (defaultGender ?? 'inconnu')}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function OtherParent({ relation, options }: { relation: RelationKind; options: RelativeOptions }) {
  const id = useId();
  if (relation === 'parent' && options.singleParent) {
    return (
      <label className="flex min-h-11 items-center gap-3 text-[15px]">
        <input
          type="checkbox"
          name="otherParentId"
          value={options.singleParent.id}
          defaultChecked
          className="size-5 accent-ink"
        />
        En couple avec {options.singleParent.label}
      </label>
    );
  }
  if (relation !== 'child' || options.partners.length === 0) return undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        Autre parent
      </label>
      <select id={id} name="otherParentId" defaultValue={options.partners[0]?.id} className={field}>
        {options.partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
        <option value="">Inconnu ou pas encore dans l’arbre</option>
      </select>
    </div>
  );
}
