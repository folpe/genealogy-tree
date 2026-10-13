// tdd-cover: e2e tests/e2e/fan.spec.ts
'use client';

import { type KeyboardEvent, useLayoutEffect, useRef } from 'react';
import { animateFanEntry } from '@/motion/fan';
import { isDeceased, lifeYears, personInitials } from '../family/person.helper';
import { type FanLayout, fanLayout, sectorLabel, sectorPath } from './fan.geometry';
import type { Fan, FanSlot } from './fan.helper';
import { slotKey, slotName } from './fan.labels';

// Le demi-cercle des ancêtres (maquette 03). Chaque case connue, et chaque case vide
// dont l'enfant est connu, se choisit au doigt, à la souris ou au clavier ; le panneau
// voisin dit qui c'est. Les cases au-delà d'un inconnu restent en filigrane.

export function FanChart({
  fan,
  rootName,
  selected,
  onSelect,
}: {
  fan: Fan;
  /** Prénom de la personne au centre ; absent quand c'est le lecteur (« Toi »). */
  rootName: string | undefined;
  selected: string | undefined;
  onSelect: (slot: FanSlot) => void;
}) {
  const layout = fanLayout(fan.generations.length);
  const scroller = useRef<HTMLDivElement>(null); // allow-null: contrat des refs de React

  // Sur un écran étroit l'éventail déborde : on part du centre, les deux côtés à portée.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);
  useLayoutEffect(
    () =>
      animateFanEntry(
        [...(scroller.current?.querySelectorAll('[data-ring]') ?? [])].filter(
          (ring): ring is SVGGElement => ring instanceof SVGGElement,
        ),
        `${layout.cx} ${layout.cy}`,
      ),
    [layout.cx, layout.cy],
  );

  const viewBox = `0 0 ${layout.width} ${layout.height}`;
  const origin = `translate(${layout.cx} ${layout.cy})`;

  // Deux calques, comme la maquette : les secteurs, qui se choisissent, puis les textes
  // et le centre, purement visuels (le nom de chaque secteur les dit déjà).
  return (
    <div ref={scroller} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="relative mx-auto w-full max-w-[1100px]" style={{ minWidth: layout.minWidth }}>
        <svg viewBox={viewBox} className="block w-full">
          <title>{`Éventail des ancêtres, ${fan.generations.length} générations`}</title>
          <g transform={origin}>
            {fan.generations.map((ring) => (
              <g key={ring[0]?.generation} data-ring="">
                {ring.map((slot) => (
                  <Sector
                    key={slotKey(slot)}
                    layout={layout}
                    slot={slot}
                    rootName={rootName}
                    selected={selected === slotKey(slot)}
                    onSelect={onSelect}
                  />
                ))}
              </g>
            ))}
          </g>
        </svg>
        <svg
          viewBox={viewBox}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 block w-full select-none"
        >
          <g transform={origin}>
            {fan.generations.map((ring) => (
              <g key={ring[0]?.generation} data-ring="">
                {ring.map((slot) => (
                  <SectorText
                    key={slotKey(slot)}
                    layout={layout}
                    slot={slot}
                    selected={selected === slotKey(slot)}
                  />
                ))}
              </g>
            ))}
            <Center layout={layout} fan={fan} label={rootName ?? 'Toi'} />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Sector({
  layout,
  slot,
  rootName,
  selected,
  onSelect,
}: {
  layout: FanLayout;
  slot: FanSlot;
  rootName: string | undefined;
  selected: boolean;
  onSelect: (slot: FanSlot) => void;
}) {
  const { generation, index, person, child } = slot;
  const pickable = person !== undefined || child !== undefined;
  const tone = selected
    ? 'fill-accent-soft stroke-accent [stroke-width:2.5]'
    : person
      ? `${isDeceased(person) ? 'fill-bubble-past' : 'fill-bubble'} stroke-canvas stroke-[1.5]`
      : 'fill-surface stroke-ink-4 stroke-[1.5] [stroke-dasharray:4_5]';
  const state = pickable
    ? 'cursor-pointer hover:stroke-accent focus-visible:stroke-ink focus-visible:[stroke-dasharray:none] focus-visible:[stroke-width:3.5]'
    : 'pointer-events-none opacity-40';
  const pick = () => onSelect(slot);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    pick();
  };
  return pickable ? (
    // biome-ignore lint/a11y/useSemanticElements: un secteur d'éventail n'a pas d'équivalent HTML.
    <path
      d={sectorPath(layout, generation, index)}
      data-slot={slotKey(slot)}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={slotName(slot, rootName)}
      onClick={pick}
      onKeyDown={onKeyDown}
      className={`${tone} ${state} outline-none transition-colors`}
    />
  ) : (
    <path d={sectorPath(layout, generation, index)} className={`${tone} ${state}`} />
  );
}

/** Coupe un texte trop long pour sa case ; la largeur d'un caractère est estimée. */
function clip(text: string, room: number, size: number): string {
  const chars = Math.max(1, Math.floor(room / (size * 0.56)));
  return text.length <= chars ? text : `${text.slice(0, Math.max(1, chars - 1))}…`;
}

/** Taille du prénom, de la 1re à la 6e génération. */
const NAME_SIZE = [19, 16, 14, 12, 11, 10];

function SectorText({
  layout,
  slot,
  selected,
}: {
  layout: FanLayout;
  slot: FanSlot;
  selected: boolean;
}) {
  const { generation, index, person, child } = slot;
  if (!person && !child) return undefined;
  const label = sectorLabel(layout, generation, index);
  const size = NAME_SIZE[generation - 1] ?? 10;
  const small = Math.max(9, size - 4);
  const years = person && generation <= 4 ? lifeYears(person) : undefined;
  const color = selected ? 'fill-accent-strong' : person ? 'fill-ink' : 'fill-ink-2';
  const name = person
    ? clip(person.firstName, label.room, size)
    : generation <= 3
      ? clip('À découvrir', label.room, 12)
      : '+';
  // Nom et années de part et d'autre du milieu de la case.
  const gap = label.radial ? size * 0.55 : size * 0.7;
  return (
    <g transform={`rotate(${label.rotate} ${label.x} ${label.y})`}>
      <text
        x={label.x}
        y={label.y + (years ? -gap / 2 : size * 0.35)}
        textAnchor="middle"
        fontSize={person ? size : Math.min(size, 12)}
        className={`${person ? 'font-display' : ''} ${color}`}
      >
        {name}
      </text>
      {years ? (
        <text
          x={label.x}
          y={label.y + gap / 2 + size * 0.75}
          textAnchor="middle"
          fontSize={small}
          className="fill-ink tabular-nums opacity-80"
        >
          {clip(years, label.room, small)}
        </text>
      ) : undefined}
    </g>
  );
}

function Center({ layout, fan, label }: { layout: FanLayout; fan: Fan; label: string }) {
  return (
    <g>
      <circle r={layout.centerRadius + 3} className="fill-none stroke-line" />
      <circle r={layout.centerRadius} className="fill-bubble stroke-card [stroke-width:5]" />
      <text y={8} textAnchor="middle" fontSize={24} className="font-display fill-ink">
        {personInitials(fan.root)}
      </text>
      <text
        y={layout.centerRadius + 32}
        textAnchor="middle"
        fontSize={18}
        className="font-display fill-accent"
      >
        {label}
      </text>
    </g>
  );
}
