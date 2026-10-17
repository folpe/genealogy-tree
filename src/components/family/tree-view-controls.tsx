// tdd-cover: e2e tests/e2e/tree-views.spec.ts
'use client';

import Link from 'next/link';
import { useOptimistic } from 'react';
import { type TreeParams, treeHref } from '@/lib/tree/tree.params';
import type { TreeViewKind } from '@/server/family/family.service';
import { useTreeLink } from './tree-navigation';
import { TreeSettings } from './tree-settings';

// Réglages d'affichage de l'arbre (plan phase 4, lot 6) : la vue, la personne au
// centre et les unions passées. Tout passe par l'URL : le serveur redessine, et le
// retour du navigateur revient à la vue précédente. Les vues restent à un geste ; la
// personne au centre et les unions passées, qui changent rarement, vont dans les
// réglages, pour rendre la place à l'arbre sur le téléphone.

const VIEWS: { view: TreeViewKind; label: string }[] = [
  { view: 'couple', label: 'Notre famille' },
  { view: 'hourglass', label: 'Sablier' },
  { view: 'descendants', label: 'Descendants' },
  { view: 'all', label: 'Toute la famille' },
];

/**
 * Pastille de vue : 36 px sur le téléphone, 44 px de cible tactile par le pseudo-élément
 * (la rangée défilante garde 4 px de marge pour lui) ; 44 px sur ordinateur.
 */
const pill =
  'pointer-events-auto relative flex h-11 shrink-0 items-center rounded-full border px-4 ' +
  'font-medium text-sm max-md:h-9 max-md:px-3.5 max-md:before:absolute ' +
  "max-md:before:inset-x-0 max-md:before:-inset-y-1 max-md:before:content-[''] " +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
  'motion-safe:transition-colors';

/**
 * Sur le téléphone, la rangée défile au doigt et s'estompe au bord plutôt que de couper une
 * pastille ; elle ne prend que la largeur de ses pastilles, les réglages la suivent.
 */
const scroller =
  'flex min-w-0 gap-1 max-md:pointer-events-auto max-md:overflow-x-auto max-md:overscroll-x-contain ' +
  'max-md:py-1 max-md:pr-7 max-md:pl-4 max-md:[scrollbar-width:none] ' +
  'max-md:[mask-image:linear-gradient(to_right,transparent,black_14px,black_calc(100%-28px),transparent)]';

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
  const follow = useTreeLink();
  // La vue demandée se montre choisie dès le tap ; la vraie revient avec le serveur.
  const [view, showView] = useOptimistic(shownView);
  const views = VIEWS.filter((v) => v.view !== 'couple' || centerInCouple);

  return (
    // Au-dessus de l'arbre plein écran du téléphone, sans lui prendre les gestes entre les
    // pastilles (seules elles reçoivent le doigt) ; une carte « Notre lien » ouverte prend
    // leur place, ses vues reviennent à sa fermeture. Sur le téléphone, la rangée va
    // d'un bord à l'autre de l'écran : le fondu y tombe.
    <div className="pointer-events-none relative z-10 flex items-center gap-3 max-md:-mx-4 max-md:gap-1 max-md:group-has-[[data-link-card]]/tree:hidden">
      <nav aria-label="Vue de l’arbre" className={scroller}>
        {views.map(({ view: kind, label }) => {
          const current = view === kind;
          const href = treeHref({ ...params, view: kind });
          return (
            <Link
              key={kind}
              href={href}
              aria-current={current ? 'page' : undefined}
              onClick={(event) => follow(event, href, () => showView(kind))}
              className={`${pill} ${current ? 'border-ink bg-ink text-on-ink' : 'border-line bg-card text-ink-2 hover:text-ink'}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="pointer-events-auto shrink-0 max-md:pr-4">
        <TreeSettings
          params={params}
          centerName={view !== 'all' ? centerName : undefined}
          canReturn={canReturn}
          lineages={view === 'all'}
        />
      </div>
    </div>
  );
}
