import { z } from 'zod';

// Thème choisi par le lecteur (plan phase 5, lot 1) : Système, Clair ou Sombre. Il vit
// dans un cookie lu par le serveur, qui pose `data-theme` sur <html> dès le premier
// octet : pas de flash au chargement.

export const THEME_COOKIE = 'racines-theme';
/** Nom d'avant le renommage (2026-10-15) : relu tant qu'un choix ne l'a pas remplacé. */
export const LEGACY_THEME_COOKIE = 'ances-tree-theme';
export const THEME_MAX_AGE_S = 60 * 60 * 24 * 365;

const themeSchema = z.enum(['system', 'light', 'dark']);
export type ThemePreference = z.infer<typeof themeSchema>;

export function parseTheme(value: unknown): ThemePreference {
  const parsed = themeSchema.safeParse(value);
  return parsed.success ? parsed.data : 'system';
}

/** Le thème du lecteur, depuis les cookies de la requête (l'ancien nom en repli). */
export function readThemeCookie(jar: {
  get: (name: string) => { value: string } | undefined;
}): ThemePreference {
  return parseTheme((jar.get(THEME_COOKIE) ?? jar.get(LEGACY_THEME_COOKIE))?.value);
}

/** Valeur de `data-theme` : absente, `globals.css` suit le système. */
export function themeAttribute(theme: ThemePreference): 'light' | 'dark' | undefined {
  return theme === 'system' ? undefined : theme;
}

/** Couleur de la barre du navigateur : le fond de page, `--color-paper` (DESIGN.md). */
const PAPER = { light: '#F6F2EA', dark: '#1D1A2B' } as const;

export function themeColor(theme: ThemePreference) {
  if (theme !== 'system') return [{ color: PAPER[theme] }];
  return [
    { media: '(prefers-color-scheme: light)', color: PAPER.light },
    { media: '(prefers-color-scheme: dark)', color: PAPER.dark },
  ];
}
