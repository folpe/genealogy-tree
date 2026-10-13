// tdd-cover: e2e tests/e2e/person-panel.spec.ts
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import type { AddRelativeResult } from '@/actions/family.actions';
import { FAN_GENERATIONS } from '@/components/fan/fan.helper';
import { fanHref } from '@/lib/fan/fan.params';
import { treeHref } from '@/lib/tree/tree.params';
import type { TreeForViewer } from '@/server/family/family.service';
import { AddRelative } from './add-relative';
import { relativeOptions } from './add-relative.helper';
import { FamilyTree } from './family-tree';
import { PersonSheet } from './family-views';
import { personLabel } from './person.helper';
import type { TreeDrawing } from './tree-drawing';

// L'arbre et sa fiche (plan phase 5, lot 4) : un tap ouvre la fiche sans quitter
// l'arbre, en panneau à droite sur grand écran, en feuille (vaul) sur mobile. La fiche
// vit dans l'URL (`?fiche=<id>`), poussée sans aller-retour serveur : le retour du
// navigateur la ferme, un lien la rouvre. Tout vient de l'arbre déjà filtré.

type AddAction = (
  state: AddRelativeResult | undefined,
  data: FormData,
) => Promise<AddRelativeResult>;

const WIDE = '(min-width: 1024px)';

/**
 * Grand écran ; `undefined` tant qu'on ne sait pas (rendu serveur, hydratation) : le
 * CSS montre alors le panneau, et la feuille mobile attend d'être sûre.
 */
function useWide(): boolean | undefined {
  const [wide, setWide] = useState<boolean>();
  useEffect(() => {
    const query = window.matchMedia(WIDE);
    setWide(query.matches);
    const onChange = () => setWide(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return wide;
}

/**
 * Next suit `pushState` et `replaceState` : `useSearchParams` change, sans nouveau
 * rendu serveur. Ouvrir ajoute une entrée ; fermer la remplace, pour que Retour ne
 * rouvre pas la fiche qu'on vient de fermer.
 */
function showFiche(id: string | undefined) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('fiche', id);
  else url.searchParams.delete('fiche');
  const next = `${url.pathname}${url.search}`;
  // allow-null: contrat de pushState et replaceState tel que Next le documente.
  if (id) window.history.pushState(null, '', next);
  else window.history.replaceState(null, '', next);
}

export function TreeWithSheet({
  tree,
  drawing,
  viewKey,
  addAction,
}: {
  tree: TreeForViewer;
  drawing: TreeDrawing;
  viewKey: string;
  addAction: AddAction;
}) {
  const asked = useSearchParams().get('fiche') ?? undefined;
  const person = asked ? tree.persons.find((p) => p.id === asked) : undefined;
  const title = person ? `Fiche de ${personLabel(person)}` : '';
  const wide = useWide();
  const open = useCallback((id: string) => showFiche(id), []);
  const close = useCallback(() => showFiche(undefined), []);

  const panel = person ? (
    <PersonPanel
      tree={tree}
      personId={person.id}
      onPick={open}
      onClose={close}
      addAction={addAction}
    />
  ) : undefined;
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <FamilyTree
          drawing={drawing}
          graph={tree.drawn}
          focusId={tree.viewerPersonId}
          centerId={tree.centerId}
          viewKey={viewKey}
          selectedId={person?.id}
          onOpen={open}
        />
      </div>
      {/* Monté une seule fois : en panneau, sauf sur un écran qu'on sait étroit. */}
      {panel && wide !== false ? (
        <aside
          aria-label={title}
          className="hidden max-h-[calc(100dvh-13rem)] w-[420px] shrink-0 overflow-y-auto rounded-[var(--radius-card)] bg-card p-7 shadow-card lg:block"
        >
          {panel}
        </aside>
      ) : undefined}
      <Drawer.Root
        open={panel !== undefined && wide === false}
        onOpenChange={(next) => !next && close()}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/20" />
          <Drawer.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[var(--radius-card)] bg-card shadow-float outline-none"
          >
            <Drawer.Handle className="mt-3 !w-12 !bg-line" />
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            <div className="overflow-y-auto px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {panel}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

const action =
  'flex h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

function PersonPanel({
  tree,
  personId,
  onPick,
  onClose,
  addAction,
}: {
  tree: TreeForViewer;
  personId: string;
  onPick: (id: string) => void;
  onClose: () => void;
  addAction: AddAction;
}) {
  const person = tree.persons.find((p) => p.id === personId);
  if (!person) return undefined;
  const relation = tree.relations[personId];
  const name = personLabel(person);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <span className="pt-3 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          {relation ? relation.charAt(0).toUpperCase() + relation.slice(1) : 'Fiche'}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fiche"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <PersonSheet tree={tree} personId={personId} heading="h2" bare onPick={onPick} />
      <nav aria-label={`Autour de ${name}`} className="flex flex-wrap gap-2">
        <Link href={`/people/${personId}`} className={action}>
          Fiche complète
        </Link>
        <Link
          href={fanHref({ p: personId, generations: FAN_GENERATIONS.initial })}
          className={action}
        >
          Ses ancêtres
        </Link>
        <Link href={treeHref({ view: 'couple', p: personId, past: false })} className={action}>
          Centrer l’arbre ici
        </Link>
      </nav>
      {person.level === 'minor' ? undefined : (
        <AddRelative
          key={personId}
          anchor={{ id: personId, firstName: person.firstName, lastName: person.lastName }}
          options={relativeOptions(tree, personId)}
          intent={undefined}
          action={addAction}
        />
      )}
    </div>
  );
}
