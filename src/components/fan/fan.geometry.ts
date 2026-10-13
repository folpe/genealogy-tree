import { arc } from 'd3-shape';

// Géométrie de l'éventail (maquette 03, DESIGN.md section 9) : un demi-cercle au-dessus
// de la personne, un anneau par génération. Angles à la manière de d3 : 0 à midi,
// sens horaire ; le demi-cercle va de -π/2 (gauche, côté du père) à π/2 (droite).
// d3 calcule, React rend (ADR 05).

/** Épaisseur des anneaux, de la 1re à la 6e génération : les noms proches ont plus de place. */
const RING_WIDTHS = [96, 94, 90, 86, 80, 74] as const;
const LAST_RING_WIDTH = 74;
const CENTER_RADIUS = 62;
const FIRST_RING = 72;
const MARGIN = 12;
/** Sous le centre : la place du cercle et de son nom. */
const BELOW_CENTER = 110;
/** Cible tactile minimale (Apple HIG), en pixels CSS. */
const TOUCH_TARGET_PX = 44;
/** Les deux premiers anneaux ont la place d'écrire à l'horizontale. */
const LAST_FLAT_GENERATION = 2;

export type FanLayout = {
  width: number;
  height: number;
  cx: number;
  cy: number;
  centerRadius: number;
  /** `[intérieur, extérieur]` de chaque génération. */
  rings: [number, number][];
  /** Largeur CSS sous laquelle une case de l'anneau extérieur passerait sous 44 px. */
  minWidth: number;
};

export function fanLayout(generations: number): FanLayout {
  const rings: [number, number][] = [];
  let inner = FIRST_RING;
  for (let g = 0; g < generations; g += 1) {
    const outer = inner + (RING_WIDTHS[g] ?? LAST_RING_WIDTH);
    rings.push([inner, outer]);
    inner = outer;
  }
  const radius = inner;
  const width = 2 * (radius + MARGIN);
  const [lastInner, lastOuter] = rings.at(-1) ?? [FIRST_RING, FIRST_RING];
  const outerArc = (((lastInner + lastOuter) / 2) * Math.PI) / 2 ** generations;
  const scale = Math.max(TOUCH_TARGET_PX / outerArc, TOUCH_TARGET_PX / (lastOuter - lastInner));
  return {
    width,
    height: radius + MARGIN + BELOW_CENTER,
    cx: width / 2,
    cy: radius + MARGIN,
    centerRadius: CENTER_RADIUS,
    rings,
    minWidth: Math.ceil(width * scale),
  };
}

export function sectorAngles(generation: number, index: number): [number, number] {
  const slots = 2 ** generation;
  return [-Math.PI / 2 + (Math.PI * index) / slots, -Math.PI / 2 + (Math.PI * (index + 1)) / slots];
}

const sector = arc().padAngle(0.004).cornerRadius(6);

/** Chemin SVG du secteur, relatif au centre de l'éventail. */
export function sectorPath(layout: FanLayout, generation: number, index: number): string {
  const [innerRadius, outerRadius] = layout.rings[generation - 1] ?? [0, 0];
  const [startAngle, endAngle] = sectorAngles(generation, index);
  return sector({ innerRadius, outerRadius, startAngle, endAngle }) ?? '';
}

export type SectorLabel = {
  /** Centre du texte, relatif au centre de l'éventail. */
  x: number;
  y: number;
  /** Rotation en degrés autour de (x, y), entre -90 et 90 : jamais la tête en bas. */
  rotate: number;
  /** Le texte suit le rayon plutôt que l'horizontale. */
  radial: boolean;
  /** Longueur disponible pour le texte, en unités du dessin. */
  room: number;
};

export function sectorLabel(layout: FanLayout, generation: number, index: number): SectorLabel {
  const [inner, outer] = layout.rings[generation - 1] ?? [0, 0];
  const [start, end] = sectorAngles(generation, index);
  const angle = (start + end) / 2;
  const middle = (inner + outer) / 2;
  const x = middle * Math.sin(angle);
  const y = -middle * Math.cos(angle);
  if (generation <= LAST_FLAT_GENERATION) {
    return { x, y, rotate: 0, radial: false, room: middle * (end - start) * 0.9 };
  }
  // Le long du rayon : vers l'extérieur à droite, vers le centre à gauche.
  const degrees = (angle * 180) / Math.PI;
  return {
    x,
    y,
    rotate: angle >= 0 ? degrees - 90 : degrees + 90,
    radial: true,
    room: (outer - inner) * 0.9,
  };
}
