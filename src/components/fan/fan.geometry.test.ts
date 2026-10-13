import { describe, expect, it } from 'vitest';
import { fanLayout, sectorAngles, sectorLabel, sectorPath } from './fan.geometry';

describe('fanLayout', () => {
  it('empile les anneaux sans trou autour du cercle central', () => {
    const layout = fanLayout(4);
    expect(layout.rings).toHaveLength(4);
    for (const [i, [inner, outer]] of layout.rings.entries()) {
      expect(outer).toBeGreaterThan(inner);
      if (i > 0) expect(inner).toBe(layout.rings[i - 1]?.[1]);
    }
    expect(layout.rings[0]?.[0]).toBeGreaterThan(layout.centerRadius);
  });

  it('tient le demi-cercle et le centre dans le cadre', () => {
    const layout = fanLayout(5);
    const outer = layout.rings.at(-1)?.[1] ?? 0;
    expect(layout.cx - outer).toBeGreaterThanOrEqual(0);
    expect(layout.cx + outer).toBeLessThanOrEqual(layout.width);
    expect(layout.cy - outer).toBeGreaterThanOrEqual(0);
    expect(layout.cy + layout.centerRadius).toBeLessThan(layout.height);
  });

  it('donne une largeur minimale qui garde 44 px à chaque case de l’anneau extérieur', () => {
    for (const generations of [3, 4, 6]) {
      const layout = fanLayout(generations);
      const scale = layout.minWidth / layout.width;
      const [inner, outer] = layout.rings.at(-1) ?? [0, 0];
      const arc = (((inner + outer) / 2) * Math.PI) / 2 ** generations;
      expect(arc * scale).toBeGreaterThanOrEqual(44);
      expect((outer - inner) * scale).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('secteurs', () => {
  it('partage le demi-cercle de gauche à droite, le père à gauche', () => {
    expect(sectorAngles(1, 0)).toEqual([-Math.PI / 2, 0]);
    expect(sectorAngles(1, 1)).toEqual([0, Math.PI / 2]);
    expect(sectorAngles(3, 7)[1]).toBeCloseTo(Math.PI / 2);
  });

  it('trace un secteur fermé', () => {
    const d = sectorPath(fanLayout(4), 2, 1);
    expect(d).toMatch(/^M.*Z$/);
  });

  it('écrit droit près du centre, le long du rayon au-delà, jamais la tête en bas', () => {
    const layout = fanLayout(4);
    expect(sectorLabel(layout, 1, 0).rotate).toBe(0);
    const left = sectorLabel(layout, 3, 0);
    const right = sectorLabel(layout, 3, 7);
    expect(left.radial && right.radial).toBe(true);
    for (const { rotate } of [left, right]) {
      expect(rotate).toBeGreaterThanOrEqual(-90);
      expect(rotate).toBeLessThanOrEqual(90);
    }
    // Côté droit, le texte part du centre vers l'extérieur.
    expect(right.rotate).toBeCloseTo(-180 / 16);
    expect(left.rotate).toBeCloseTo(180 / 16);
  });
});
