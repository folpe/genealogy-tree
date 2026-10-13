// tdd-cover: e2e tests/e2e/tree.spec.ts
import type { Metadata } from 'next';
import { FamilyTree } from '@/components/family/family-tree';
import { drawTree } from '@/components/family/family-tree.helper';
import { personLabel } from '@/components/family/person.helper';
import { TreeViewControls } from '@/components/family/tree-view-controls';
import { getElk } from '@/lib/tree/tree.instance';
import { parseTreeParams, treeHref } from '@/lib/tree/tree.params';
import { requireSession } from '@/server/auth/session';
import { getFamilyDeps } from '@/server/family/family.instance';
import { getTreeForViewer } from '@/server/family/family.service';

export const metadata: Metadata = { title: 'Arbre' };

export default async function TreePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ user }, params] = await Promise.all([
    requireSession(),
    searchParams.then(parseTreeParams),
  ]);
  const tree = await getTreeForViewer(getFamilyDeps(), user.id, params);
  const drawing = await drawTree(tree, getElk());
  const center = tree.persons.find((p) => p.id === tree.centerId);

  return (
    <main className="flex flex-col gap-4 p-4 md:p-8">
      <h1 className="font-display text-[28px] leading-tight md:text-[32px]">
        L’arbre de la famille
      </h1>
      {tree.viewerPersonId ? undefined : (
        <p role="note" className="text-sm text-ink-2">
          Ton compte n’est relié à aucune fiche : l’arbre ne sait pas d’où partir. Ouvre ta fiche et
          choisis « C’est moi ».
        </p>
      )}
      <TreeViewControls
        params={params}
        shownView={tree.shownView}
        centerInCouple={tree.centerInCouple}
        centerName={center ? personLabel(center) : undefined}
        canReturn={tree.viewerPersonId !== undefined && tree.centerId !== tree.viewerPersonId}
      />
      <FamilyTree
        drawing={drawing}
        graph={tree.drawn}
        focusId={tree.viewerPersonId}
        centerId={tree.centerId}
        viewKey={treeHref(params)}
      />
    </main>
  );
}
