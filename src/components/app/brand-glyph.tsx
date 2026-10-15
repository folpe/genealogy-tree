// tdd-cover: e2e tests/e2e/auth.spec.ts
import { BRAND_MARK } from '@/lib/brand';

/**
 * Signe de la marque, l'éventail de `BRAND_MARK`. Chaque trait porte `pathLength="1"` :
 * l'écran de connexion le dessine en CSS (`.brand-draw`), sans GSAP.
 */
export function BrandGlyph({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {BRAND_MARK.map((mark) =>
        mark.kind === 'circle' ? (
          <circle key="toi" pathLength={1} cx={mark.cx} cy={mark.cy} r={mark.r} />
        ) : (
          <path key={mark.d} pathLength={1} d={mark.d} />
        ),
      )}
    </svg>
  );
}
