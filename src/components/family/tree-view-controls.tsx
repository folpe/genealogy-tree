// tdd-cover: e2e tests/e2e/tree-views.spec.ts
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Switch } from 'radix-ui';
import { useId } from 'react';
import { type TreeParams, treeHref } from '@/lib/tree/tree.params';

// Réglages d'affichage de l'arbre (plan phase 4, lot 6) : la vue, la personne au
// centre et les unions passées. Tout passe par l'URL : le serveur redessine, et le
// retour du navigateur revient à la vue précédente.

const VIEWS: { view: TreeParams['view']; label: string }[] = [
  { view: 'all', label: 'Toute la famille' },
  { view: 'descendants', label: 'Descendants' },
  { view: 'hourglass', label: 'Sablier' },
];

export function TreeViewControls({
  params,
  centerName,
  isViewer,
}: {
  params: TreeParams;
  /** Nom de la personne au centre des vues descendants et sablier. */
  centerName: string | undefined;
  /** La personne au centre est le lecteur lui-même. */
  isViewer: boolean;
}) {
  const router = useRouter();
  const pastId = useId();
  const pill =
    'flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <nav aria-label="Vue de l’arbre" className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {VIEWS.map(({ view, label }) => {
          const current = params.view === view;
          return (
            <Link
              key={view}
              href={treeHref({ ...params, view })}
              aria-current={current ? 'page' : undefined}
              className={`${pill} ${current ? 'border border-ink bg-ink text-on-ink' : 'border border-line bg-card text-ink-2'}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {params.view !== 'all' && centerName ? (
        <p className="flex items-center gap-2 text-sm text-ink-2">
          Centré sur <strong className="font-medium text-ink">{centerName}</strong>
          {isViewer ? undefined : (
            <Link
              href={treeHref({ view: params.view, past: params.past })}
              className="underline underline-offset-2"
            >
              Revenir à moi
            </Link>
          )}
        </p>
      ) : undefined}
      <div className="flex min-h-11 items-center gap-2 text-sm text-ink-2">
        <Switch.Root
          id={pastId}
          checked={params.past}
          onCheckedChange={(past) => router.push(treeHref({ ...params, past }))}
          className="relative h-6 w-10 shrink-0 rounded-full bg-line data-[state=checked]:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-card shadow-float data-[state=checked]:translate-x-[18px] motion-safe:transition-transform" />
        </Switch.Root>
        <label htmlFor={pastId} className="cursor-pointer py-3">
          Unions passées
        </label>
      </div>
    </div>
  );
}
