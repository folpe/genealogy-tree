// tdd-cover: e2e tests/e2e/tree-fold.spec.ts
import { gsap, reducedMotion } from './gsap';

// Passage d'un placement à un autre (plan phase 4, lot 5) : chaque bulle qui reste
// glisse de son ancienne place à la nouvelle, les nouvelles apparaissent en fondu et
// en échelle, celles qui partent s'effacent, les liens reviennent une fois en place.
// Avec les mouvements réduits, tout est posé d'un coup (DESIGN.md, section 10).

const MOVE_S = 0.5;
const ENTER_S = 0.35;
const LEAVE_S = 0.2;
const LINKS_S = 0.25;

export type Relayout = {
  /** Bulles qui restent : décalage de l'ancienne place vers la nouvelle, en pixels du monde. */
  moved: { element: HTMLElement; dx: number; dy: number }[];
  entered: HTMLElement[];
  leaving: HTMLElement[];
  links: Element | undefined;
};

/** Lance la transition ; `done` est appelé quand les bulles parties peuvent être retirées. */
export function animateRelayout({ moved, entered, leaving, links }: Relayout, done: () => void) {
  if (reducedMotion()) {
    done();
    return () => {};
  }
  const timeline = gsap.timeline({ onComplete: done });
  for (const { element, dx, dy } of moved) {
    if (dx === 0 && dy === 0) continue;
    timeline.from(
      element,
      { x: dx, y: dy, duration: MOVE_S, ease: 'power3.inOut', clearProps: 'transform' },
      0,
    );
  }
  if (leaving.length > 0) {
    timeline.to(leaving, { opacity: 0, scale: 0.6, duration: LEAVE_S, ease: 'power2.in' }, 0);
  }
  if (entered.length > 0) {
    timeline.from(
      entered,
      {
        opacity: 0,
        scale: 0.6,
        duration: ENTER_S,
        ease: 'back.out(1.6)',
        clearProps: 'opacity,transform',
      },
      MOVE_S * 0.5,
    );
  }
  if (links) {
    timeline.from(links, { opacity: 0, duration: LINKS_S, clearProps: 'opacity' }, MOVE_S * 0.7);
  }
  return () => {
    timeline.progress(1);
    timeline.kill();
  };
}
