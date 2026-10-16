// tdd-cover: e2e tests/e2e/tree-camera.spec.ts
import { type Camera, zoomAt } from '@/lib/tree/tree.camera';
import type { Point } from '@/lib/tree/tree.metrics';
import type { CameraController } from './camera';

// Gestes du canevas, en Pointer Events unifiés (souris, stylet, doigts) : un pointeur
// déplace, deux pincent. La molette déplace, Ctrl ou ⌘ + molette zoome (c'est aussi
// ce qu'envoie le pincement d'un trackpad sous Chrome et Firefox). Safari envoie ses
// propres `gesture*` : ils sont pris ici, et bloqués pour ne pas zoomer la page.

/** Au-delà de ce déplacement, un appui devient un glissé et n'ouvre plus de fiche. */
const DRAG_PX = 4;
const VELOCITY_WINDOW_MS = 100;
/** Élan maximal au lâcher : deux événements trop rapprochés ne doivent pas projeter l'arbre. */
const VELOCITY_MAX = 3000;
const WHEEL_ZOOM_SPEED = 0.01;
const WHEEL_SETTLE_MS = 150;
/**
 * Après un glissé, le click que le navigateur envoie encore est avalé : celui de la
 * souris, et celui du doigt, dont le seuil de tap (8 à 10 px) dépasse `DRAG_PX`. Il
 * arrive aussitôt après le lâcher ; passé ce délai, plus rien n'est avalé.
 */
const SWALLOW_CLICK_MS = 400;
const LINE_PX = 16;

type Sample = { t: number; p: Point };
/** `GestureEvent` de Safari, absent des types du DOM. */
type GestureEvent = Event & { scale: number; clientX: number; clientY: number };

const isGesture = (event: Event): event is GestureEvent =>
  'scale' in event && typeof event.scale === 'number' && 'clientX' in event;

export function bindCameraGestures(viewport: HTMLElement, camera: CameraController): () => void {
  const pointers = new Map<number, Point>();
  let start: { camera: Camera; point: Point; distance: number } | undefined;
  let dragging = false;
  let swallowClick = false;
  /** Le premier appui a coupé une animation : la caméra est arrêtée en route. */
  let interrupted = false;
  let samples: Sample[] = [];
  let wheelTimer: ReturnType<typeof setTimeout> | undefined;
  let swallowTimer: ReturnType<typeof setTimeout> | undefined;
  let safari: { camera: Camera; point: Point } | undefined;
  const cleanups: (() => void)[] = [];

  const on = <K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => {
    viewport.addEventListener(type, listener, options);
    cleanups.push(() => viewport.removeEventListener(type, listener, options));
  };
  const onGesture = (type: string, listener: (event: GestureEvent) => void) => {
    const guarded = (event: Event) => {
      event.preventDefault();
      if (isGesture(event)) listener(event);
    };
    viewport.addEventListener(type, guarded);
    cleanups.push(() => viewport.removeEventListener(type, guarded));
  };

  /** Le click d'après un glissé n'est plus attendu : aucun autre n'est avalé. */
  const stopSwallowing = () => {
    swallowClick = false;
    clearTimeout(swallowTimer);
  };

  /** Position comptée depuis le centre du canevas, comme la caméra. */
  const local = (clientX: number, clientY: number): Point => {
    const box = viewport.getBoundingClientRect();
    return { x: clientX - box.left - box.width / 2, y: clientY - box.top - box.height / 2 };
  };
  const midpoint = () => {
    const [a, b] = [...pointers.values()];
    if (!a || !b) return { point: a ?? { x: 0, y: 0 }, distance: 0 };
    return {
      point: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.hypot(a.x - b.x, a.y - b.y),
    };
  };
  /** (Re)part de l'état présent : un doigt qui se lève ne fait pas sauter la caméra. */
  const begin = () => {
    const { point, distance } = midpoint();
    start = { camera: camera.get(), point, distance };
    samples = [{ t: performance.now(), p: point }];
  };
  const velocity = (): Point => {
    const now = performance.now();
    const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS);
    const first = recent[0];
    const last = recent.at(-1);
    if (!first || !last || last.t === first.t) return { x: 0, y: 0 };
    const seconds = (last.t - first.t) / 1000;
    const vx = (last.p.x - first.p.x) / seconds;
    const vy = (last.p.y - first.p.y) / seconds;
    const speed = Math.hypot(vx, vy);
    const cap = speed > VELOCITY_MAX ? VELOCITY_MAX / speed : 1;
    return { x: vx * cap, y: vy * cap };
  };

  on('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (pointers.size >= 2) return;
    // Un nouvel appui repart à zéro : le premier tap après un glissé n'est pas avalé.
    stopSwallowing();
    if (camera.stop() && pointers.size === 0) interrupted = true;
    pointers.set(event.pointerId, local(event.clientX, event.clientY));
    if (pointers.size === 1) dragging = false;
    begin();
  });

  on('pointermove', (event) => {
    if (!pointers.has(event.pointerId) || !start) return;
    pointers.set(event.pointerId, local(event.clientX, event.clientY));
    const { point, distance } = midpoint();
    const dx = point.x - start.point.x;
    const dy = point.y - start.point.y;
    if (!dragging && pointers.size === 1 && Math.hypot(dx, dy) < DRAG_PX) return;
    if (!dragging) {
      dragging = true;
      // Capturé seulement une fois le glissé reconnu : un simple clic garde sa cible.
      // Un doigt est déjà capturé d'office par l'élément qu'il a touché.
      if (event.pointerType !== 'touch') viewport.setPointerCapture(event.pointerId);
    }
    samples.push({ t: performance.now(), p: point });
    const pinched =
      pointers.size === 2 && start.distance > 0
        ? zoomAt(
            start.camera,
            start.point,
            (start.camera.k * distance) / start.distance,
            camera.limits(),
          )
        : start.camera;
    camera.set({ x: pinched.x + dx, y: pinched.y + dy, k: pinched.k }, { elastic: true });
  });

  const lift = (event: PointerEvent) => {
    if (!pointers.delete(event.pointerId)) return;
    if (pointers.size > 0) {
      begin();
      return;
    }
    if (!dragging) {
      // Un tap a coupé un vol, un zoom ou un retour élastique : on relâche sur place,
      // pour revenir dans les bornes et finir le mouvement (texte net, bulles à jour).
      if (interrupted) camera.release({ x: 0, y: 0 });
      interrupted = false;
      return;
    }
    interrupted = false;
    // Après un pincement, pas d'élan : seulement le retour dans les bornes.
    camera.release(start && start.distance > 0 ? { x: 0, y: 0 } : velocity());
    // Le click qui suit peut-être le glissé, borné dans le temps : s'il ne vient pas (doigt
    // au-delà du seuil de tap), le drapeau ne reste pas levé pour un click plus tardif.
    swallowClick = true;
    clearTimeout(swallowTimer);
    swallowTimer = setTimeout(stopSwallowing, SWALLOW_CLICK_MS);
    dragging = false;
    start = undefined;
  };
  on('pointerup', lift);
  on('pointercancel', lift);
  // Une touche (Entrée sur une bulle) vient du clavier : son click n'est jamais avalé.
  on('keydown', stopSwallowing, { capture: true });

  on(
    'click',
    (event) => {
      if (!swallowClick) return;
      stopSwallowing();
      event.preventDefault();
      event.stopPropagation();
    },
    { capture: true },
  );

  on(
    'wheel',
    (event) => {
      event.preventDefault();
      const unit =
        event.deltaMode === 1 ? LINE_PX : event.deltaMode === 2 ? viewport.clientHeight : 1;
      const current = camera.get();
      if (event.ctrlKey || event.metaKey) {
        const k = current.k * Math.exp(-event.deltaY * unit * WHEEL_ZOOM_SPEED);
        camera.set(zoomAt(current, local(event.clientX, event.clientY), k, camera.limits()));
      } else {
        camera.set({
          x: current.x - event.deltaX * unit,
          y: current.y - event.deltaY * unit,
          k: current.k,
        });
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => camera.release({ x: 0, y: 0 }), WHEEL_SETTLE_MS);
    },
    { passive: false },
  );

  // Sur iOS, deux doigts passent déjà par les Pointer Events : seul le trackpad de
  // Safari sur Mac arrive ici sans pointeur.
  onGesture('gesturestart', (event) => {
    if (pointers.size < 2) {
      safari = { camera: camera.get(), point: local(event.clientX, event.clientY) };
    }
  });
  onGesture('gesturechange', (event) => {
    if (!safari || pointers.size >= 2) return;
    camera.set(zoomAt(safari.camera, safari.point, safari.camera.k * event.scale, camera.limits()));
  });
  onGesture('gestureend', () => {
    // Un doigt encore posé garde la main : sa propre levée relâchera la caméra.
    if (!safari || pointers.size > 0) return;
    safari = undefined;
    camera.release({ x: 0, y: 0 });
  });

  // Glisser une photo ou un lien lancerait le glisser-déposer natif, qui annule le geste.
  on('dragstart', (event) => event.preventDefault());

  on('dblclick', (event) => {
    if (event.target instanceof Element && event.target.closest('[role="treeitem"]')) return;
    camera.zoomTo(camera.get().k * 2, local(event.clientX, event.clientY));
  });

  return () => {
    clearTimeout(wheelTimer);
    clearTimeout(swallowTimer);
    for (const cleanup of cleanups) cleanup();
  };
}
