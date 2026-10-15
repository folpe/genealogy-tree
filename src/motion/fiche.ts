// tdd-cover: e2e tests/e2e/person-panel.spec.ts
import { gsap, REDUCED_FADE_S, reducedMotion } from './gsap';

// Ouverture de la fiche (plan phase 5, lot 4) : sur grand écran, l'avatar part de la bulle
// touchée dans l'arbre et vient se poser dans la fiche (FLIP : on mesure les deux places,
// on pose l'avatar sur la bulle, puis on le relâche) ; le contenu suit en cascade. Sur
// téléphone, la feuille monte déjà (vaul) : la cascade seule. Mouvement réduit : un fondu.

const FLIP_S = 0.5;
const ITEM_S = 0.32;
const STAGGER_S = 0.035;
/** La cascade démarre quand l'avatar a fait une partie du chemin. */
const CASCADE_DELAY_S = 0.12;

/** La bulle de la personne dans le canevas, si on la voit vraiment à l'écran. */
function visibleBubble(personId: string): HTMLElement | undefined {
  const node = document.querySelector<HTMLElement>(`[data-person="${CSS.escape(personId)}"]`);
  const bubble = node?.querySelector<HTMLElement>('[data-bubble]');
  if (!node || !bubble) return undefined;
  // L'entrée de l'arbre, une branche estompée : la bulle n'est pas une origine crédible.
  if (Number(getComputedStyle(node).opacity) < 0.5) return undefined;
  const rect = bubble.getBoundingClientRect();
  const inView =
    rect.width > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth;
  return inView ? bubble : undefined;
}

/**
 * Joue l'ouverture de la fiche rendue dans `panel` ; rend de quoi l'arrêter (fiche
 * suivante, fermeture). `flip` : l'avatar vient de la bulle quand elle est à l'écran.
 */
export function animateFicheOpen(
  panel: HTMLElement,
  { personId, flip }: { personId: string; flip: boolean },
): () => void {
  const avatar = panel.querySelector<HTMLElement>('[data-fiche-avatar]');
  if (reducedMotion()) {
    const fade = gsap.from(panel, { opacity: 0, duration: REDUCED_FADE_S, clearProps: 'opacity' });
    return () => fade.kill();
  }
  const source = flip && avatar ? visibleBubble(personId) : undefined;
  // Chaque élément une fois : ni un bloc qui contient lui-même une cascade (ses éléments
  // arrivent un par un), ni l'avatar quand il a son propre trajet depuis la bulle.
  const items = [...panel.querySelectorAll<HTMLElement>('[data-cascade] > *')].filter(
    (item) => !item.querySelector('[data-cascade]') && !(source && item === avatar),
  );
  const timeline = gsap.timeline();
  if (avatar && source) {
    const from = source.getBoundingClientRect();
    const to = avatar.getBoundingClientRect();
    timeline.from(
      avatar,
      {
        x: from.left + from.width / 2 - (to.left + to.width / 2),
        y: from.top + from.height / 2 - (to.top + to.height / 2),
        scale: from.width / to.width,
        duration: FLIP_S,
        ease: 'power3.inOut',
        clearProps: 'transform',
      },
      0,
    );
  }
  timeline.from(
    items,
    {
      opacity: 0,
      y: 10,
      duration: ITEM_S,
      stagger: STAGGER_S,
      ease: 'power2.out',
      clearProps: 'opacity,transform',
    },
    source ? CASCADE_DELAY_S : 0,
  );
  return () => {
    timeline.progress(1);
    timeline.kill();
  };
}
