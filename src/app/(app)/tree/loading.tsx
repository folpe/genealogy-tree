// tdd-cover: e2e tests/e2e/tree.spec.ts
// Arbre en chargement : le canevas apparaît dès le tap (retour depuis une fiche,
// marque de l'en-tête), avant que le serveur ait placé l'arbre.

export default function TreeLoading() {
  return (
    <main className="flex h-full flex-col gap-3 px-4 pt-2 pb-4 md:gap-4 md:p-8 md:pt-4">
      <h1 className="sr-only font-display text-[32px] leading-tight md:not-sr-only">
        L’arbre de la famille
      </h1>
      <div
        aria-busy="true"
        className="canvas-grid relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-[var(--radius-panel)] border border-line"
      >
        <p role="status" className="flex flex-col items-center gap-3 text-[15px] text-ink-2">
          <span
            aria-hidden="true"
            className="size-[76px] rounded-full border-2 border-card bg-bubble shadow-bubble motion-safe:animate-pulse"
          />
          L’arbre se dessine…
        </p>
      </div>
    </main>
  );
}
