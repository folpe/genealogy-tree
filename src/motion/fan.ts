// tdd-cover: e2e tests/e2e/fan.spec.ts
import gsap from 'gsap';

// Entrée de l'éventail (DESIGN.md, section 10) : les anneaux se déploient depuis le
// centre, l'un après l'autre. Avec les mouvements réduits, un simple fondu.

const RING_S = 0.5;
const STAGGER_S = 0.08;
const FADE_S = 0.15;

/** `origin` : le centre de l'éventail, en coordonnées du SVG (« x y »). */
export function animateFanEntry(rings: SVGGElement[], origin: string): () => void {
  if (rings.length === 0) return () => {};
  const tween = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? gsap.from(rings, { opacity: 0, duration: FADE_S, clearProps: 'opacity' })
    : gsap.from(rings, {
        opacity: 0,
        scale: 0.7,
        rotation: -12,
        svgOrigin: origin,
        duration: RING_S,
        stagger: STAGGER_S,
        ease: 'back.out(1.2)',
        clearProps: 'transform,opacity',
      });
  return () => {
    tween.progress(1).kill();
  };
}
