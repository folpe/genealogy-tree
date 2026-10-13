// tdd-cover: e2e tests/e2e/person-panel.spec.ts
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';
import { type AddRelativeResult, relationshipAction } from '@/actions/family.actions';
import { FAN_GENERATIONS } from '@/components/fan/fan.helper';
import { fanHref } from '@/lib/fan/fan.params';
import { treeHref } from '@/lib/tree/tree.params';
import { type PathHighlight, pathHighlight } from '@/lib/tree/tree.path';
import type { RelationshipView, TreeForViewer } from '@/server/family/family.service';
import { AddRelative } from './add-relative';
import { relativeOptions } from './add-relative.helper';
import { FamilyTree } from './family-tree';
import { PersonSheet } from './family-views';
import { useOpenFicheRequests } from './open-fiche';
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
  const search = useSearchParams();
  const asked = search.get('fiche') ?? undefined;
  /** Retour d'une fiche complète : la bulle de la personne, sans rouvrir sa fiche. */
  const focusOn = search.get('focus') ?? undefined;
  const person = asked ? tree.persons.find((p) => p.id === asked) : undefined;
  const title = person ? `Fiche de ${personLabel(person)}` : '';
  const wide = useWide();
  const open = useCallback((id: string) => showFiche(id), []);
  const close = useCallback(() => showFiche(undefined), []);
  useOpenFicheRequests((id) => {
    if (!tree.drawn.personIds.includes(id)) return false;
    showFiche(id);
    return true;
  });
  const [link, setLink] = useState<{ view: RelationshipView; highlight: PathHighlight }>();
  const [cardHeight, setCardHeight] = useState(0);
  // Une autre vue de l'arbre (recentrage, profondeur) : le lien éclairé ne vaut plus.
  const [linkView, setLinkView] = useState(viewKey);
  if (linkView !== viewKey) {
    setLinkView(viewKey);
    setLink(undefined);
    setCardHeight(0);
  }
  /** « Notre lien » : sur mobile, la feuille s'efface pour laisser voir le chemin. */
  const showLink = useCallback(
    (view: RelationshipView) => {
      setLink({ view, highlight: pathHighlight(view.path, tree.unions) });
      if (wide === false) close();
    },
    [tree.unions, wide, close],
  );

  const panel = person ? (
    <PersonPanel
      tree={tree}
      personId={person.id}
      onPick={open}
      onClose={close}
      onLink={tree.viewerPersonId && tree.viewerPersonId !== person.id ? showLink : undefined}
      addAction={addAction}
    />
  ) : undefined;
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="relative min-w-0 flex-1">
        {link ? (
          <RelationshipCard
            // Un autre lien : une autre carte, mesurée à nouveau.
            key={link.view.path.join('>')}
            view={link.view}
            onClose={() => {
              setLink(undefined);
              setCardHeight(0);
            }}
            onHeight={setCardHeight}
          />
        ) : undefined}
        <FamilyTree
          drawing={drawing}
          graph={tree.drawn}
          focusId={tree.viewerPersonId}
          centerId={tree.centerId}
          viewKey={viewKey}
          selectedId={person?.id}
          focusOn={focusOn}
          onOpen={open}
          highlight={link?.highlight}
          coveredTop={link ? cardHeight : 0}
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
  onLink,
  addAction,
}: {
  tree: TreeForViewer;
  personId: string;
  onPick: (id: string) => void;
  onClose: () => void;
  /** Absent pour sa propre fiche, ou sans fiche reliée au compte. */
  onLink: ((view: RelationshipView) => void) | undefined;
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
      {onLink ? <LinkButton key={personId} personId={personId} onLink={onLink} /> : undefined}
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

/** Bouton « Notre lien » : le calcul se fait au serveur, à la demande. */
function LinkButton({
  personId,
  onLink,
}: {
  personId: string;
  onLink: (view: RelationshipView) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  async function ask() {
    setPending(true);
    setError(undefined);
    try {
      const result = await relationshipAction(personId);
      if (result.ok) onLink(result.view);
      else setError(result.error);
    } catch {
      setError('Le lien n’a pas pu être calculé. Réessaie dans un instant.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={ask}
        disabled={pending}
        className="flex h-12 items-center justify-center rounded-full bg-ink px-6 text-[15px] font-semibold text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
      >
        {pending ? 'Je cherche le chemin…' : 'Notre lien'}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : undefined}
    </div>
  );
}

/** Carte en haut du canevas (DESIGN.md, `RelationshipPanel`). */
function RelationshipCard({
  view,
  onClose,
  onHeight,
}: {
  view: RelationshipView;
  onClose: () => void;
  /** Hauteur occupée sur le canevas, marge comprise : le cadrage de la caméra l'évite. */
  onHeight: (height: number) => void;
}) {
  const ref = useRef<HTMLElement>(null); // allow-null: contrat des refs de React
  useLayoutEffect(() => {
    const element = ref.current;
    if (element) onHeight(element.offsetTop + element.offsetHeight);
  }, [onHeight]);
  const common =
    view.common.length > 1
      ? `${view.common.slice(0, -1).join(', ')} et ${view.common.at(-1)}`
      : view.common[0];
  return (
    <section
      ref={ref}
      aria-label="Notre lien"
      className="absolute inset-x-3 top-3 z-10 mx-auto flex max-w-lg flex-col gap-2 rounded-[var(--radius-panel)] bg-card p-4 shadow-float md:gap-3 md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="pt-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Notre lien
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le lien"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <p aria-live="polite" className="font-display text-[19px] leading-snug md:text-[26px]">
        {view.sentence}
      </p>
      {view.steps.length > 1 ? (
        <ol className="flex flex-wrap items-center gap-1.5">
          {view.steps.map((step, i) => (
            <li
              key={step.id}
              className={`flex h-8 items-center rounded-full px-3 text-[13px] ${i === 0 || i === view.steps.length - 1 ? 'bg-accent-soft text-accent-strong' : 'bg-paper'}`}
            >
              {i === 0 ? 'Toi' : step.name}
            </li>
          ))}
        </ol>
      ) : undefined}
      {common ? <p className="text-sm text-ink-2">Ancêtres communs : {common}</p> : undefined}
    </section>
  );
}
