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
    return () => {
      fade.progress(1);
      fade.kill();
    };
  }
  const source = flip && avatar ? visibleBubble(personId) : undefined;
  // Chaque élément une fois : ni un bloc qui est ou contient lui-même une cascade (ses
  // éléments arrivent un par un), ni l'avatar quand il a son propre trajet.
  const items = [...panel.querySelectorAll<HTMLElement>('[data-cascade] > *')].filter(
    (item) =>
      !item.matches('[data-cascade]') &&
      !item.querySelector('[data-cascade]') &&
      !(source && item === avatar),
  );
  const timeline = gsap.timeline();
  const flight = avatar && source ? flyFrom(source, avatar, timeline) : undefined;
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
    flight?.();
  };
}

/**
 * Le trajet de l'avatar se fait sur une copie posée au-dessus de la page : le panneau
 * défile, il couperait tout ce qui dépasse de sa boîte. L'avatar réel attend, invisible,
 * puis prend la place de sa copie à l'arrivée. Rend de quoi tout remettre en ordre.
 */
function flyFrom(source: HTMLElement, avatar: HTMLElement, timeline: gsap.core.Timeline) {
  const from = source.getBoundingClientRect();
  const to = avatar.getBoundingClientRect();
  const copy = avatar.cloneNode(true);
  if (!(copy instanceof HTMLElement)) return undefined;
  copy.removeAttribute('data-fiche-avatar');
  copy.setAttribute('data-fiche-flight', '');
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  Object.assign(copy.style, {
    position: 'fixed',
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
    margin: '0',
    zIndex: '60',
    pointerEvents: 'none',
  });
  document.body.append(copy);
  avatar.style.visibility = 'hidden';
  const land = () => {
    copy.remove();
    avatar.style.removeProperty('visibility');
  };
  timeline.from(
    copy,
    {
      x: from.left + from.width / 2 - (to.left + to.width / 2),
      y: from.top + from.height / 2 - (to.top + to.height / 2),
      scale: from.width / to.width,
      duration: FLIP_S,
      ease: 'power3.inOut',
      onComplete: land,
    },
    0,
  );
  return land;
}
