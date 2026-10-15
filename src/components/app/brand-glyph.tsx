// tdd-cover: e2e tests/e2e/auth.spec.ts

/**
 * Signe de la marque : un tronc, deux branches, trois têtes. Chaque trait porte
 * `pathLength="1"` : l'écran de connexion le dessine en CSS (`.brand-draw`), sans GSAP.
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
      aria-hidden="true"
      className={className}
    >
      <path pathLength={1} d="M16 28V16" />
      <path pathLength={1} d="M16 20C16 16 11 15 9 12" />
      <path pathLength={1} d="M16 18C16 14 21 13 23 10" />
      <circle pathLength={1} cx="9" cy="9" r="3" />
      <circle pathLength={1} cx="23" cy="7.5" r="3" />
      <circle pathLength={1} cx="16" cy="12" r="3" />
    </svg>
  );
}
