// tdd-cover: e2e src/components/app/account-menu.test.tsx
'use client';

import { Dialog } from 'radix-ui';
import type { InstallMode } from './install.helper';

// Mode d'emploi de l'installation là où le navigateur n'a pas d'invite : Safari.
// Sur iPhone, l'app installée garde ses données à part de Safari : on s'y reconnecte
// une fois, d'où le conseil Face ID (une passkey suit l'appareil, pas le navigateur).

const steps: Record<'ios' | 'mac-safari', string[]> = {
  ios: [
    'Touche le bouton Partager (le carré avec une flèche). Sur iOS 26, il est dans le menu « ··· ».',
    'Choisis « Sur l’écran d’accueil », puis « Ajouter ».',
    'Ouvre Ances-Tree depuis ton écran d’accueil et connecte-toi avec Face ID.',
  ],
  'mac-safari': [
    'Dans la barre des menus, ouvre « Fichier ».',
    'Choisis « Ajouter au Dock », puis « Ajouter ».',
  ],
};

export function InstallDialog({
  mode,
  open,
  onOpenChange,
}: {
  mode: InstallMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (mode !== 'ios' && mode !== 'mac-safari') return undefined;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30" />
        <Dialog.Content className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-[var(--radius-card)] bg-card p-6 shadow-float focus-visible:outline-none md:top-1/2 md:bottom-auto md:-translate-y-1/2">
          <Dialog.Title className="font-display text-2xl">Installer Ances-Tree</Dialog.Title>
          <Dialog.Description className="mt-2 text-[15px] text-ink-2">
            L’arbre s’ouvre alors comme une app, en plein écran.
          </Dialog.Description>
          <ol className="mt-5 flex flex-col gap-4">
            {steps[mode].map((step, index) => (
              <li key={step} className="flex gap-3 text-[15px]">
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-bubble font-display text-sm"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <Dialog.Close className="mt-6 h-[50px] w-full rounded-full bg-ink text-[15px] font-semibold text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            J’ai compris
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
