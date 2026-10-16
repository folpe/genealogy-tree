import { describe, expect, it } from 'vitest';
import { APP_NAME, BRAND_MARK, brandMarkSvg, fanRing } from './brand';

describe('marque', () => {
  it('s’appelle Racines', () => {
    expect(APP_NAME).toBe('Racines');
  });

  it('dessine l’éventail : toi au centre, deux parents, quatre grands-parents', () => {
    expect(BRAND_MARK.filter((shape) => shape.kind === 'circle')).toHaveLength(1);
    expect(BRAND_MARK.filter((shape) => shape.kind === 'path')).toHaveLength(6);
  });

  it('rend un SVG autonome, au trait de la couleur donnée, sur fond éventuel', () => {
    const svg = brandMarkSvg({ size: 96, stroke: '#F6F2EA', background: '#1F1C19' });
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="96" height="96"/);
    expect(svg).toContain('stroke="#F6F2EA"');
    expect(svg).toContain('fill="#1F1C19"');
    expect(svg.match(/pathLength="1"/g)).toHaveLength(7);
  });

  it('resserre le signe dans la zone sûre d’une icône masquable', () => {
    const full = brandMarkSvg({ size: 512, stroke: '#fff', background: '#000', inset: 0 });
    const safe = brandMarkSvg({ size: 512, stroke: '#fff', background: '#000', inset: 0.2 });
    expect(full).toContain('viewBox="0 0 32 32"');
    expect(safe).toContain('viewBox="-6.4 -6.4 44.8 44.8"');
  });

  it('trace un anneau de l’éventail comme ceux du signe, et un de plus pour la génération suivante', () => {
    const numbers = (d: string) => (d.match(/-?[\d.]+/g) ?? []).map(Number);
    const mark = BRAND_MARK.flatMap((shape) => (shape.kind === 'path' ? [shape.d] : []));
    const rings = [...fanRing(6.5, 2), ...fanRing(11.5, 4)];
    expect(rings).toHaveLength(mark.length);
    rings.forEach((d, i) => {
      const expected = numbers(mark[i] ?? '');
      numbers(d).forEach((n, j) => {
        expect(n).toBeCloseTo(expected[j] ?? Number.NaN, 1);
      });
    });
    // Arrière-grands-parents : huit arcs, du bord gauche au bord droit du demi-cercle.
    const next = fanRing(16.5, 8);
    expect(next).toHaveLength(8);
    expect(next[0]).toMatch(/^M-0\.5 21A16\.5 16\.5 0 0 1 /);
    expect(next.at(-1)).toMatch(/ 32\.5 21$/);
  });
});
