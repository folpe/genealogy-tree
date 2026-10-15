// tdd-cover: e2e tests/e2e/relationship.spec.ts
import type { PathStep } from '@/lib/tree/tree.path';
import { gsap, REDUCED_FADE_S, reducedMotion } from './gsap';

// Lien de parenté (DESIGN.md, section 10) : le reste de l'arbre s'estompe, puis le chemin
// s'allume de Toi vers la cible, pas à pas (DrawSVG) ; les pilules d'étapes de la carte
// suivent en cascade, au même rythme. Avec le mouvement réduit, les traits sont posés
// d'un coup et les pilules arrivent en fondu court.

const DIM_S = 0.25;
const STEP_S = 0.12;
const EASE = 'power2.out';
/** Trace le chemin dans le calque des liens ; rend de quoi l'achever et l'arrêter. */
export function animatePath(links: SVGSVGElement, steps: PathStep[]): () => void {
  if (reducedMotion()) return () => {};
  const drawn: SVGElement[] = [];
  // Ce que DrawSVG écrit sur un trait, effacé à la fin : le style du trait reprend (tiret
  // d'un lien relevé compris). `clearProps` ne passe que par CSSPlugin, absent ici.
  const release = () => {
    for (const path of drawn) {
      path.style.removeProperty('stroke-dasharray');
      path.style.removeProperty('stroke-dashoffset');
    }
  };
  const timeline = gsap.timeline({ onComplete: release });
  steps.forEach((step, i) => {
    for (const { id, reverse } of step) {
      // Une seule des deux branches d'un lien sans union existe, et un pli en cache.
      const path = links.querySelector<SVGElement>(`[data-link="${CSS.escape(id)}"]`);
      if (!path) continue;
      drawn.push(path);
      timeline.fromTo(
        path,
        { drawSVG: reverse ? '100% 100%' : '0% 0%' },
        { drawSVG: '0% 100%', duration: STEP_S, ease: EASE },
        DIM_S + i * STEP_S,
      );
    }
  });
  return () => {
    timeline.kill();
    release();
  };
}

/** Les pilules d'étapes, une à une, en même temps que leur pas sur l'arbre. */
export function animatePills(pills: Element[]): () => void {
  if (pills.length === 0) return () => {};
  const tween = reducedMotion()
    ? gsap.from(pills, { opacity: 0, duration: REDUCED_FADE_S, clearProps: 'opacity' })
    : gsap.from(pills, {
        opacity: 0,
        y: 4,
        duration: STEP_S * 2,
        delay: DIM_S,
        stagger: STEP_S,
        ease: EASE,
        clearProps: 'opacity,transform',
      });
  return () => {
    tween.progress(1).kill();
  };
}
