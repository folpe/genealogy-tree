// tdd-cover: e2e tests/e2e/tree-quick-actions.spec.ts
'use client';

import { DropdownMenu } from 'radix-ui';
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { FoldAction } from '@/lib/tree/tree.lineage';
import { createLongPress } from './long-press';

// Actions rapides d'une bulle (plan phase 5, lot 7 ; maquette Arbre) : appui long au
// doigt, clic droit à la souris, touche Menu ou Maj + F10 au clavier. Un menu Radix,
// accroché au-dessus de la bulle : focus, flèches et Échap viennent avec lui.

/** La bulle sous un événement du canevas, par son `data-person`. */
const personAt = (target: EventTarget): string | undefined =>
  target instanceof Element
    ? target.closest<HTMLElement>('[role="treeitem"]')?.dataset['person']
    : undefined;

/** Retour haptique bref à l'ouverture, là où le navigateur le permet (pas sur iOS). */
function tick() {
  if ('vibrate' in navigator) navigator.vibrate(8);
}

/**
 * L'état du menu et les écouteurs à poser sur le canevas. Les écouteurs sont sur le
 * canevas, pas sur chaque bulle : un deuxième doigt posé ailleurs annule aussi l'appui.
 */
export function useQuickPress(enabled: boolean) {
  const [quickId, setQuickId] = useState<string>();
  const press = useMemo(
    () =>
      createLongPress((id) => {
        tick();
        setQuickId(id);
      }),
    [],
  );
  // Un arbre quitté pendant l'appui n'ouvre plus rien.
  useEffect(() => press.cancel, [press]);
  const canvas = {
    onPointerDown: (event: PointerEvent) => {
      const id = enabled ? personAt(event.target) : undefined;
      if (!id) return press.cancel();
      press.down(id, {
        x: event.clientX,
        y: event.clientY,
        pointerType: event.pointerType,
        isPrimary: event.isPrimary,
      });
    },
    onPointerMove: (event: PointerEvent) => press.move({ x: event.clientX, y: event.clientY }),
    onPointerUp: press.up,
    onPointerCancel: press.cancel,
    // Le doigt se lève après l'appui long : ce clic-là n'ouvre pas la fiche.
    onClickCapture: (event: MouseEvent) => {
      if (!press.swallowClick()) return;
      event.preventDefault();
      event.stopPropagation();
    },
    onContextMenu: (event: MouseEvent) => {
      const id = enabled ? personAt(event.target) : undefined;
      if (!id) return;
      event.preventDefault();
      setQuickId(id);
    },
  };
  /** Sur une bulle prise au clavier ; vrai si la touche a ouvert le menu. */
  const onKey = useCallback(
    (id: string, event: KeyboardEvent): boolean => {
      const asked = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
      if (!enabled || !asked) return false;
      event.preventDefault();
      setQuickId(id);
      return true;
    },
    [enabled],
  );
  return { quickId, close: () => setQuickId(undefined), canvas, onKey };
}

export const quickItem =
  'flex h-11 cursor-pointer items-center rounded-xl px-3 text-[15px] outline-none select-none data-[highlighted]:bg-canvas';

/**
 * Le menu, accroché à une ancre posée sur la bulle dans le calque de la caméra : il
 * suit la bulle là où elle est à l'écran. Modal : l'arbre ne bouge pas tant qu'il est
 * ouvert, et le premier appui à côté le referme.
 */
export function QuickMenu({
  at,
  label,
  bubble,
  onClose,
  children,
}: {
  /** Centre de la bulle, dans le repère du calque. */
  at: { x: number; y: number; radius: number };
  label: string;
  /** La bulle, qui reprend le focus si rien d'autre ne l'a pris (dialogue d'ajout). */
  bubble: () => HTMLElement | undefined;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <DropdownMenu.Root open onOpenChange={(next) => !next && onClose()}>
      <DropdownMenu.Trigger asChild>
        <span
          aria-hidden="true"
          tabIndex={-1}
          // L'anneau de la bulle choisie : on voit d'où vient le menu.
          className="pointer-events-none absolute rounded-full shadow-bubble-selected"
          style={{
            left: at.x - at.radius,
            top: at.y - at.radius,
            width: at.radius * 2,
            height: at.radius * 2,
          }}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          aria-label={`Actions rapides, ${label}`}
          side="top"
          sideOffset={10}
          collisionPadding={16}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // Un dialogue ouvert depuis le menu prend le focus juste après : on le lui laisse.
            requestAnimationFrame(() => {
              const active = document.activeElement;
              if (!active || active === document.body) bubble()?.focus({ preventScroll: true });
            });
          }}
          className="z-50 min-w-56 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-2xl bg-card p-2 text-ink shadow-float motion-safe:animate-[quick-in_140ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-[fade-in_150ms_linear]"
        >
          <DropdownMenu.Label className="truncate px-3 pt-1.5 pb-2 font-display text-lg leading-tight">
            {label}
          </DropdownMenu.Label>
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** Replier ou afficher autour de la bulle : sa famille, sa fratrie, sa branche. */
export function QuickFoldItems({
  actions,
  onSelect,
}: {
  actions: FoldAction[];
  onSelect: (action: FoldAction) => void;
}) {
  if (actions.length === 0) return undefined;
  return (
    <>
      <DropdownMenu.Separator className="mx-3 my-1 h-px bg-rule" />
      {actions.map((action) => (
        <DropdownMenu.Item
          key={action.label}
          className={quickItem}
          onSelect={() => onSelect(action)}
        >
          {action.label}
        </DropdownMenu.Item>
      ))}
    </>
  );
}
