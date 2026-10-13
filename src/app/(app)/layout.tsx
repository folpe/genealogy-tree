// tdd-cover: e2e tests/e2e/auth.spec.ts
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AccountMenu } from '@/components/app/account-menu';
import { NavPills } from '@/components/app/nav-pills';
import { parseTheme, THEME_COOKIE } from '@/lib/theme/theme';
import { getAuth } from '@/server/auth/auth.instance';
import { requireSession } from '@/server/auth/session';
import { getMembersDeps } from '@/server/members/members.instance';
import { getViewerAccount } from '@/server/members/members.service';

// Coque de l'espace connecté : la marque, qui ramène à l'arbre, les onglets des vues
// et l'avatar du compte. Partagée par toutes les pages, elle reste en place d'une page à l'autre.

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession();
  const [account, passkeys, jar] = await Promise.all([
    getViewerAccount(getMembersDeps(), user.id),
    getAuth().api.listPasskeys({ headers: await headers() }),
    cookies(),
  ]);

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-4 pt-3 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8 md:pt-[18px]">
        <Link
          href="/tree"
          className="font-display text-lg leading-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:text-xl"
        >
          Ances-Tree
        </Link>
        <NavPills />
        <div className="flex justify-end">
          <AccountMenu
            account={account}
            hasPasskey={passkeys.length > 0}
            theme={parseTheme(jar.get(THEME_COOKIE)?.value)}
          />
        </div>
      </header>
      {children}
    </>
  );
}
