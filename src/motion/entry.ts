// tdd-cover: e2e tests/e2e/tree.spec.ts
import type { EntryWaves } from '@/lib/tree/tree.entry';
import { gsap, REDUCED_FADE_S, reducedMotion } from './gsap';

// L'arbre pousse au premier affichage de l'onglet (DESIGN.md, section 10) : génération
// après génération, du haut vers le bas, les bulles arrivent en échelle et en fondu et
// leurs traits se tracent (DrawSVG). Avec le mouvement réduit, un simple fondu. Rien
// n'attend la fin : les gestes et les taps restent possibles pendant l'entrée.

/** Une génération après l'autre : la branche arrive pendant que la bulle s'ouvre. */
const ROW_S = 0.24;
const BUBBLE_S = 0.35;
const BUBBLE_STAGGER_S = 0.04;
/** Une génération nombreuse n'étire pas l'entrée : sa cascade tient dans ce temps. */
const ROW_SPREAD_MAX_S = 0.3;
const LINK_S = 0.36;
const LINK_DELAY_S = 0.08;
const EASE = 'power2.out';

/**
 * `bubbles` : les bulles rendues, par identifiant ; `layer` : le calque qui porte traits
 * et poignées ; `fromRow` : la première génération à l'écran, d'où part la pousse (celles
 * du dessus, hors de la vue, sont posées d'emblée).
 */
export function animateTreeEntry(
  waves: EntryWaves,
  bubbles: ReadonlyMap<string, HTMLElement>,
  layer: HTMLElement | undefined,
  fromRow = 0,
): () => void {
  const at = (row: number) => Math.max(0, row - fromRow) * ROW_S;
  const present = (ids: string[]) => ids.flatMap((id) => bubbles.get(id) ?? []);
  if (reducedMotion()) {
    const tween = gsap.from([...bubbles.values()], {
      opacity: 0,
      duration: REDUCED_FADE_S,
      clearProps: 'opacity',
    });
    return () => {
      tween.progress(1).kill();
    };
  }
  const drawn: SVGElement[] = [];
  // Ce que l'entrée écrit hors de ses tweens, effacé à la fin : traits et bulles reprennent
  // leur style.
  const release = () => {
    for (const path of drawn) {
      path.style.removeProperty('stroke-dasharray');
      path.style.removeProperty('stroke-dashoffset');
    }
    for (const bubble of bubbles.values()) bubble.style.removeProperty('transition');
  };
  const timeline = gsap.timeline({ onComplete: release });
  // La transition CSS d'opacité des bulles (estompage d'un lien) doublerait le fondu.
  timeline.set([...bubbles.values()], { transition: 'none' }, 0);
  waves.persons.forEach((ids, row) => {
    const elements = present(ids);
    if (elements.length === 0) return;
    const each = Math.min(BUBBLE_STAGGER_S, ROW_SPREAD_MAX_S / elements.length);
    timeline.from(
      elements,
      {
        opacity: 0,
        scale: 0.85,
        transformOrigin: '50% 0%',
        duration: BUBBLE_S,
        stagger: each,
        ease: EASE,
        clearProps: 'opacity,transform,transition',
      },
      at(row),
    );
  });
  waves.links.forEach((ids, row) => {
    for (const id of ids) {
      const path = layer?.querySelector<SVGElement>(`[data-link="${CSS.escape(id)}"]`);
      if (!path) continue;
      drawn.push(path);
      timeline.fromTo(
        path,
        { drawSVG: '0% 0%' },
        { drawSVG: '0% 100%', duration: LINK_S, ease: EASE },
        at(row) + LINK_DELAY_S,
      );
    }
  });
  waves.handles.forEach((ids, row) => {
    const elements = ids.flatMap(
      (id) => layer?.querySelector<HTMLElement>(`[data-branch="${CSS.escape(id)}"]`) ?? [],
    );
    if (elements.length === 0) return;
    timeline.from(
      elements,
      // En fondu seul : leur taille suit déjà le zoom par les propriétés `scale` et `translate`.
      { opacity: 0, duration: BUBBLE_S, ease: EASE, clearProps: 'opacity' },
      at(row) + LINK_DELAY_S,
    );
  });
  return () => {
    timeline.progress(1).kill();
    release();
  };
}
