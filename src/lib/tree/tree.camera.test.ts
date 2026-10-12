import { describe, expect, it } from 'vitest';
import {
  cameraBounds,
  cameraOn,
  clampCamera,
  flightPath,
  nodesInView,
  rubberBand,
  scaleLimits,
  VIRTUALIZE_ABOVE,
  visibleWorld,
  worldAt,
  zoomAt,
} from './tree.camera';

const viewport = { width: 800, height: 600 };
const content = { width: 2000, height: 1000 };

describe('cameraOn / worldAt', () => {
  it('met un point du monde au centre du canevas', () => {
    const camera = cameraOn({ x: 300, y: 200 }, 2);
    expect(camera).toEqual({ x: -600, y: -400, k: 2 });
    expect(worldAt(camera, { x: 0, y: 0 })).toEqual({ x: 300, y: 200 });
  });
});

describe('zoomAt', () => {
  it('garde sous le doigt le point qu’il désigne', () => {
    const camera = cameraOn({ x: 300, y: 200 }, 1);
    const finger = { x: 100, y: -50 };
    const before = worldAt(camera, finger);
    const zoomed = zoomAt(camera, finger, 2.5, { kMin: 0.2, kMax: 3 });
    expect(zoomed.k).toBe(2.5);
    expect(worldAt(zoomed, finger)).toEqual(before);
  });

  it('borne l’échelle', () => {
    const camera = cameraOn({ x: 0, y: 0 }, 1);
    expect(zoomAt(camera, { x: 0, y: 0 }, 10, { kMin: 0.2, kMax: 3 }).k).toBe(3);
    expect(zoomAt(camera, { x: 0, y: 0 }, 0.01, { kMin: 0.2, kMax: 3 }).k).toBe(0.2);
  });
});

describe('bornes', () => {
  it('le centre du canevas reste au-dessus du placement', () => {
    expect(cameraBounds(content, 0.5)).toEqual({ xMin: -1000, xMax: 0, yMin: -500, yMax: 0 });
    expect(clampCamera({ x: 100, y: -900, k: 0.5 }, content)).toEqual({ x: 0, y: -500, k: 0.5 });
  });

  it('résiste au-delà d’une borne sans jamais dépasser l’élasticité', () => {
    expect(rubberBand(50, 0, 100)).toBe(50);
    const beyond = rubberBand(160, 0, 100);
    expect(beyond).toBeGreaterThan(100);
    expect(beyond).toBeLessThan(160);
    expect(rubberBand(10_000, 0, 100)).toBeLessThan(100 + 120);
    expect(rubberBand(-60, 0, 100)).toBeLessThan(0);
    expect(rubberBand(-60, 0, 100)).toBeGreaterThan(-60);
  });
});

describe('scaleLimits', () => {
  it('dézoome au plus jusqu’à voir tout l’arbre, zoome jusqu’à 2,5', () => {
    const { kMin, kMax } = scaleLimits(content, viewport);
    expect(kMin).toBeLessThan(0.4);
    expect(content.width * kMin).toBeLessThanOrEqual(viewport.width);
    expect(kMax).toBe(2.5);
  });

  it('un petit arbre se dézoome quand même jusqu’à la moitié', () => {
    expect(scaleLimits({ width: 100, height: 100 }, viewport).kMin).toBe(0.5);
  });
});

describe('visibleWorld', () => {
  it('rend le rectangle du monde à l’écran', () => {
    expect(visibleWorld(cameraOn({ x: 500, y: 300 }, 2), viewport)).toEqual({
      x0: 300,
      y0: 150,
      x1: 700,
      y1: 450,
    });
  });
});

describe('flightPath', () => {
  it('part de la caméra actuelle et arrive sur la cible', () => {
    const from = cameraOn({ x: 0, y: 0 }, 1);
    const to = cameraOn({ x: 1500, y: 800 }, 1);
    const path = flightPath(from, to, viewport);
    expect(path.at(0)).toEqual(from);
    const end = path.at(1);
    expect(end.x).toBeCloseTo(to.x);
    expect(end.y).toBeCloseTo(to.y);
    expect(end.k).toBeCloseTo(1);
  });

  it('dure plus longtemps pour aller plus loin, dans des limites', () => {
    const from = cameraOn({ x: 0, y: 0 }, 1);
    const near = flightPath(from, cameraOn({ x: 100, y: 0 }, 1), viewport).duration_s;
    const far = flightPath(from, cameraOn({ x: 5000, y: 0 }, 1), viewport).duration_s;
    expect(near).toBeLessThan(far);
    expect(near).toBeGreaterThanOrEqual(0.35);
    expect(far).toBeLessThanOrEqual(1.2);
  });
});

describe('nodesInView', () => {
  const grid = Array.from({ length: VIRTUALIZE_ABOVE + 1 }, (_, i) => ({
    id: `n${i}`,
    x: (i % 20) * 200,
    y: Math.floor(i / 20) * 200,
  }));
  const rect = { x0: 0, y0: 0, x1: 400, y1: 400 };

  it('rend tout tant que l’arbre reste petit', () => {
    const few = grid.slice(0, VIRTUALIZE_ABOVE);
    expect(nodesInView(few, rect, [])).toBe(few);
  });

  it('au-delà, seulement les bulles proches de l’écran, plus celles qu’on garde', () => {
    const shown = nodesInView(grid, rect, ['n300']);
    expect(shown.length).toBeLessThan(grid.length);
    expect(shown.map((n) => n.id)).toContain('n0');
    expect(shown.map((n) => n.id)).toContain('n300');
    expect(shown.map((n) => n.id)).not.toContain('n19');
  });
});
