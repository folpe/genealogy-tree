import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { themeColor } from '@/lib/theme/theme';

// Contraste WCAG 2.2 AA des tokens tels que l'app les sert (globals.css), dans les
// deux thèmes (plan phase 5, lot 1). Une valeur qui dérive d'une maquette à l'autre
// est rattrapée ici, pas à l'œil.

type Rgb = [number, number, number];

const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
const OKLCH = String.raw`oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)`;

function tokens(): Map<string, { light: Rgb; dark: Rgb }> {
  const found = new Map<string, { light: Rgb; dark: Rgb }>();
  const pattern = new RegExp(`--color-([\\w-]+):\\s*light-dark\\(${OKLCH},\\s*${OKLCH}\\)`, 'g');
  for (const m of css.matchAll(pattern)) {
    const n = m.slice(2).map(Number);
    found.set(m[1] ?? '', {
      light: oklchToRgb(n[0] ?? 0, n[1] ?? 0, n[2] ?? 0),
      dark: oklchToRgb(n[3] ?? 0, n[4] ?? 0, n[5] ?? 0),
    });
  }
  return found;
}

/** OKLCH (L en %) vers sRGB linéaire, borné à [0, 1] (Björn Ottosson, OKLab). */
function oklchToRgb(lightness: number, chroma: number, hue: number): Rgb {
  const L = lightness / 100;
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Les composantes sont déjà linéaires : la luminance relative s'en déduit directement. */
const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function contrast(x: Rgb, y: Rgb): number {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const palette = tokens();
const BACKGROUNDS = ['paper', 'canvas', 'surface', 'card'];

/**
 * Règles d'usage, vérifiées dans les deux thèmes. Texte courant : 4,5:1 (AA) ; grand
 * texte et indications : 3:1.
 * - Sur une bulle, le texte secondaire est en encre : `ink-2` n'y sert qu'aux
 *   initiales, en grand.
 * - Sur fond teinté accent (sélection), le texte est en accent appuyé.
 * - `ink-3` ne porte que du grand texte ou des indications.
 */
const PAIRS: [string, string[], number][] = [
  ['ink', [...BACKGROUNDS, 'bubble', 'bubble-past', 'accent-soft'], 4.5],
  ['ink-2', BACKGROUNDS, 4.5],
  ['ink-2', ['bubble', 'bubble-past'], 3],
  ['accent', ['paper', 'surface', 'card'], 4.5],
  ['accent-strong', ['accent-soft'], 4.5],
  ['ink-3', BACKGROUNDS, 3],
];

describe('contraste des tokens (WCAG AA)', () => {
  it('lit toutes les couleurs à deux thèmes', () => {
    expect(palette.size).toBeGreaterThanOrEqual(16);
    expect(palette.has('accent')).toBe(true);
  });

  for (const theme of ['light', 'dark'] as const) {
    for (const [text, backgrounds, minimum] of PAIRS) {
      for (const background of backgrounds) {
        it(`${theme} : ${text} sur ${background} >= ${minimum}`, () => {
          const fg = palette.get(text)?.[theme];
          const bg = palette.get(background)?.[theme];
          if (!fg || !bg) throw new Error(`${text} ou ${background} absent de globals.css`);
          expect(contrast(fg, bg)).toBeGreaterThanOrEqual(minimum);
        });
      }
    }
  }

  it('le texte sur encre (bouton principal) se lit dans les deux thèmes', () => {
    const ink = palette.get('ink');
    const paper = palette.get('paper');
    if (!ink || !paper) throw new Error('ink ou paper absent');
    expect(contrast(paper.light, ink.light)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(paper.dark, ink.dark)).toBeGreaterThanOrEqual(4.5);
  });

  it('la barre du navigateur reprend exactement le fond de page', () => {
    const paper = palette.get('paper');
    if (!paper) throw new Error('paper absent');
    const hex = (rgb: Rgb) => {
      // Composantes linéaires : on repasse en sRGB encodé avant l'hexadécimal.
      const encode = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
      return `#${rgb
        .map((v) =>
          Math.round(encode(v) * 255)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')}`;
    };
    const [light] = themeColor('light');
    const [dark] = themeColor('dark');
    expect(light?.color.toLowerCase()).toBe(hex(paper.light));
    expect(dark?.color.toLowerCase()).toBe(hex(paper.dark));
  });
});
