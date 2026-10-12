// tdd-cover: e2e src/components/family/family-views.test.tsx
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { GenerationList } from '@/components/family/family-views';
import { getAuth } from '@/server/auth/auth.instance';
import { requireSession } from '@/server/auth/session';
import { getFamilyDeps } from '@/server/family/family.instance';
import { getTreeForViewer } from '@/server/family/family.service';
import { Welcome } from './welcome';

export const metadata: Metadata = { title: 'Arbre' };

// Rendu provisoire par génération : l'arbre graphique de la maquette arrive en phase 4.
export default async function TreePage() {
  const { user } = await requireSession();
  const [tree, passkeys] = await Promise.all([
    getTreeForViewer(getFamilyDeps(), user.id),
    getAuth().api.listPasskeys({ headers: await headers() }),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 md:p-8">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-[32px] leading-tight">L’arbre de la famille</h1>
        <nav className="text-sm font-medium text-ink-2">
          <Link href="/members">Membres</Link>
        </nav>
      </header>
      <GenerationList tree={tree} />
      <section
        aria-label="Mon compte"
        className="rounded-[var(--radius-panel)] border border-line bg-card p-6"
      >
        <Welcome email={user.email} hasPasskey={passkeys.length > 0} />
      </section>
    </main>
  );
}
