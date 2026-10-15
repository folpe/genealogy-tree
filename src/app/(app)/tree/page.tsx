// tdd-cover: e2e tests/e2e/tree.spec.ts
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { addRelativeAction } from '@/actions/family.actions';
import { drawTree } from '@/components/family/family-tree.helper';
import { personLabel } from '@/components/family/person.helper';
import { TREE_ENTRY_SCRIPT } from '@/components/family/tree-memory.storage';
import { TreeViewControls } from '@/components/family/tree-view-controls';
import { TreeWithSheet } from '@/components/family/tree-with-sheet';
import { getElk } from '@/lib/tree/tree.instance';
import { familyToggleHref, parseTreeParams, treeHref } from '@/lib/tree/tree.params';
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
  // Nonce de la CSP, posé par le proxy : le script d'entrée passe comme ceux de Next.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <main className="group/tree flex h-full flex-col gap-3 px-4 pt-2 pb-4 md:gap-4 md:p-8 md:pt-4">
      {/* Sur mobile, l'onglet « Arbre » dit déjà où l'on est : la place va au canevas. */}
      <h1 className="sr-only font-display text-[32px] leading-tight md:not-sr-only">
        L’arbre de la famille
      </h1>
      {tree.viewerPersonId ? undefined : (
        <p
          role="note"
          // Lisible au-dessus de l'arbre plein écran du téléphone.
          className="relative z-10 text-sm text-ink-2 max-md:rounded-[var(--radius-card)] max-md:bg-card max-md:px-4 max-md:py-3 max-md:shadow-float"
        >
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
      {/* Avant le canevas dans le document : lu avant son premier affichage. */}
      <script
        nonce={nonce}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: texte fixe du module, sans donnée de la page ni de l'utilisateur ; en enfant, React en échapperait les guillemets.
        dangerouslySetInnerHTML={{ __html: TREE_ENTRY_SCRIPT }}
      />
      <TreeWithSheet
        tree={tree}
        drawing={drawing}
        families={Object.fromEntries(
          Object.entries(tree.inLawFamilies).map(([spouse, family]) => [
            spouse,
            { ...family, href: familyToggleHref(params, spouse) },
          ]),
        )}
        viewKey={treeHref(params)}
        addAction={addRelativeAction}
      />
    </main>
  );
}
