// tdd-cover: e2e tests/e2e/auth.spec.ts
import { headers } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AccountMenu } from '@/components/app/account-menu';
import { getAuth } from '@/server/auth/auth.instance';
import { requireSession } from '@/server/auth/session';
import { getMembersDeps } from '@/server/members/members.instance';
import { getViewerAccount } from '@/server/members/members.service';

// Coque de l'espace connecté : la marque, qui ramène à l'arbre, et l'avatar du
// compte. Partagée par toutes les pages, elle reste en place d'une page à l'autre.

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession();
  const [account, passkeys] = await Promise.all([
    getViewerAccount(getMembersDeps(), user.id),
    getAuth().api.listPasskeys({ headers: await headers() }),
  ]);

  return (
    <>
      <header className="flex items-center justify-between gap-4 px-4 pt-3 md:px-8 md:pt-[18px]">
        <Link
          href="/tree"
          className="font-display text-xl leading-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          Ances-Tree
        </Link>
        <AccountMenu account={account} hasPasskey={passkeys.length > 0} />
      </header>
      {children}
    </>
  );
}
