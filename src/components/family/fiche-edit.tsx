// tdd-cover: e2e tests/e2e/fiche-edit.writes.spec.ts
'use client';

import {
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from 'react';
import { editPersonAction } from '@/actions/family.actions';

// Modification sur place (retour de Folpe : « comme dans une app ») : on touche une
// ligne de la fiche, elle devient un champ ; Entrée ou quitter le champ enregistre,
// Échap abandonne, et « Annuler » revient en arrière quelques secondes. La policy et
// les invariants sont revérifiés au serveur ; l'écran ne fait que proposer.

const UNDO_MS = 6000;

type Values = Record<string, string>;

/** Envoie un champ ; rend le message d'erreur, ou rien si c'est enregistré. */
async function save(personId: string, field: string, values: Values) {
  const data = new FormData();
  data.set('personId', personId);
  data.set('field', field);
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  const result = await editPersonAction(data);
  return result.ok ? undefined : result.error;
}

/** Enregistrer, annuler, et le petit état de chaque ligne modifiable. */
function useEditing(personId: string, field: string, initial: Values) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [undo, setUndo] = useState<Values>();
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(undefined), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undo]);
  const submit = (values: Values) =>
    start(async () => {
      const unchanged = Object.keys({ ...initial, ...values }).every(
        (k) => (values[k] ?? '') === (initial[k] ?? ''),
      );
      if (unchanged) return setEditing(false);
      const failure = await save(personId, field, values);
      if (failure) return setError(failure);
      setError(undefined);
      setEditing(false);
      setUndo(initial);
    });
  const revert = () =>
    start(async () => {
      if (!undo) return;
      const failure = await save(personId, field, undo);
      setUndo(undefined);
      if (failure) setError(failure);
    });
  return { editing, setEditing, error, setError, undo, pending, submit, revert };
}

const input =
  'h-11 w-full min-w-0 rounded-[var(--radius-field)] border border-line bg-surface px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-2 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60';

/** Formulaire en ligne : Entrée enregistre, Échap abandonne, quitter le champ enregistre. */
function InlineForm({
  onSave,
  onCancel,
  children,
  className = '',
}: {
  onSave: (values: Values) => void;
  onCancel: () => void;
  children: ReactNode;
  className?: string;
}) {
  const values = (form: HTMLFormElement): Values => {
    const out: Values = {};
    for (const element of form.elements) {
      if (element instanceof HTMLInputElement && element.name) {
        out[element.name] =
          element.type === 'checkbox' ? (element.checked ? 'on' : '') : element.value;
      } else if (element instanceof HTMLSelectElement && element.name) {
        out[element.name] = element.value;
      }
    }
    return out;
  };
  // La ligne touchée devient ce formulaire : le focus va à son premier champ.
  const form = useRef<HTMLFormElement>(null); // allow-null: contrat des refs de React
  useEffect(() => {
    const first = form.current?.querySelector('input:not([type="checkbox"]), select');
    if (first instanceof HTMLElement) first.focus();
  }, []);
  return (
    <form
      ref={form}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave(values(event.currentTarget));
      }}
      onKeyDown={(event: KeyboardEvent<HTMLFormElement>) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      }}
      onBlur={(event: FocusEvent<HTMLFormElement>) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        onSave(values(event.currentTarget));
      }}
      className={className}
    >
      {children}
      <button type="submit" hidden>
        Enregistrer
      </button>
    </form>
  );
}

/** Sous la ligne : l'erreur, ou « Enregistré » avec la possibilité d'annuler. */
function Feedback({
  error,
  undo,
  pending,
  onUndo,
}: {
  error: string | undefined;
  undo: Values | undefined;
  pending: boolean;
  onUndo: () => void;
}) {
  if (error) {
    return (
      <p role="alert" className="pb-3 text-right text-[13px] text-accent">
        {error}
      </p>
    );
  }
  if (!undo) return undefined;
  return (
    <p role="status" className="flex justify-end gap-3 pb-3 text-[13px] text-ink-2">
      Enregistré
      <button
        type="button"
        onClick={onUndo}
        disabled={pending}
        aria-label="Annuler la modification"
        className="min-h-6 font-medium text-ink underline underline-offset-4"
      >
        Annuler
      </button>
    </p>
  );
}

type FieldKind =
  | { kind: 'text'; value: string | undefined; placeholder?: string }
  | { kind: 'gender'; value: string }
  | {
      kind: 'event';
      /** Décès : la case « décédé » vient avec. */
      death: boolean;
      deceased: boolean;
      date: string | undefined;
      place: string | undefined;
    };

const GENDERS: [string, string][] = [
  ['femme', 'Femme'],
  ['homme', 'Homme'],
  ['autre', 'Autre'],
  ['inconnu', 'Je ne sais pas'],
];

function initialValues(spec: FieldKind): Values {
  if (spec.kind === 'event') {
    return {
      ...(spec.death ? { deceased: spec.deceased ? 'on' : '' } : {}),
      date: spec.date ?? '',
      place: spec.place ?? '',
    };
  }
  return { value: spec.value ?? '' };
}

function Fields({ spec, label, id }: { spec: FieldKind; label: string; id: string }) {
  if (spec.kind === 'text') {
    return (
      <input
        name="value"
        aria-label={label}
        defaultValue={spec.value ?? ''}
        placeholder={spec.placeholder}
        maxLength={120}
        autoComplete="off"
        className={input}
      />
    );
  }
  if (spec.kind === 'gender') {
    return (
      <select name="value" aria-label={label} defaultValue={spec.value} className={input}>
        {GENDERS.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    );
  }
  const of = spec.death ? 'du décès' : 'de naissance';
  return (
    <div className="flex w-full flex-col gap-2">
      {spec.death ? (
        <label htmlFor={`${id}-dead`} className="flex min-h-11 items-center gap-3 text-[15px]">
          <input
            id={`${id}-dead`}
            type="checkbox"
            name="deceased"
            defaultChecked={spec.deceased}
            className="size-5 accent-ink"
          />
          Décédé ou décédée
        </label>
      ) : undefined}
      <input
        name="date"
        aria-label={`Date ${of}`}
        defaultValue={spec.date ?? ''}
        placeholder="1952, mars 1952, vers 1850"
        maxLength={40}
        autoComplete="off"
        className={input}
      />
      <input
        name="place"
        aria-label={`Lieu ${of}`}
        defaultValue={spec.place ?? ''}
        placeholder="Ville"
        maxLength={120}
        autoComplete="off"
        className={input}
      />
    </div>
  );
}

/**
 * Ligne de fiche modifiable : au repos, un bouton qui montre la valeur ; touchée, le
 * ou les champs, à la même place.
 */
export function EditableRow({
  personId,
  field,
  label,
  display,
  spec,
}: {
  personId: string;
  field: string;
  label: string;
  /** Ce que la ligne montre au repos ; absent : « À compléter ». */
  display: string | undefined;
  spec: FieldKind;
}) {
  const id = useId();
  const initial = initialValues(spec);
  const e = useEditing(personId, field, initial);
  return (
    <div className="border-t border-rule">
      {e.editing ? (
        <InlineForm
          onSave={e.submit}
          onCancel={() => {
            e.setError(undefined);
            e.setEditing(false);
          }}
          className="flex flex-col gap-2 py-3"
        >
          <span className="text-sm text-ink-2">{label}</span>
          <fieldset disabled={e.pending} className="contents">
            <Fields spec={spec} label={label} id={id} />
          </fieldset>
        </InlineForm>
      ) : (
        <button
          type="button"
          onClick={() => e.setEditing(true)}
          aria-label={`${label} : ${display ?? 'à compléter'}, modifier`}
          className="group flex w-full items-baseline justify-between gap-4 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <span className="shrink-0 text-sm text-ink-2">{label}</span>
          <span
            className={`min-w-0 text-right text-[15px] [overflow-wrap:anywhere] decoration-line underline-offset-4 group-hover:underline ${display ? 'text-ink' : 'text-ink-2'}`}
          >
            {display ?? 'À compléter'}
          </span>
        </button>
      )}
      <Feedback error={e.error} undo={e.undo} pending={e.pending} onUndo={e.revert} />
    </div>
  );
}

/** Le nom, dans le titre de la fiche : touché, prénom et nom deviennent des champs. */
export function EditableName({
  personId,
  firstName,
  lastName,
  heading,
  className,
  children,
}: {
  personId: string;
  firstName: string;
  lastName: string;
  heading: 'h1' | 'h2';
  className: string;
  /** Le nom affiché dans le titre. */
  children: ReactNode;
}) {
  const Heading = heading;
  const hintId = useId();
  const first = useEditing(personId, 'firstName', { value: firstName });
  const last = useEditing(personId, 'lastName', { value: lastName });
  const [editing, setEditing] = useState(false);
  const saveBoth = (values: Values) => {
    // Deux champs, deux écritures : chacune passe la policy et peut s'annuler.
    if ((values['firstName'] ?? '') !== firstName)
      first.submit({ value: values['firstName'] ?? '' });
    if ((values['lastName'] ?? '') !== lastName) last.submit({ value: values['lastName'] ?? '' });
    setEditing(false);
  };
  const error = first.error ?? last.error;
  return (
    <div className="flex w-full flex-col items-center">
      {editing ? (
        <InlineForm
          onSave={saveBoth}
          onCancel={() => setEditing(false)}
          className="mt-3 grid w-full max-w-sm grid-cols-2 gap-2"
        >
          <input
            name="firstName"
            aria-label="Prénom"
            defaultValue={firstName}
            maxLength={80}
            autoComplete="off"
            className={input}
          />
          <input
            name="lastName"
            aria-label="Nom"
            defaultValue={lastName}
            maxLength={80}
            autoComplete="off"
            className={input}
          />
        </InlineForm>
      ) : (
        <Heading className={className}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            // Le titre garde le nom pour nom accessible ; le geste est décrit à part.
            aria-describedby={hintId}
            className="rounded-2xl decoration-line underline-offset-8 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            {children}
          </button>
          <span id={hintId} hidden>
            Touche pour modifier le prénom et le nom
          </span>
        </Heading>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-accent">
          {error}
        </p>
      ) : first.undo || last.undo ? (
        <p role="status" className="mt-2 flex gap-3 text-[13px] text-ink-2">
          Enregistré
          <button
            type="button"
            aria-label="Annuler la modification"
            onClick={() => {
              first.revert();
              last.revert();
            }}
            className="font-medium text-ink underline underline-offset-4"
          >
            Annuler
          </button>
        </p>
      ) : undefined}
    </div>
  );
}
