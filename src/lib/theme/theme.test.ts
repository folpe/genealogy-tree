import { describe, expect, it } from 'vitest';
import { parseTheme, themeAttribute, themeColor } from './theme';

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
