// tdd-cover: e2e tests/e2e/tree-views.spec.ts
import { BRAND_MARK, fanRing } from '@/lib/brand';

// L'arbre se dessine (plan phase 5) : en attendant le serveur, le signe de la marque
// pousse sur le canevas, toi, puis tes parents, tes grands-parents et une génération de
// plus, avant de s'effacer et de repousser. En CSS seul (`.fan-grow`, globals.css) : le
// chargement de la page ne tire pas GSAP. Avec le mouvement réduit, le signe est posé.

/** Anneaux du signe, puis celui des arrière-grands-parents, propre au chargement. */
const MARK_ARCS = BRAND_MARK.flatMap((shape) => (shape.kind === 'path' ? [shape.d] : []));
const RINGS: readonly (readonly string[])[] = [
  MARK_ARCS.slice(0, 2),
  MARK_ARCS.slice(2),
  fanRing(16.5, 8),
];
const ME = BRAND_MARK.find((shape) => shape.kind === 'circle');

/** Une génération après l'autre ; dans un anneau, les arcs se suivent à peine. */
const RING_DELAY_S = 0.22;
const ARC_DELAY_S = 0.025;
const delay = (ring: number, arc: number) => ({
  animationDelay: `${ring * RING_DELAY_S + arc * ARC_DELAY_S}s`,
});

export function TreeLoader() {
  return (
    <p
      role="status"
      className="tree-loader flex flex-col items-center gap-4 text-[15px] text-ink-2"
    >
      <svg
        aria-hidden="true"
        viewBox="-1.5 3 35 21"
        width="132"
        height="79"
        fill="none"
        strokeWidth="1.1"
        strokeLinecap="round"
        className="fan-grow overflow-visible"
      >
        {ME ? (
          <circle
            cx={ME.cx}
            cy={ME.cy}
            r={ME.r}
            pathLength={1}
            className="stroke-accent"
            style={delay(0, 0)}
          />
        ) : undefined}
        {RINGS.map((ring, r) =>
          ring.map((d, i) => (
            <path
              key={d}
              d={d}
              pathLength={1}
              // La génération à venir, plus légère : elle reste à découvrir.
              className={r === 2 ? 'stroke-ink-4' : 'stroke-ink'}
              style={delay(r + 1, i)}
            />
          )),
        )}
      </svg>
      L’arbre se dessine…
    </p>
  );
}
