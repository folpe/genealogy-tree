// tdd-cover: e2e src/components/family/family-views.test.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PersonSheet } from '@/components/family/family-views';
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
    </main>
  );
}
