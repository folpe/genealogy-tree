'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DropdownMenu } from 'radix-ui';
import { useEffect, useState } from 'react';
import { setThemeAction } from '@/actions/preferences.actions';
import { authClient } from '@/lib/auth-client';
import { parseTheme, type ThemePreference, themeAttribute } from '@/lib/theme/theme';
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

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Comme l’appareil' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
];

export function AccountMenu({
  account,
  hasPasskey,
  theme: savedTheme,
}: {
  account: Account;
  hasPasskey: boolean;
  /** Thème enregistré (cookie lu par le serveur). */
  theme: ThemePreference;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState(savedTheme);

  /** Appliqué tout de suite sur la page, retenu pour les suivantes. */
  function chooseTheme(value: string) {
    const next = parseTheme(value);
    setTheme(next);
    const attribute = themeAttribute(next);
    if (attribute) document.documentElement.dataset['theme'] = attribute;
    else delete document.documentElement.dataset['theme'];
    void setThemeAction(next);
  }
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
            <DropdownMenu.Label className="px-3 pt-2 pb-1 text-xs font-semibold tracking-[0.14em] text-ink-2 uppercase">
              Thème
            </DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={theme} onValueChange={chooseTheme}>
              {THEMES.map(({ value, label }) => (
                <DropdownMenu.RadioItem
                  key={value}
                  value={value}
                  // Le menu reste ouvert : on voit l'effet avant de choisir.
                  onSelect={(event) => event.preventDefault()}
                  className={`${item} justify-between`}
                >
                  {label}
                  <DropdownMenu.ItemIndicator className="text-accent">
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 12.5l4.5 4.5L19 7.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
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
