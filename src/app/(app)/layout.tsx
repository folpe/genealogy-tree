// tdd-cover: e2e tests/e2e/auth.spec.ts
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AccountMenu } from '@/components/app/account-menu';
import { BrandGlyph } from '@/components/app/brand-glyph';
import { CommandPalette } from '@/components/app/command-palette';
import { NavPills } from '@/components/app/nav-pills';
import { PageZone } from '@/components/app/page-zone';
import { APP_NAME } from '@/lib/brand';
import { readThemeCookie } from '@/lib/theme/theme';
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
      <header className="relative z-20 flex max-md:pointer-events-none max-md:[&_a]:pointer-events-auto max-md:[&_button]:pointer-events-auto shrink-0 items-center gap-2.5 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1 md:grid md:grid-cols-[1fr_auto_1fr] md:pr-[max(2rem,env(safe-area-inset-right))] md:pl-[max(2rem,env(safe-area-inset-left))] md:pt-[18px]">
        <Link
          href="/tree"
          className="shrink-0 rounded-full font-display text-xl leading-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          {/* Sur téléphone, la marque se réduit à son signe : la recherche prend la place. */}
          <BrandMark />
          <span className="max-md:sr-only">{APP_NAME}</span>
        </Link>
        <div className="hidden md:block">
          <NavPills placement="header" />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 md:flex-none">
          <CommandPalette />
          <AccountMenu
            account={account}
            hasPasskey={passkeys.length > 0}
            theme={readThemeCookie(jar)}
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

/** Le signe de la marque (maquette Mobile) : un arbre de trois branches, en pastille. */
function BrandMark() {
  return (
    <span className="grid size-11 place-items-center rounded-full bg-ink text-on-ink md:hidden">
      <BrandGlyph size={30} />
    </span>
  );
}
