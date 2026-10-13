// tdd-cover: e2e tests/e2e/tree.spec.ts
import Link from 'next/link';

// Fiche en chargement : affichée dès le tap, pendant que le serveur lit la fiche.
// Même gabarit que PersonSheet, pour que la page ne saute pas à l'arrivée.

const block = 'rounded-full bg-bubble motion-safe:animate-pulse';

export default function PersonLoading() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
      <nav className="text-sm font-medium text-ink-2">
        <Link href="/tree">Retour à l’arbre</Link>
      </nav>
      <article
        aria-busy="true"
        className="flex flex-col gap-6 rounded-[var(--radius-card)] bg-card p-6 shadow-card md:p-8"
      >
        <p role="status" className="sr-only">
          Chargement de la fiche
        </p>
        <span aria-hidden="true" className={`size-[120px] ${block}`} />
        <span aria-hidden="true" className={`h-8 w-2/3 ${block}`} />
        <span aria-hidden="true" className={`h-4 w-1/2 ${block}`} />
        <span aria-hidden="true" className={`h-4 w-1/3 ${block}`} />
      </article>
    </main>
  );
}
