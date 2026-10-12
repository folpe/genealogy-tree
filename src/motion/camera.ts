// tdd-cover: e2e tests/e2e/tree-camera.spec.ts
import gsap from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import {
  type Camera,
  cameraBounds,
  clampCamera,
  flightPath,
  rubberBand,
  type ScaleLimits,
  type Size,
  scaleLimits,
  zoomAt,
} from '@/lib/tree/tree.camera';
import type { Point } from '@/lib/tree/tree.layout';

gsap.registerPlugin(InertiaPlugin);

// Caméra du canevas (ADR 05 : GSAP anime, React rend). L'état vit ici, hors React :
// chaque frame écrit directement la transformation du calque et la position de la
// trame de points, par un seul setter. React n'est prévenu qu'à l'arrêt (`onSettle`).

const FLIGHT_EASE = 'power3.inOut';
const ZOOM_S = 0.35;

export type CameraController = {
  get: () => Camera;
  viewport: () => Size;
  limits: () => ScaleLimits;
  /** Arrête toute animation en cours : le doigt reprend la main. */
  stop: () => void;
  /** Pose la caméra ; `elastic` laisse dépasser les bornes avec résistance (geste en cours). */
  set: (camera: Camera, options?: { elastic?: boolean }) => void;
  /** Lâcher d'un geste : inertie (px/s), puis retour élastique dans les bornes. */
  release: (velocity: Point) => void;
  /** Zoom animé autour d'un point de l'écran (compté depuis le centre du canevas). */
  zoomTo: (k: number, around?: Point) => void;
  flyTo: (camera: Camera) => void;
  resize: (viewport: Size) => void;
  /** Appelé à chaque frame (mini-carte). */
  subscribe: (listener: (camera: Camera) => void) => () => void;
  dispose: () => void;
};

export function createCamera({
  viewport: viewportElement,
  layer,
  content,
  initial,
  onSettle,
}: {
  viewport: HTMLElement;
  layer: HTMLElement;
  content: Size;
  initial: Camera;
  onSettle: (camera: Camera) => void;
}): CameraController {
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let size: Size = { width: viewportElement.clientWidth, height: viewportElement.clientHeight };
  let limits = scaleLimits(content, size);
  const state: Camera = { ...initial };
  const listeners = new Set<(camera: Camera) => void>();
  let tween: gsap.core.Tween | undefined;

  const apply = () => {
    layer.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.k})`;
    // Trame (spec 12) : ses points restent fixés au monde, au pas de 46 px.
    viewportElement.style.setProperty('--cam-x', `${size.width / 2 + state.x}px`);
    viewportElement.style.setProperty('--cam-y', `${size.height / 2 + state.y}px`);
    viewportElement.style.setProperty('--cam-k', String(state.k));
    for (const listener of listeners) listener(state);
  };
  const assign = (camera: Camera) => {
    state.x = camera.x;
    state.y = camera.y;
    state.k = camera.k;
    apply();
  };
  const settle = () => onSettle({ ...state });
  const stop = () => {
    tween?.kill();
    tween = undefined;
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
        assign(clampCamera(camera, content));
        return;
      }
      const { xMin, xMax, yMin, yMax } = cameraBounds(content, camera.k);
      assign({
        x: rubberBand(camera.x, xMin, xMax),
        y: rubberBand(camera.y, yMin, yMax),
        k: camera.k,
      });
    },
    release(velocity) {
      if (reducedMotion()) return instant(clampCamera(state, content));
      stop();
      const { xMin, xMax, yMin, yMax } = cameraBounds(content, state.k);
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
      const target = clampCamera(zoomAt(state, around, k, limits), content);
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
      const target = clampCamera(camera, content);
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
      listeners.clear();
    },
  };
  apply();
  return controller;
}
