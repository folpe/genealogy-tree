// tdd-cover: e2e tests/e2e/tree-views.spec.ts
'use client';

import Link from 'next/link';
import { Popover, Switch } from 'radix-ui';
import {
  type ReactNode,
  useId,
  useOptimistic,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Drawer } from 'vaul';
import { type TreeParams, treeHref } from '@/lib/tree/tree.params';
import { requestTreeFolds } from './tree-folds';
import { useTreeLink, useTreeNavigate } from './tree-navigation';

// Réglages de l'arbre (DESIGN.md, section 7, règle 3) : la personne au centre, les
// familles affichées (« Lignées seules », « Tout afficher », dans Toute la famille) et
// les unions passées, derrière un seul bouton au bout de la rangée des vues. Feuille vaul
// sur le téléphone, comme la fiche ; popover sur ordinateur, où la place ne manque pas
// mais où un même geste vaut mieux que deux dispositions. Une pastille d'accent sur le
// bouton dit qu'un réglage s'écarte du départ.

/** Même seuil que le passage au téléphone des commandes de l'arbre (`md`). */
const WIDE = '(min-width: 768px)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Rien n'est ouvert au rendu serveur : la valeur par défaut n'y sert jamais. */
function useWide(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

const TITLE = 'Réglages de l’arbre';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

export function TreeSettings({
  params,
  centerName,
  canReturn,
  lineages = false,
}: {
  params: TreeParams;
  /** Personne au centre, si la vue en a une (pas « Toute la famille »). */
  centerName: string | undefined;
  canReturn: boolean;
  /** Vue aux collatéraux repliables : « Lignées seules » et « Tout afficher ». */
  lineages?: boolean;
}) {
  const wide = useWide();
  const [open, setOpen] = useState(false);
  // L'interrupteur bascule dès le tap ; l'arbre suit quand le serveur l'a redessiné.
  const [past, showPast] = useOptimistic(params.past);
  const changed = past || (centerName !== undefined && canReturn);
  const titleId = useId();
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null); // allow-null: contrat des refs de React
  const body = (
    <SettingsBody
      params={params}
      centerName={centerName}
      canReturn={canReturn}
      lineages={lineages}
      past={past}
      showPast={showPast}
      onLeave={() => setOpen(false)}
    />
  );

  return (
    <Popover.Root open={open && wide} onOpenChange={setOpen}>
      <Popover.Trigger
        ref={trigger}
        aria-label={changed ? `${TITLE}, modifiés` : TITLE}
        // Popover ou feuille selon l'écran : l'état ouvert et le panneau visé sont les nôtres.
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={`relative grid size-11 place-items-center rounded-full border border-line bg-card text-ink-2 hover:text-ink aria-expanded:border-ink aria-expanded:text-ink max-md:size-9 max-md:before:absolute max-md:before:-inset-1 max-md:before:content-[''] motion-safe:transition-colors ${focusRing}`}
      >
        <SlidersIcon />
        {changed ? (
          <span
            aria-hidden="true"
            data-settings-changed
            className="absolute top-0 right-0 size-2.5 rounded-full bg-accent ring-2 ring-card"
          />
        ) : undefined}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          id={panelId}
          aria-labelledby={titleId}
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-[340px] rounded-[24px] bg-card px-5 pt-5 pb-3 shadow-float outline-none motion-safe:animate-[quick-in_0.18s_cubic-bezier(0.22,1,0.36,1)]"
        >
          <h2 id={titleId} className="font-display text-ink text-xl">
            {TITLE}
          </h2>
          {body}
        </Popover.Content>
      </Popover.Portal>
      <SettingsSheet
        id={panelId}
        open={open && !wide}
        onOpenChange={setOpen}
        onClosed={() => trigger.current?.focus()}
      >
        {body}
      </SettingsSheet>
    </Popover.Root>
  );
}

/**
 * La feuille du téléphone. Sans Drawer.Trigger, Radix rendrait le focus à rien (le
 * corps de la page) : on le rend nous-mêmes au bouton, après Échap comme après un glissé.
 */
function SettingsSheet({
  id,
  open,
  onOpenChange,
  onClosed,
  children,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
  children: ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/20" />
        <Drawer.Content
          id={id}
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onClosed();
          }}
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[var(--radius-card)] bg-card shadow-float outline-none"
        >
          <Drawer.Handle className="mt-3 !w-12 !bg-line" />
          <div className="px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Drawer.Title className="font-display text-ink text-xl">{TITLE}</Drawer.Title>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SettingsBody({
  params,
  centerName,
  canReturn,
  lineages,
  past,
  showPast,
  onLeave,
}: {
  params: TreeParams;
  centerName: string | undefined;
  canReturn: boolean;
  lineages: boolean;
  past: boolean;
  showPast: (past: boolean) => void;
  /** « Revenir à moi » quitte les réglages : on veut voir l'arbre qui se redessine. */
  onLeave: () => void;
}) {
  const follow = useTreeLink();
  const navigate = useTreeNavigate();
  const pastId = useId();
  // Même vue, centrée sur le lecteur : sans `p`, le serveur y revient de lui-même.
  const { p: _, ...rest } = params;
  const home = treeHref(rest);

  return (
    <div className="mt-2 flex flex-col">
      {centerName ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-rule border-b py-3">
          <p className="text-[15px] text-ink-2">
            Centré sur <strong className="font-medium text-ink">{centerName}</strong>
          </p>
          {canReturn ? (
            <Link
              href={home}
              // Dans l'onglet seulement : un ⌘-clic ouvre ailleurs, les réglages restent.
              onClick={(event) => {
                if (follow(event, home)) onLeave();
              }}
              className={`inline-flex min-h-11 items-center rounded-full border border-line px-4 font-medium text-ink text-sm hover:bg-surface ${focusRing}`}
            >
              Revenir à moi
            </Link>
          ) : undefined}
        </div>
      ) : undefined}
      {lineages ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-rule border-b py-3">
          <p className="text-[15px] text-ink">Familles</p>
          <div className="flex gap-2">
            {(
              [
                ['lineages', 'Lignées seules'],
                ['all', 'Tout afficher'],
              ] as const
            ).map(([request, label]) => (
              <button
                key={request}
                type="button"
                // L'arbre se redessine sous les réglages refermés : on le voit bouger.
                onClick={() => {
                  requestTreeFolds(request);
                  onLeave();
                }}
                className={`inline-flex min-h-11 items-center rounded-full border border-line px-4 font-medium text-ink text-sm hover:bg-surface ${focusRing}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : undefined}
      <div className="flex min-h-14 items-center justify-between gap-4 py-2">
        <label htmlFor={pastId} className="cursor-pointer py-3 text-[15px] text-ink">
          Unions passées
        </label>
        <Switch.Root
          id={pastId}
          checked={past}
          onCheckedChange={(next) =>
            navigate(treeHref({ ...params, past: next }), () => showPast(next))
          }
          // Cible tactile de 44 px autour d'un interrupteur de 24 px (pseudo-élément).
          className={`relative h-6 w-10 shrink-0 rounded-full bg-line before:absolute before:-inset-2.5 before:content-[''] data-[state=checked]:bg-ink ${focusRing}`}
        >
          <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-card shadow-float data-[state=checked]:translate-x-[18px] motion-safe:transition-transform" />
        </Switch.Root>
      </div>
    </div>
  );
}

/** Deux curseurs : des réglages, au trait des autres icônes (2 px, bouts ronds). */
function SlidersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 8h8M18 8h2M4 16h2M12 16h8" />
      <circle cx="15" cy="8" r="2.5" />
      <circle cx="9" cy="16" r="2.5" />
    </svg>
  );
}
