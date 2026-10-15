// tdd-cover: e2e tests/e2e/tree-views.spec.ts
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Switch } from 'radix-ui';
import { useId } from 'react';
import { type TreeParams, treeHref } from '@/lib/tree/tree.params';
import type { TreeViewKind } from '@/server/family/family.service';

// Réglages d'affichage de l'arbre (plan phase 4, lot 6) : la vue, la personne au
// centre et les unions passées. Tout passe par l'URL : le serveur redessine, et le
// retour du navigateur revient à la vue précédente.

const VIEWS: { view: TreeViewKind; label: string }[] = [
  { view: 'couple', label: 'Notre famille' },
  { view: 'hourglass', label: 'Sablier' },
  { view: 'descendants', label: 'Descendants' },
  { view: 'all', label: 'Toute la famille' },
];

/** Même vue, centrée sur le lecteur : sans `p`, le serveur y revient de lui-même. */
function withoutCenter({ p: _, ...rest }: TreeParams): TreeParams {
  return rest;
}

/** Sur l'arbre plein écran du téléphone, le texte se pose sur une pastille lisible. */
const floating =
  'max-md:min-h-11 max-md:rounded-full max-md:bg-card max-md:px-4 max-md:shadow-float';

export function TreeViewControls({
  params,
  shownView,
  centerInCouple,
  centerName,
  canReturn,
}: {
  params: TreeParams;
  /** Vue réellement dessinée (la vue par défaut se résout côté serveur). */
  shownView: TreeViewKind;
  /** « Notre famille » n'a de sens que si la personne au centre est en couple. */
  centerInCouple: boolean;
  /** Nom de la personne au centre des vues descendants et sablier. */
  centerName: string | undefined;
  /**
   * « Revenir à moi » est proposé : le lecteur a une fiche, et ce n'est pas elle qui
   * est au centre.
   */
  canReturn: boolean;
}) {
  const router = useRouter();
  const pastId = useId();
  const pill =
    'flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

  return (
    // Au-dessus de l'arbre plein écran du téléphone, sans lui prendre les gestes entre les
    // pastilles ; une carte « Notre lien » ouverte prend leur place, ses vues reviennent à
    // sa fermeture.
    <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 max-md:pointer-events-none max-md:*:pointer-events-auto max-md:group-has-[[data-link-card]]/tree:hidden">
      <nav aria-label="Vue de l’arbre" className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {VIEWS.filter(({ view }) => view !== 'couple' || centerInCouple).map(({ view, label }) => {
          const current = shownView === view;
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
      {shownView !== 'all' && centerName ? (
        <p className={`flex items-center gap-2 text-sm text-ink-2 ${floating}`}>
          Centré sur <strong className="font-medium text-ink">{centerName}</strong>
          {canReturn ? (
            <Link
              href={treeHref(withoutCenter(params))}
              className="inline-flex min-h-11 items-center underline underline-offset-2"
            >
              Revenir à moi
            </Link>
          ) : undefined}
        </p>
      ) : undefined}
      <div className={`flex min-h-11 items-center gap-2 text-sm text-ink-2 ${floating}`}>
        <Switch.Root
          id={pastId}
          checked={params.past}
          onCheckedChange={(past) => router.push(treeHref({ ...params, past }))}
          // Cible tactile de 44 px autour d'un interrupteur de 24 px (pseudo-élément).
          className="relative h-6 w-10 shrink-0 rounded-full bg-line before:absolute before:-inset-2.5 before:content-[''] data-[state=checked]:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
