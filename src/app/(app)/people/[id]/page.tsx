// tdd-cover: e2e src/components/family/family-views.test.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PersonSheet } from '@/components/family/family-views';
import { treeHref } from '@/lib/tree/tree.params';
import { requireSession } from '@/server/auth/session';
import { getFamilyDeps } from '@/server/family/family.instance';
import { getTreeForViewer } from '@/server/family/family.service';

export const metadata: Metadata = { title: 'Fiche' };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ user }, { id }] = await Promise.all([requireSession(), params]);
  const tree = await getTreeForViewer(getFamilyDeps(), user.id);
  if (!tree.persons.some((p) => p.id === id)) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
      <nav className="text-sm font-medium text-ink-2">
        <Link href="/tree">Retour à l’arbre</Link>
      </nav>
      <PersonSheet tree={tree} personId={id} />
      <nav aria-label="Voir dans l’arbre" className="flex flex-wrap gap-2">
        <Link
          href={treeHref({ view: 'descendants', p: id, past: false })}
          className="flex h-11 items-center rounded-full bg-card px-4 text-sm font-medium shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Ses descendants
        </Link>
        <Link
          href={treeHref({ view: 'hourglass', p: id, past: false })}
          className="flex h-11 items-center rounded-full bg-card px-4 text-sm font-medium shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Son sablier
        </Link>
      </nav>
    </main>
  );
}
