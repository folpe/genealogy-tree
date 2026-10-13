// tdd-cover: e2e tests/e2e/fan.spec.ts
import type { Metadata } from 'next';
import { AncestorsView } from '@/components/fan/ancestors-view';
import { buildFan } from '@/components/fan/fan.helper';
import { fanHref, parseFanParams } from '@/lib/fan/fan.params';
import { requireSession } from '@/server/auth/session';
import { getFamilyDeps } from '@/server/family/family.instance';
import { getTreeForViewer } from '@/server/family/family.service';

export const metadata: Metadata = { title: 'Ancêtres' };

const COUNT = ['Une génération', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six'];

function heading(generations: number, rootName: string | undefined): string {
  const count =
    generations === 1 ? COUNT[0] : `${COUNT[generations - 1] ?? generations} générations`;
  return `${count} derrière ${rootName ?? 'toi'}`;
}

export default async function AncestorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ user }, params] = await Promise.all([
    requireSession(),
    searchParams.then(parseFanParams),
  ]);
  // L'arbre tel que le lecteur a le droit de le voir : l'éventail n'en lit rien d'autre.
  const tree = await getTreeForViewer(getFamilyDeps(), user.id);
  // Une personne inconnue (lien abîmé) ramène au lecteur.
  const fan =
    (params.p ? buildFan(tree, params.p, params.generations) : undefined) ??
    (tree.viewerPersonId ? buildFan(tree, tree.viewerPersonId, params.generations) : undefined);
  const rootName = fan && fan.root.id !== tree.viewerPersonId ? fan.root.firstName : undefined;

  return (
    <main className="flex flex-col gap-4 p-4 md:p-8">
      <header className="flex max-w-xl flex-col gap-1.5">
        <span className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          {rootName ? 'Ses ancêtres' : 'Tes ancêtres'}
        </span>
        <h1 className="font-display text-[28px] leading-tight md:text-[30px]">
          {heading(params.generations, rootName)}
        </h1>
        <p className="text-sm text-ink-2">
          Les cases en pointillés attendent quelqu’un. Touche-les pour compléter.
        </p>
      </header>
      {fan ? (
        <AncestorsView
          key={fanHref(params)}
          fan={fan}
          params={params}
          rootName={rootName}
          editable={tree.editableIds}
        />
      ) : (
        <p role="note" className="text-sm text-ink-2">
          Ton compte n’est relié à aucune fiche : l’éventail ne sait pas d’où partir. Ouvre ta fiche
          et choisis « C’est moi », ou les ancêtres d’une fiche depuis celle-ci.
        </p>
      )}
    </main>
  );
}
