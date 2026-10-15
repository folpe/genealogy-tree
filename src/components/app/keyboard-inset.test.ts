import { describe, expect, it } from 'vitest';
import { keyboardInset } from './keyboard-inset';

describe('keyboardInset', () => {
  it('vaut zéro sans clavier', () => {
    expect(keyboardInset({ layoutHeight: 839, visualHeight: 839, visualTop: 0, scale: 1 })).toBe(0);
  });

  it('mesure la hauteur couverte par le clavier', () => {
    expect(keyboardInset({ layoutHeight: 839, visualHeight: 520, visualTop: 0, scale: 1 })).toBe(
      319,
    );
  });

  it('suit le bas visible quand le navigateur a fait glisser la vue vers le haut', () => {
    expect(keyboardInset({ layoutHeight: 839, visualHeight: 520, visualTop: 100, scale: 1 })).toBe(
      219,
    );
  });

  it('ne rend jamais une hauteur négative ni fractionnaire', () => {
    expect(keyboardInset({ layoutHeight: 839, visualHeight: 839.4, visualTop: 2, scale: 1 })).toBe(
      0,
    );
    expect(keyboardInset({ layoutHeight: 839, visualHeight: 520.6, visualTop: 0, scale: 1 })).toBe(
      318,
    );
  });

  it('ignore la vue zoomée à deux doigts, qui n’est pas un clavier', () => {
    expect(keyboardInset({ layoutHeight: 839, visualHeight: 420, visualTop: 0, scale: 2 })).toBe(0);
  });
});
