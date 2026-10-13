'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DropdownMenu } from 'radix-ui';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { InstallDialog } from './install-dialog';
import { useInstall } from './use-install';

// Avatar de l'en-tête et menu du compte : la fiche, les membres, Face ID,
// l'installation de l'app et la déconnexion, au même endroit que dans une app.

export type Account = {
  personId: string | undefined;
  name: string;
  initials: string;
  email: string;
  isAdmin: boolean;
};

const STATUS_MS = 6000;

const item =
  'flex h-11 cursor-pointer items-center rounded-xl px-3 text-[15px] outline-none select-none data-[highlighted]:bg-canvas';

export function AccountMenu({ account, hasPasskey }: { account: Account; hasPasskey: boolean }) {
  const router = useRouter();
  const install = useInstall();
  const [installOpen, setInstallOpen] = useState(false);
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(undefined), STATUS_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function activatePasskey() {
    const result = await authClient.passkey.addPasskey();
    if (result?.error) {
      setStatus('Pas de souci, tu pourras l’activer plus tard depuis ce menu.');
      return;
    }
    setStatus('C’est fait. La prochaine fois, un simple regard suffit.');
    router.refresh();
  }

  async function signOut() {
    const result = await authClient.signOut();
    if (result?.error) {
      setStatus('La déconnexion n’a pas abouti. Réessaie dans un instant.');
      return;
    }
    router.replace('/login');
  }

  return (
    <div className="relative">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label={`Mon compte, ${account.name}`}
          className="grid size-11 place-items-center rounded-full border-2 border-card bg-bubble font-display text-[17px] shadow-bubble focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {account.initials}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            collisionPadding={16}
            // Le mode d'emploi s'ouvre depuis le menu : le focus va à lui, pas à l'avatar.
            onCloseAutoFocus={(event) => {
              if (installOpen) event.preventDefault();
            }}
            className="z-50 min-w-64 rounded-2xl bg-card p-2 text-ink shadow-float"
          >
            <DropdownMenu.Label className="px-3 pt-2 pb-3">
              <span className="block font-display text-lg leading-tight">{account.name}</span>
              {account.personId ? (
                <span className="block text-sm text-ink-2">{account.email}</span>
              ) : undefined}
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="mx-3 mb-1 h-px bg-rule" />
            {account.personId ? (
              <DropdownMenu.Item asChild className={item}>
                <Link href={`/people/${account.personId}`}>Ma fiche</Link>
              </DropdownMenu.Item>
            ) : undefined}
            <DropdownMenu.Item asChild className={item}>
              <Link href="/members">Membres</Link>
            </DropdownMenu.Item>
            {account.isAdmin ? (
              <DropdownMenu.Item asChild className={item}>
                <Link href="/admin">Demandes d’accès</Link>
              </DropdownMenu.Item>
            ) : undefined}
            {hasPasskey ? undefined : (
              <DropdownMenu.Item className={item} onSelect={activatePasskey}>
                Activer Face ID / Touch ID
              </DropdownMenu.Item>
            )}
            {install.mode === 'prompt' ? (
              <DropdownMenu.Item className={item} onSelect={install.prompt}>
                Installer l’app
              </DropdownMenu.Item>
            ) : undefined}
            {install.mode === 'ios' || install.mode === 'mac-safari' ? (
              <DropdownMenu.Item className={item} onSelect={() => setInstallOpen(true)}>
                Installer l’app
              </DropdownMenu.Item>
            ) : undefined}
            <DropdownMenu.Separator className="mx-3 my-1 h-px bg-rule" />
            <DropdownMenu.Item className={`${item} text-accent`} onSelect={signOut}>
              Me déconnecter
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <InstallDialog mode={install.mode} open={installOpen} onOpenChange={setInstallOpen} />
      <p
        role="status"
        className="absolute top-full right-0 mt-2 w-max max-w-[min(20rem,calc(100vw-2rem))] text-right text-sm text-ink-2 empty:hidden"
      >
        {status}
      </p>
    </div>
  );
}
