import { describe, expect, it } from 'vitest';
import { parseTheme, readThemeCookie, themeAttribute, themeColor } from './theme';

describe('préférence de thème', () => {
  it('lit le cookie, et retombe sur « Système » pour toute autre valeur', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('system')).toBe('system');
    expect(parseTheme('violet')).toBe('system');
    expect(parseTheme(undefined)).toBe('system');
  });

  it('« Système » ne force rien sur <html> ; clair et sombre si', () => {
    expect(themeAttribute('system')).toBeUndefined();
    expect(themeAttribute('dark')).toBe('dark');
  });

  it('la barre du navigateur suit le thème choisi, ou le système', () => {
    expect(themeColor('light')).toEqual([{ color: '#F6F2EA' }]);
    expect(themeColor('system')).toHaveLength(2);
  });
});

describe('readThemeCookie', () => {
  const jar = (cookies: Record<string, string>) => ({
    get: (name: string) => (name in cookies ? { value: cookies[name] ?? '' } : undefined),
  });

  it('lit le cookie de Racines', () => {
    expect(readThemeCookie(jar({ 'racines-theme': 'dark' }))).toBe('dark');
  });

  it('reprend le thème choisi avant le renommage, tant qu’il n’a pas été réécrit', () => {
    expect(readThemeCookie(jar({ 'ances-tree-theme': 'light' }))).toBe('light');
    expect(readThemeCookie(jar({ 'racines-theme': 'dark', 'ances-tree-theme': 'light' }))).toBe(
      'dark',
    );
  });

  it('sans cookie, suit le système', () => {
    expect(readThemeCookie(jar({}))).toBe('system');
  });
});
