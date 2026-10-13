// tdd-cover: e2e tests/e2e/tree.spec.ts
// Arbre en chargement : le canevas apparaît dès le tap (retour depuis une fiche,
// marque de l'en-tête), avant que le serveur ait placé l'arbre.

export default function TreeLoading() {
  return (
    <main className="flex flex-col gap-6 p-4 md:p-8">
      <h1 className="font-display text-[32px] leading-tight">L’arbre de la famille</h1>
      <div
        aria-busy="true"
        className="canvas-grid relative grid h-[calc(100dvh-9rem)] min-h-[420px] place-items-center overflow-hidden rounded-[var(--radius-panel)] border border-line"
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
