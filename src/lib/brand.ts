// Marque de l'app (journal des décisions, 15). Un seul propriétaire pour le nom et le signe :
// l'interface (`BrandGlyph`) et les icônes générées (`scripts/brand-icons.ts`) en partent.

export const APP_NAME = 'Racines';

/** Encre et papier des tokens (DESIGN.md, section 3), pour les icônes hors CSS. */
export const BRAND_INK = '#1F1C19';
export const BRAND_PAPER = '#F6F2EA';

type Shape = { kind: 'circle'; cx: number; cy: number; r: number } | { kind: 'path'; d: string };

/**
 * Le signe, en éventail sur une grille de 32 : toi au centre, tes deux parents, puis tes
 * quatre grands-parents, comme la vue Ancêtres. L'ordre est celui du tracé animé.
 */
export const BRAND_MARK: readonly Shape[] = [
  { kind: 'circle', cx: 16, cy: 21, r: 2 },
  { kind: 'path', d: 'M9.5 21A6.5 6.5 0 0 1 14.22 14.75' },
  { kind: 'path', d: 'M17.78 14.75A6.5 6.5 0 0 1 22.5 21' },
  { kind: 'path', d: 'M4.5 21A11.5 11.5 0 0 1 6.2 14.98' },
  { kind: 'path', d: 'M8.53 12.26A11.5 11.5 0 0 1 14.21 9.64' },
  { kind: 'path', d: 'M17.79 9.64A11.5 11.5 0 0 1 23.47 12.26' },
  { kind: 'path', d: 'M25.8 14.98A11.5 11.5 0 0 1 27.5 21' },
];

const GRID = 32;

/** Centre de l'éventail (toi) et jour entre deux arcs d'un anneau, sur la grille du signe. */
const FAN_CENTER = { x: 16, y: 21 };
const FAN_GAP = 3.6;

/**
 * Un anneau de l'éventail : `count` arcs de rayon `radius`, du bord gauche au bord droit,
 * séparés par le même jour que ceux du signe. `fanRing(6.5, 2)` et `fanRing(11.5, 4)`
 * redonnent les anneaux de `BRAND_MARK` ; le chargement de l'arbre y ajoute le suivant.
 */
export function fanRing(radius: number, count: number): string[] {
  const gap = FAN_GAP / radius;
  const span = (Math.PI - gap * (count - 1)) / count;
  const at = (angle: number) =>
    `${round2(FAN_CENTER.x + radius * Math.cos(angle))} ${round2(FAN_CENTER.y - radius * Math.sin(angle))}`;
  return Array.from({ length: count }, (_, i) => {
    const start = Math.PI - i * (span + gap);
    return `M${at(start)}A${radius} ${radius} 0 0 1 ${at(start - span)}`;
  });
}

/**
 * Le signe en SVG autonome, pour les icônes. `inset` est la marge ajoutée de chaque côté,
 * en fraction de la grille (0,2 garde le signe dans la zone sûre d'une icône masquable).
 */
export function brandMarkSvg({
  size,
  stroke,
  background,
  shape = 'square',
  inset = 0,
}: {
  size: number;
  stroke: string;
  background?: string;
  shape?: 'square' | 'circle';
  inset?: number;
}): string {
  const pad = round(GRID * inset);
  const span = round(GRID + 2 * pad);
  const backdrop = !background
    ? ''
    : shape === 'circle'
      ? `<circle cx="${GRID / 2}" cy="${GRID / 2}" r="${span / 2}" fill="${background}"/>`
      : `<rect x="${-pad}" y="${-pad}" width="${span}" height="${span}" fill="${background}"/>`;
  const marks = BRAND_MARK.map((mark) =>
    mark.kind === 'circle'
      ? `<circle cx="${mark.cx}" cy="${mark.cy}" r="${mark.r}" pathLength="1"/>`
      : `<path d="${mark.d}" pathLength="1"/>`,
  ).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="${-pad} ${-pad} ${span} ${span}">${backdrop}` +
    `<g fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" ` +
    `stroke-linejoin="round">${marks}</g></svg>`
  );
}

const round = (value: number) => Math.round(value * 1000) / 1000;
/** Au centième, comme les tracés du signe ; `-0` s'écrit `0`. */
const round2 = (value: number) => Math.round(value * 100) / 100 + 0;
