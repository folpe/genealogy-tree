import { type Camera, cameraOn, worldAt } from './tree.camera';
import type { Point } from './tree.metrics';

// Retrouver l'arbre comme on l'a laissé, au retour d'une fiche. On retient la bulle
// la plus proche du centre de l'écran et l'écart à elle, plutôt que des coordonnées :
// la position reste juste si le placement a changé entre-temps (données mises à
// jour, branches repliées autrement).

export type TreeMemory = {
  anchorId: string;
  /** Centre de l'écran moins la bulle repère, en pixels du monde. */
  dx: number;
  dy: number;
  k: number;
  /** Branches pliées. */
  folded: string[];
  /** Vue où la position a été prise (son URL) : elle ne revient que dans cette vue. */
  view: string;
};

export function rememberCamera(
  camera: Camera,
  nodes: (Point & { id: string })[],
  folded: string[],
  view: string,
): TreeMemory | undefined {
  const center = worldAt(camera, { x: 0, y: 0 });
  let anchor: (Point & { id: string }) | undefined;
  let best = Number.POSITIVE_INFINITY;
  for (const node of nodes) {
    const distance = Math.hypot(node.x - center.x, node.y - center.y);
    if (distance < best) {
      best = distance;
      anchor = node;
    }
  }
  if (!anchor) return undefined;
  return {
    anchorId: anchor.id,
    dx: center.x - anchor.x,
    dy: center.y - anchor.y,
    k: camera.k,
    folded,
    view,
  };
}

export function recallCamera(
  memory: TreeMemory,
  nodes: (Point & { id: string })[],
): Camera | undefined {
  const anchor = nodes.find((n) => n.id === memory.anchorId);
  if (!anchor) return undefined;
  return cameraOn({ x: anchor.x + memory.dx, y: anchor.y + memory.dy }, memory.k);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null; // allow-null: typeof null vaut 'object'

/** Relit la mémoire rangée dans le navigateur ; tout ce qui n'a pas sa forme est ignoré. */
export function parseMemory(raw: string | undefined): TreeMemory | undefined {
  if (!raw) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  const { anchorId, dx, dy, k, folded, view } = value;
  if (typeof anchorId !== 'string' || typeof view !== 'string') return undefined;
  if (![dx, dy, k].every((n) => typeof n === 'number' && Number.isFinite(n))) return undefined;
  if (typeof k !== 'number' || k <= 0 || typeof dx !== 'number' || typeof dy !== 'number') {
    return undefined;
  }
  if (!Array.isArray(folded) || !folded.every((key) => typeof key === 'string')) return undefined;
  return { anchorId, dx, dy, k, folded, view };
}
