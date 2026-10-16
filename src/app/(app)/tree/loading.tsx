// tdd-cover: e2e tests/e2e/tree.spec.ts
import { TreeLoader } from '@/components/family/tree-loader';

// Arbre en chargement : le canevas apparaît dès le tap (retour depuis une fiche,
// marque de l'en-tête), avant que le serveur ait placé l'arbre ; le signe y pousse.

export default function TreeLoading() {
  return (
    <main className="flex h-full flex-col gap-3 px-4 pt-2 pb-4 md:gap-4 md:p-8 md:pt-4">
      <h1 className="sr-only font-display text-[32px] leading-tight md:not-sr-only">
        L’arbre de la famille
      </h1>
      <div
        aria-busy="true"
        className="canvas-grid relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-[var(--radius-panel)] border border-line max-md:fixed max-md:inset-0 max-md:rounded-none max-md:border-0"
      >
        <TreeLoader />
      </div>
    </main>
  );
}
