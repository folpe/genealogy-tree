// tdd-cover: e2e tests/e2e/fiche-edit.writes.spec.ts
'use client';

import { type FormEvent, useId, useState } from 'react';
import {
  APPROX_PRECISIONS,
  dateFieldNames,
  dateFieldValues,
  readDateFields,
} from '@/server/family/date-fields.helper';
import type { FuzzyDate } from '@/server/family/family.types';
import { formatFuzzyDate, MONTHS } from '@/server/family/fuzzy-date.helper';

// Champ date (retour de Folpe : « un champ date, affiché en lettres, enregistré en
// date ») : le calendrier du téléphone pour une date exacte ; « Date approximative »
// le remplace par une précision et une ou deux années, pour les actes anciens. Sous
// le champ, la date telle qu'elle sera enregistrée, en lettres, ou ce qui ne va pas.

const PRECISION_LABELS: Record<(typeof APPROX_PRECISIONS)[number], string> = {
  annee: 'L’année seulement',
  mois: 'Le mois et l’année',
  vers: 'Vers',
  avant: 'Avant',
  apres: 'Après',
  entre: 'Entre deux années',
};

type Values = Record<string, string>;

/** Ce que le champ montre selon le mode ; les autres valeurs partent en champs cachés. */
function shownKeys(prefix: string, values: Values): string[] {
  const n = dateFieldNames(prefix);
  if (values[n.approx] !== 'on') return [n.exact, n.approx];
  const precision = values[n.precision];
  return [
    n.approx,
    n.precision,
    n.year,
    ...(precision === 'mois' ? [n.month] : []),
    ...(precision === 'entre' ? [n.yearEnd] : []),
  ];
}

/** Passer en approximatif garde l'année d'une date exacte déjà choisie. */
function toggled(prefix: string, values: Values, approx: boolean): Values {
  const n = dateFieldNames(prefix);
  const year = (values[n.exact] ?? '').slice(0, 4).replace(/^0+/, '');
  const keepYear = approx && values[n.year] === '' && year !== '';
  return { ...values, [n.approx]: approx ? 'on' : '', ...(keepYear ? { [n.year]: year } : {}) };
}

function Preview({ prefix, values }: { prefix: string; values: Values }) {
  const result = readDateFields(values, prefix);
  if (!result.ok) {
    return <p className="text-[13px] text-accent">{result.message}</p>;
  }
  if (!result.date) return undefined;
  return <p className="text-[13px] text-ink-2">{formatFuzzyDate(result.date)}</p>;
}

export function DateField({
  prefix,
  label,
  initial,
  inputClass,
  onInput,
}: {
  /** Préfixe des champs envoyés : `date`, `birth`, `death`. */
  prefix: string;
  /** Nom accessible du champ : « Date de naissance », « Naissance »... */
  label: string;
  initial: FuzzyDate | undefined;
  inputClass: string;
  /** Une saisie (décès : coche « décédé »). */
  onInput?: (event: FormEvent<HTMLElement>) => void;
}) {
  const id = useId();
  const n = dateFieldNames(prefix);
  const [values, setValues] = useState<Values>(() => dateFieldValues(prefix, initial));
  const set = (key: string) => (event: FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    setValues((v) => ({ ...v, [key]: value }));
    onInput?.(event);
  };
  const approx = values[n.approx] === 'on';
  const shown = shownKeys(prefix, values);
  const hidden = Object.entries(values).filter(([key]) => !shown.includes(key));
  return (
    <div className="flex flex-col gap-2">
      {approx ? (
        <div className="flex flex-wrap gap-2">
          <select
            name={n.precision}
            aria-label={`${label} : précision`}
            value={values[n.precision]}
            onChange={set(n.precision)}
            className={`${inputClass} flex-[1_1_100%]`}
          >
            {APPROX_PRECISIONS.map((p) => (
              <option key={p} value={p}>
                {PRECISION_LABELS[p]}
              </option>
            ))}
          </select>
          {values[n.precision] === 'mois' ? (
            <select
              name={n.month}
              aria-label={`${label} : mois`}
              value={values[n.month]}
              onChange={set(n.month)}
              className={`${inputClass} flex-1`}
            >
              <option value="">Mois</option>
              {MONTHS.map((month, i) => (
                <option key={month} value={String(i + 1)}>
                  {month}
                </option>
              ))}
            </select>
          ) : undefined}
          <YearInput
            name={n.year}
            label={values[n.precision] === 'entre' ? `${label} : de` : `${label} : année`}
            value={values[n.year] ?? ''}
            onInput={set(n.year)}
            className={inputClass}
          />
          {values[n.precision] === 'entre' ? (
            <YearInput
              name={n.yearEnd}
              label={`${label} : à`}
              value={values[n.yearEnd] ?? ''}
              onInput={set(n.yearEnd)}
              className={inputClass}
            />
          ) : undefined}
        </div>
      ) : (
        <input
          type="date"
          name={n.exact}
          aria-label={label}
          value={values[n.exact]}
          onChange={set(n.exact)}
          className={`${inputClass} text-left [&::-webkit-date-and-time-value]:text-left`}
        />
      )}
      <label htmlFor={`${id}-approx`} className="flex min-h-11 items-center gap-3 text-[15px]">
        <input
          id={`${id}-approx`}
          type="checkbox"
          name={n.approx}
          checked={approx}
          onChange={(event) => setValues((v) => toggled(prefix, v, event.target.checked))}
          className="size-5 accent-ink"
        />
        Date approximative
      </label>
      {hidden.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <div aria-live="polite">
        <Preview prefix={prefix} values={values} />
      </div>
    </div>
  );
}

function YearInput({
  name,
  label,
  value,
  onInput,
  className,
}: {
  name: string;
  label: string;
  value: string;
  onInput: (event: FormEvent<HTMLInputElement>) => void;
  className: string;
}) {
  return (
    <input
      name={name}
      aria-label={label}
      inputMode="numeric"
      autoComplete="off"
      maxLength={4}
      placeholder="Année"
      value={value}
      onChange={onInput}
      className={`${className} flex-1`}
    />
  );
}
