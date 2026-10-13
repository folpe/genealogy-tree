import { describe, expect, it } from 'vitest';
import { fitWithin } from './fiche-photo.helper';

describe('fitWithin', () => {
  it('réduit le grand côté à la limite, proportions gardées', () => {
    expect(fitWithin(4032, 3024, 2048)).toEqual({ width: 2048, height: 1536 });
    expect(fitWithin(3024, 4032, 2048)).toEqual({ width: 1536, height: 2048 });
  });

  it('n’agrandit jamais une petite photo', () => {
    expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 });
  });
});
