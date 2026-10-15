// tdd-cover: e2e tests/e2e/tree-camera.spec.ts
import {
  type Camera,
  type Cover,
  cameraBounds,
  clampCamera,
  flightPath,
  NO_COVER,
  rubberBand,
  type ScaleLimits,
  type Size,
  scaleLimits,
  zoomAt,
} from '@/lib/tree/tree.camera';
import type { Point } from '@/lib/tree/tree.metrics';
import { gsap, reducedMotion } from './gsap';

// Caméra du canevas (ADR 05 : GSAP anime, React rend). L'état vit ici, hors React :
// chaque frame écrit directement la transformation du calque et la position de la
// trame de points, par un seul setter. React n'est prévenu qu'à l'arrêt (`onSettle`).

const FLIGHT_EASE = 'power3.inOut';
const ZOOM_S = 0.35;

export type CameraController = {
  get: () => Camera;
  viewport: () => Size;
  limits: () => ScaleLimits;
  /**
   * Arrête toute animation en cours : le doigt reprend la main. Rend `true` si une
   * animation a été coupée : la caméra est alors arrêtée en route, à relâcher.
   */
  stop: () => boolean;
  /** Pose la caméra ; `elastic` laisse dépasser les bornes avec résistance (geste en cours). */
  set: (camera: Camera, options?: { elastic?: boolean }) => void;
  /** Lâcher d'un geste : inertie (px/s), puis retour élastique dans les bornes. */
  release: (velocity: Point) => void;
  /** Zoom animé autour d'un point de l'écran (compté depuis le centre du canevas). */
  zoomTo: (k: number, around?: Point) => void;
  /** Part du canevas couverte (carte, boutons) : les bornes suivent la zone libre. */
  setCover: (cover: Cover) => void;
  flyTo: (camera: Camera) => void;
  /** Pose la caméra sans animation et conclut le mouvement (nouveau placement). */
  jump: (camera: Camera) => void;
  resize: (viewport: Size) => void;
  /** Nouveau placement : nouvelles bornes, sans remonter la caméra. */
  setContent: (content: Size) => void;
  /** Appelé à chaque frame (mini-carte). */
  subscribe: (listener: (camera: Camera) => void) => () => void;
  dispose: () => void;
};

export function createCamera({
  viewport: viewportElement,
  layer,
  content: initialContent,
  initial,
  onSettle,
}: {
  viewport: HTMLElement;
  layer: HTMLElement;
  content: Size;
  initial: Camera;
  onSettle: (camera: Camera) => void;
}): CameraController {
  let size: Size = { width: viewportElement.clientWidth, height: viewportElement.clientHeight };
  let content = initialContent;
  let limits = scaleLimits(content, size);
  let cover: Cover = NO_COVER;
  // Une caméra retrouvée a pu être prise sur un autre écran : bornée comme les autres.
  const state: Camera = clampCamera(
    { ...initial, k: Math.min(limits.kMax, Math.max(limits.kMin, initial.k)) },
    content,
  );
  const listeners = new Set<(camera: Camera) => void>();
  let tween: gsap.core.Tween | undefined;
  let moving = false;

  const paint = () => {
    layer.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.k})`;
    // Trame (spec 12) : ses points restent fixés au monde, au pas de 46 px.
    viewportElement.style.setProperty('--cam-x', `${size.width / 2 + state.x}px`);
    viewportElement.style.setProperty('--cam-y', `${size.height / 2 + state.y}px`);
    viewportElement.style.setProperty('--cam-k', String(state.k));
    for (const listener of listeners) listener(state);
  };
  // `will-change` le temps du mouvement seulement : gardé, le navigateur figerait le
  // calque à son échelle de départ, et les noms deviendraient flous de près.
  const apply = () => {
    if (!moving) {
      moving = true;
      layer.style.willChange = 'transform';
    }
    paint();
  };
  const assign = (camera: Camera) => {
    state.x = camera.x;
    state.y = camera.y;
    state.k = camera.k;
    apply();
  };
  const settle = () => {
    // Une animation finie n'est plus « en cours » : un tap ensuite n'a rien à conclure.
    tween = undefined;
    moving = false;
    layer.style.willChange = 'auto';
    onSettle({ ...state });
  };
  const stop = () => {
    const interrupted = tween !== undefined || moving;
    tween?.kill();
    tween = undefined;
    return interrupted;
  };
  /** Sans animation quand l'utilisateur la refuse (DESIGN.md, section 10). */
  const instant = (to: Camera) => {
    stop();
    assign(to);
    settle();
  };

  const controller: CameraController = {
    get: () => ({ ...state }),
    viewport: () => size,
    limits: () => limits,
    stop,
    set(camera, { elastic = false } = {}) {
      stop();
      if (!elastic) {
        assign(clampCamera(camera, content, cover));
        return;
      }
      const { xMin, xMax, yMin, yMax } = cameraBounds(content, camera.k, cover);
      assign({
        x: rubberBand(camera.x, xMin, xMax),
        y: rubberBand(camera.y, yMin, yMax),
        k: camera.k,
      });
    },
    release(velocity) {
      if (reducedMotion()) return instant(clampCamera(state, content, cover));
      stop();
      const { xMin, xMax, yMin, yMax } = cameraBounds(content, state.k, cover);
      tween = gsap.to(state, {
        inertia: {
          x: { velocity: velocity.x, min: xMin, max: xMax },
          y: { velocity: velocity.y, min: yMin, max: yMax },
          duration: { min: 0.2, max: 1.2 },
        },
        onUpdate: apply,
        onComplete: settle,
      });
    },
    zoomTo(k, around = { x: 0, y: 0 }) {
      const target = clampCamera(zoomAt(state, around, k, limits), content, cover);
      if (reducedMotion()) return instant(target);
      stop();
      tween = gsap.to(state, {
        ...target,
        duration: ZOOM_S,
        ease: 'power2.out',
        onUpdate: apply,
        onComplete: settle,
      });
    },
    flyTo(camera) {
      const target = clampCamera(camera, content, cover);
      if (reducedMotion()) return instant(target);
      const path = flightPath({ ...state }, target, size);
      stop();
      const progress = { t: 0 };
      tween = gsap.to(progress, {
        t: 1,
        duration: path.duration_s,
        ease: FLIGHT_EASE,
        onUpdate: () => assign(path.at(progress.t)),
        onComplete: settle,
      });
    },
    jump(camera) {
      // Le contenu a pu changer de taille : l'échelle reste dans les nouvelles bornes, sauf
      // une vue déjà plus lointaine (un lien cadré), qu'on ne rapproche pas d'un bond.
      const k = Math.min(limits.kMax, Math.max(Math.min(limits.kMin, state.k), camera.k));
      instant(clampCamera({ ...camera, k }, content, cover));
    },
    setCover(next) {
      cover = next;
      // Les bornes ont bougé (un lien fermé) : une vue restée hors d'elles y glisse
      // maintenant, plutôt que de sauter au premier geste.
      const inside = clampCamera(state, content, cover);
      if (inside.x !== state.x || inside.y !== state.y) controller.flyTo(inside);
    },
    setContent(next) {
      content = next;
      limits = scaleLimits(content, size);
    },
    resize(next) {
      size = next;
      limits = scaleLimits(content, size);
      apply();
      // La zone visible change : la virtualisation doit la connaître.
      settle();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    dispose() {
      stop();
      // Le calque survit à la caméra (remontée sur un nouveau placement).
      layer.style.willChange = 'auto';
      listeners.clear();
    },
  };
  paint();
  return controller;
}
