'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DropdownMenu } from 'radix-ui';
import { useEffect, useId, useState } from 'react';
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

/** Applique un thème sur la page ; `data-theme` absent : on suit l'appareil. */
function applyTheme(theme: ThemePreference) {
  const attribute = themeAttribute(theme);
  if (attribute) document.documentElement.dataset['theme'] = attribute;
  else delete document.documentElement.dataset['theme'];
}

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
        <DropdownMenu.Trigger className="grid size-11 place-items-center rounded-full border-2 border-card bg-bubble font-display text-[17px] shadow-bubble focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          {/* Les initiales dessinent l'avatar ; le nom du bouton dit à qui il est. */}
          <span aria-hidden="true">{account.initials}</span>
          <span className="sr-only">Mon compte, {account.name}</span>
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
            <ThemeChoice saved={savedTheme} onError={setStatus} />
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

/** Thème : appliqué tout de suite, retenu pour les pages suivantes ; annulé si l'enregistrement échoue. */
function ThemeChoice({
  saved,
  onError,
}: {
  saved: ThemePreference;
  onError: (message: string) => void;
}) {
  const [theme, setTheme] = useState(saved);
  async function choose(value: string) {
    const previous = theme;
    const next = parseTheme(value);
    setTheme(next);
    applyTheme(next);
    try {
      await setThemeAction(next);
    } catch {
      setTheme(previous);
      applyTheme(previous);
      onError('Le thème n’a pas pu être enregistré. Réessaie dans un instant.');
    }
  }
  const labelId = useId();
  return (
    <>
      <DropdownMenu.Label
        id={labelId}
        className="px-3 pt-2 pb-1 text-xs font-semibold tracking-[0.14em] text-ink-2 uppercase"
      >
        Thème
      </DropdownMenu.Label>
      <DropdownMenu.RadioGroup aria-labelledby={labelId} value={theme} onValueChange={choose}>
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
    </>
  );
}
