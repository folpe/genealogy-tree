// tdd-cover: e2e tests/e2e/relationship.spec.ts
import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

// Point d'entrée unique de GSAP (plan phase 5, lot 3) : les plugins sont enregistrés une
// fois, la préférence de mouvement réduit est lue au même endroit. Chaque animation garde
// ses durées près d'elle ; les règles communes sont dans DESIGN.md, section 10.

gsap.registerPlugin(DrawSVGPlugin, InertiaPlugin);

export { gsap };

/** Mouvement réduit : pas de tracé ni d'inertie, la caméra saute, seuls des fondus restent. */
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Durée des fondus qui restent avec le mouvement réduit (DESIGN.md, section 10). */
export const REDUCED_FADE_S = 0.15;
