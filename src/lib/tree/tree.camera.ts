import { interpolateZoom } from 'd3-interpolate';
import type { Point } from './tree.metrics';

// Géométrie de la caméra du canevas (plan phase 4, lot 4), sans DOM ni animation.
// Un point du monde (le placement) apparaît à l'écran en `monde * k + (x, y)`, à
// compter du centre du canevas : centrer, zoomer ou borner restent des calculs
// simples, quelle que soit la taille de l'écran.

export type Camera = { x: number; y: number; k: number };
export type Size = { width: number; height: number };
export type ScaleLimits = { kMin: number; kMax: number };
export type Rect = { x0: number; y0: number; x1: number; y1: number };

const K_MAX = 2.5;
/** On peut toujours dézoomer au moins jusqu'à la moitié, même sur un petit arbre. */
const K_MIN_CEILING = 0.5;
const FIT_PADDING = 48;
/** Dépassement maximal, en pixels d'écran, quand on tire au-delà d'une borne. */
const ELASTIC_SPAN = 120;
const FLIGHT_S_MIN = 0.35;
const FLIGHT_S_MAX = 1.2;
/** Sous cette échelle, l'arbre se lit de loin : des points, sans texte (plan, lot 5). */
export const DETAIL_FAR_BELOW = 0.45;
/** À partir de cette échelle, on lit tout : nom complet et années. */
export const DETAIL_NEAR_FROM = 1.4;

export type DetailLevel = 'far' | 'mid' | 'near';

/**
 * Zoom sémantique : ce que montre une bulle selon l'échelle. Les échelles de départ
 * (0,75 et 1) restent au niveau moyen, celui que rend le serveur.
 */
export function detailLevel(k: number): DetailLevel {
  if (k < DETAIL_FAR_BELOW) return 'far';
  if (k >= DETAIL_NEAR_FROM) return 'near';
  return 'mid';
}

/** Au-delà, seules les bulles proches de l'écran sont rendues (plan, lot 3). */
export const VIRTUALIZE_ABOVE = 300;

export const cameraOn = (point: Point, k: number): Camera => ({
  x: -point.x * k,
  y: -point.y * k,
  k,
});

/** Lecture confortable : un cadrage ne grossit pas au-delà. */
const FRAMING_K_MAX = 1.2;

/**
 * Caméra qui montre toute une zone du monde, avec une marge (« Notre lien »). `top` :
 * hauteur couverte en haut de l'écran (une carte posée sur le canevas) ; la zone se
 * centre dans ce qui reste.
 */
export function cameraFraming(
  rect: Rect,
  viewport: Size,
  limits: ScaleLimits,
  { top = 0 }: { top?: number } = {},
): Camera {
  const width = rect.x1 - rect.x0 + 2 * FIT_PADDING;
  const height = rect.y1 - rect.y0 + 2 * FIT_PADDING;
  const free = Math.max(1, viewport.height - top);
  const fit = Math.min(viewport.width / width, free / height);
  const k = Math.max(limits.kMin, Math.min(fit, FRAMING_K_MAX, limits.kMax));
  const centered = cameraOn({ x: (rect.x0 + rect.x1) / 2, y: (rect.y0 + rect.y1) / 2 }, k);
  return { ...centered, y: centered.y + top / 2 };
}

/** Point du monde sous un point de l'écran (compté depuis le centre du canevas). */
export const worldAt = (camera: Camera, screen: Point): Point => ({
  x: (screen.x - camera.x) / camera.k,
  y: (screen.y - camera.y) / camera.k,
});

export function zoomAt(camera: Camera, screen: Point, k: number, limits: ScaleLimits): Camera {
  const next = Math.min(limits.kMax, Math.max(limits.kMin, k));
  const world = worldAt(camera, screen);
  return { x: screen.x - world.x * next, y: screen.y - world.y * next, k: next };
}

/** Le centre du canevas reste au-dessus du placement : on ne perd jamais l'arbre. */
export const cameraBounds = (content: Size, k: number) => ({
  xMin: -content.width * k,
  xMax: 0,
  yMin: -content.height * k,
  yMax: 0,
});

export function clampCamera(camera: Camera, content: Size): Camera {
  const { xMin, xMax, yMin, yMax } = cameraBounds(content, camera.k);
  return {
    x: Math.min(xMax, Math.max(xMin, camera.x)),
    y: Math.min(yMax, Math.max(yMin, camera.y)),
    k: camera.k,
  };
}

/** Au-delà d'une borne, le canevas suit de moins en moins le doigt (effet élastique). */
export function rubberBand(value: number, min: number, max: number): number {
  const resist = (excess: number) => ELASTIC_SPAN * (1 - 1 / (excess / ELASTIC_SPAN + 1));
  if (value < min) return min - resist(min - value);
  if (value > max) return max + resist(value - max);
  return value;
}

export function scaleLimits(content: Size, viewport: Size): ScaleLimits {
  const fit = Math.min(
    viewport.width / (content.width + FIT_PADDING * 2),
    viewport.height / (content.height + FIT_PADDING * 2),
  );
  return { kMin: Math.min(K_MIN_CEILING, fit), kMax: K_MAX };
}

export function visibleWorld(camera: Camera, viewport: Size): Rect {
  const topLeft = worldAt(camera, { x: -viewport.width / 2, y: -viewport.height / 2 });
  const bottomRight = worldAt(camera, { x: viewport.width / 2, y: viewport.height / 2 });
  return { x0: topLeft.x, y0: topLeft.y, x1: bottomRight.x, y1: bottomRight.y };
}

/**
 * Vol de caméra sur la trajectoire de van Wijk et Nuij (`d3.interpolateZoom`) : on
 * dézoome pour voyager loin, puis on revient. Durée proportionnelle au trajet.
 */
export function flightPath(from: Camera, to: Camera, viewport: Size) {
  const view = (camera: Camera): [number, number, number] => [
    -camera.x / camera.k,
    -camera.y / camera.k,
    viewport.width / camera.k,
  ];
  const interpolate = interpolateZoom(view(from), view(to));
  const at = (t: number): Camera => {
    if (t <= 0) return from;
    const [cx, cy, width] = interpolate(t);
    return cameraOn({ x: cx, y: cy }, viewport.width / width);
  };
  const duration_s = Math.min(
    FLIGHT_S_MAX,
    Math.max(FLIGHT_S_MIN, (interpolate.duration / 1000) * 0.6),
  );
  return { at, duration_s };
}

/**
 * Bulles à rendre : toutes sous le seuil ; au-delà, celles à moins d'un écran du
 * bord visible, plus celles qu'on doit garder (la bulle au clavier).
 */
export function nodesInView<T extends Point & { id: string }>(
  nodes: T[],
  rect: Rect,
  keep: string[],
): T[] {
  if (nodes.length <= VIRTUALIZE_ABOVE) return nodes;
  const marginX = rect.x1 - rect.x0;
  const marginY = rect.y1 - rect.y0;
  const kept = new Set(keep);
  return nodes.filter(
    (n) =>
      kept.has(n.id) ||
      (n.x >= rect.x0 - marginX &&
        n.x <= rect.x1 + marginX &&
        n.y >= rect.y0 - marginY &&
        n.y <= rect.y1 + marginY),
  );
}
