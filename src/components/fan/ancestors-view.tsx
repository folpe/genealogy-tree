// tdd-cover: e2e tests/e2e/fan.spec.ts
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { type FanParams, fanHref } from '@/lib/fan/fan.params';
import { treeHref } from '@/lib/tree/tree.params';
import { lifeYears, personLabel } from '../family/person.helper';
import { FAN_GENERATIONS, type Fan, type FanSlot } from './fan.helper';
import { generationLabel, slotAwaits, slotKey, slotTitle } from './fan.labels';
import { FanChart } from './fan-chart';

// L'écran Ancêtres (maquette 03) : l'éventail et, à côté (dessous sur mobile), la case
// choisie puis « Tes racines ». La case choisie vit dans l'état local : la personne
// au centre et la profondeur, elles, sont dans l'URL.

const action =
  'flex h-12 flex-auto items-center whitespace-nowrap justify-center rounded-full px-4 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
const primary = `${action} bg-ink text-on-ink`;
const secondary = `${action} border border-line bg-card text-ink`;

export function AncestorsView({
  fan,
  params,
  rootName,
}: {
  fan: Fan;
  params: FanParams;
  /** Prénom de la personne au centre ; absent quand c'est le lecteur. */
  rootName: string | undefined;
}) {
  const first = fan.generations[0]?.[0];
  const [selected, setSelected] = useState<FanSlot | undefined>(first);
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <section
        aria-label="Éventail"
        className="canvas-grid relative min-w-0 lg:flex-[999_1_560px] overflow-hidden rounded-[var(--radius-panel)] border border-line px-4 pt-4 md:px-6"
      >
        <FanChart
          fan={fan}
          rootName={rootName}
          selected={selected ? slotKey(selected) : undefined}
          onSelect={setSelected}
        />
        <GenerationsControl params={params} />
      </section>
      <aside
        aria-label="Ancêtre choisi"
        className="flex flex-col lg:flex-[1_1_340px] rounded-[var(--radius-panel)] bg-card shadow-float lg:max-w-[420px]"
      >
        {selected ? <SlotDetails slot={selected} params={params} rootName={rootName} /> : undefined}
        <Roots fan={fan} rootName={rootName} />
      </aside>
    </div>
  );
}

function GenerationsControl({ params }: { params: FanParams }) {
  const button =
    'flex size-[46px] items-center justify-center rounded-full border border-line bg-surface text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-disabled:pointer-events-none aria-disabled:opacity-40';
  const step = (delta: number, label: string, path: string) => {
    const generations = params.generations + delta;
    const disabled = generations < FAN_GENERATIONS.min || generations > FAN_GENERATIONS.max;
    return (
      <Link
        href={fanHref({ ...params, generations })}
        aria-label={label}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        className={button}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Link>
    );
  };
  return (
    <div className="absolute right-4 bottom-4 flex gap-2">
      {step(-1, 'Une génération de moins', 'M5 12h14')}
      {step(1, 'Une génération de plus', 'M12 5v14M5 12h14')}
    </div>
  );
}

function SlotDetails({
  slot,
  params,
  rootName,
}: {
  slot: FanSlot;
  params: FanParams;
  rootName: string | undefined;
}) {
  const { person, child } = slot;
  const pills = [
    slot.side === 'paternal' ? 'Branche paternelle' : 'Branche maternelle',
    generationLabel(slot.generation),
  ];
  return (
    <div className="flex flex-col gap-2 px-6 pt-7 pb-5 md:px-7">
      <span className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
        {person ? slotTitle(slot, rootName) : 'À découvrir'}
      </span>
      <h2 className="font-display text-[30px] leading-tight">
        {person ? personLabel(person) : slotTitle(slot, rootName)}
      </h2>
      {person ? (
        <PersonLine slot={slot} />
      ) : (
        <p className="text-[15px] leading-normal text-ink-2">
          {capitalize(slotAwaits(slot))} : personne ne l’a encore renseigné. Un nom, une date ou une
          photo du livret de famille suffisent pour commencer.
        </p>
      )}
      <div className="mt-1 flex flex-wrap gap-1.5">
        {pills.map((pill) => (
          <span
            key={pill}
            className="flex h-[30px] items-center rounded-full bg-paper px-3 text-[13px]"
          >
            {pill}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {person ? (
          <>
            <Link href={`/people/${person.id}`} className={primary}>
              Voir la fiche
            </Link>
            <Link href={fanHref({ ...params, p: person.id })} className={secondary}>
              Ses ancêtres
            </Link>
            <Link
              href={treeHref({ view: 'hourglass', p: person.id, past: false })}
              className={secondary}
            >
              Dans l’arbre
            </Link>
          </>
        ) : child ? (
          <Link href={`/people/${child.id}`} className={primary}>
            Ouvrir la fiche de {child.firstName}
          </Link>
        ) : undefined}
      </div>
    </div>
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function PersonLine({ slot }: { slot: FanSlot }) {
  const { person } = slot;
  if (!person) return undefined;
  const feminine = person.gender === 'femme';
  const birthName =
    person.level !== 'minor' && person.birthName && person.birthName !== person.lastName
      ? `${feminine ? 'née' : 'né'} ${person.birthName}`
      : undefined;
  const place =
    person.level === 'full' || person.level === 'family' ? person.birth?.place : undefined;
  const line = [lifeYears(person), place ? `${feminine ? 'née' : 'né'} à ${place}` : undefined]
    .filter(Boolean)
    .join(', ');
  return (
    <>
      {birthName ? <span className="text-sm text-ink-2">{birthName}</span> : undefined}
      {line ? <span className="text-[15px] text-ink-2">{line}</span> : undefined}
    </>
  );
}

function Roots({ fan, rootName }: { fan: Fan; rootName: string | undefined }) {
  const title = rootName ? 'Ses racines' : 'Tes racines';
  const percent = Math.round((fan.known / fan.total) * 100);
  const oldest = fan.oldest;
  const oldestBirth =
    oldest && (oldest.level === 'full' || oldest.level === 'family')
      ? oldest.birth?.date
      : undefined;
  const oldestYear = oldestBirth
    ? oldestBirth.precision === 'entre'
      ? oldestBirth.from
      : oldestBirth.year
    : undefined;
  return (
    <section aria-label={title} className="flex flex-col px-6 pb-7 md:px-7">
      <h3 className="border-t border-rule pt-4 pb-1 text-xs font-semibold tracking-[0.14em] text-ink-3 uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-2.5 py-3">
        <p className="flex items-baseline justify-between">
          <span>
            <span className="font-display text-[26px]">{fan.known}</span>{' '}
            <span className="text-sm text-ink-2">ancêtres connus sur {fan.total}</span>
          </span>
          <span className="text-[13px] text-ink-2 tabular-nums">{percent} %</span>
        </p>
        <span className="relative block h-1.5 overflow-hidden rounded-full bg-rule">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-ink"
            style={{ width: `${percent}%` }}
          />
        </span>
      </div>
      <p className="flex justify-between gap-4 border-t border-rule py-3.5">
        <span className="text-sm text-ink-2">Le plus ancien</span>
        <span className="text-right text-[15px]">
          {oldest && oldestYear
            ? `${oldest.firstName}, ${oldest.gender === 'femme' ? 'née' : 'né'} en ${oldestYear}`
            : 'Aucune date connue'}
        </span>
      </p>
      <div className="flex flex-col gap-2.5 border-t border-rule pt-3.5">
        <span className="text-sm text-ink-2">Terres d’origine</span>
        {fan.origins.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {fan.origins.map((origin) => (
              <li
                key={origin.place}
                className="flex h-[34px] items-center gap-2 rounded-full border border-line pr-1.5 pl-3.5 text-sm"
              >
                {origin.place}
                <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-paper px-1.5 text-xs text-ink-2">
                  {origin.count}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">Aucun lieu de naissance connu pour l’instant.</p>
        )}
      </div>
    </section>
  );
}
