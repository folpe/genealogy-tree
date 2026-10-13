import { describe, expect, it } from 'vitest';
import { fanHref, parseFanParams } from './fan.params';

describe('parseFanParams', () => {
  it('sans paramètre : centré sur le lecteur, quatre générations', () => {
    expect(parseFanParams({})).toEqual({ generations: 4 });
  });

  it('lit la personne au centre et le nombre de générations', () => {
    expect(parseFanParams({ p: 'luc', g: '6' })).toEqual({ p: 'luc', generations: 6 });
  });

  it('retombe sur le défaut au lieu de casser la page', () => {
    expect(parseFanParams({ g: '9', p: 'x'.repeat(200) })).toEqual({ generations: 4 });
    expect(parseFanParams({ g: ['2', '5'] })).toEqual({ generations: 2 });
    expect(parseFanParams({ g: 'deux' })).toEqual({ generations: 4 });
  });
});

describe('fanHref', () => {
  it('n’écrit que ce qui s’écarte du défaut', () => {
    expect(fanHref({ generations: 4 })).toBe('/ancestors');
    expect(fanHref({ p: 'luc', generations: 5 })).toBe('/ancestors?p=luc&g=5');
  });
});
