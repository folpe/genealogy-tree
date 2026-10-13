// tdd-cover: e2e tests/e2e/tree.spec.ts
import type { Metadata } from 'next';
import { FamilyTree } from '@/components/family/family-tree';
import { drawTree } from '@/components/family/family-tree.helper';
import { getElk } from '@/lib/tree/tree.instance';
import { requireSession } from '@/server/auth/session';
import { getFamilyDeps } from '@/server/family/family.instance';
import { getTreeForViewer } from '@/server/family/family.service';

export const metadata: Metadata = { title: 'Arbre' };

export default async function TreePage() {
  const { user } = await requireSession();
  const tree = await getTreeForViewer(getFamilyDeps(), user.id);
  const drawing = await drawTree(tree, getElk());

  return (
    <main className="flex flex-col gap-6 p-4 md:p-8">
      <h1 className="font-display text-[32px] leading-tight">L’arbre de la famille</h1>
      <FamilyTree drawing={drawing} focusId={tree.viewerPersonId} />
    </main>
  );
}
