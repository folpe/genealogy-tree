// tdd-cover: e2e tests/e2e/auth.spec.ts
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AccountMenu } from '@/components/app/account-menu';
import { CommandPalette } from '@/components/app/command-palette';
import { NavPills } from '@/components/app/nav-pills';
import { PageZone } from '@/components/app/page-zone';
import { parseTheme, THEME_COOKIE } from '@/lib/theme/theme';
import { getAuth } from '@/server/auth/auth.instance';
import { requireSession } from '@/server/auth/session';
import { getMembersDeps } from '@/server/members/members.instance';
import { getViewerAccount } from '@/server/members/members.service';

// Coque de l'espace connecté : la marque, qui ramène à l'arbre, les onglets des vues
// et l'avatar du compte. Partagée par toutes les pages, elle reste en place d'une page à l'autre.
// Sur téléphone (maquette Mobile), les onglets descendent sous le pouce, en pilule flottante.

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession();
  const [account, passkeys, jar] = await Promise.all([
    getViewerAccount(getMembersDeps(), user.id),
    getAuth().api.listPasskeys({ headers: await headers() }),
    cookies(),
  ]);

  // Un écran d'app : l'en-tête reste en place, la page occupe le reste. Rien ne défile
  // en entier ; une page longue (fiche, membres) défile dans sa zone, l'arbre jamais.
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8 md:pt-[18px]">
        <Link
          href="/tree"
          className="font-display text-xl leading-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          Ances-Tree
        </Link>
        <div className="hidden md:block">
          <NavPills placement="header" />
        </div>
        <div className="flex items-center justify-end gap-2.5">
          <CommandPalette />
          <AccountMenu
            account={account}
            hasPasskey={passkeys.length > 0}
            theme={parseTheme(jar.get(THEME_COOKIE)?.value)}
          />
        </div>
      </header>
      <PageZone>{children}</PageZone>
      {/* Au-dessus des pages, sous les feuilles et dialogues (z-40 et plus). */}
      <div className="absolute inset-x-3 bottom-[var(--tab-bar-bottom)] z-30 md:hidden">
        <NavPills placement="bar" />
      </div>
    </div>
  );
}
