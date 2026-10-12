// tdd-cover: e2e tests/e2e/tree.spec.ts
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { FamilyTree } from '@/components/family/family-tree';
import { drawTree } from '@/components/family/family-tree.helper';
import { getElk } from '@/lib/tree/tree.instance';
import { getAuth } from '@/server/auth/auth.instance';
import { requireSession } from '@/server/auth/session';
import { getFamilyDeps } from '@/server/family/family.instance';
import { getTreeForViewer } from '@/server/family/family.service';
import { Welcome } from './welcome';

export const metadata: Metadata = { title: 'Arbre' };

export default async function TreePage() {
  const { user } = await requireSession();
  const [tree, passkeys] = await Promise.all([
    getTreeForViewer(getFamilyDeps(), user.id),
    getAuth().api.listPasskeys({ headers: await headers() }),
  ]);
  const drawing = await drawTree(tree, getElk());

  return (
    <main className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-[32px] leading-tight">L’arbre de la famille</h1>
        <nav className="text-sm font-medium text-ink-2">
          <Link href="/members">Membres</Link>
        </nav>
      </header>
      <FamilyTree drawing={drawing} focusId={tree.viewerPersonId} />
      <section
        aria-label="Mon compte"
        className="max-w-3xl rounded-[var(--radius-panel)] border border-line bg-card p-6"
      >
        <Welcome email={user.email} hasPasskey={passkeys.length > 0} />
      </section>
    </main>
  );
}
