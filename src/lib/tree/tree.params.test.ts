import { describe, expect, it } from 'vitest';
import { parseTreeParams, treeHref } from './tree.params';

describe('parseTreeParams', () => {
  it('sans paramètre : toute la famille, unions passées masquées', () => {
    expect(parseTreeParams({})).toEqual({ view: 'all', past: false });
  });

  it('lit la vue, la personne au centre, les unions passées et la profondeur', () => {
    expect(parseTreeParams({ p: 'luc', view: 'hourglass', past: '1', depth: '3' })).toEqual({
      p: 'luc',
      view: 'hourglass',
      past: true,
      depth: 3,
    });
  });

  it('ignore une valeur invalide au lieu de casser la page', () => {
    expect(parseTreeParams({ view: 'eventail', past: 'oui', depth: '-2' })).toEqual({
      view: 'all',
      past: false,
    });
    expect(parseTreeParams({ depth: '500' })).toEqual({ view: 'all', past: false });
    expect(parseTreeParams({ p: 'x'.repeat(200) })).toEqual({ view: 'all', past: false });
  });

  it('un paramètre répété ne garde que le premier', () => {
    expect(parseTreeParams({ view: ['descendants', 'hourglass'] }).view).toBe('descendants');
  });
});

describe('treeHref', () => {
  it('n’écrit que ce qui diffère du défaut', () => {
    expect(treeHref({ view: 'all', past: false })).toBe('/tree');
    expect(treeHref({ view: 'descendants', p: 'luc', past: true })).toBe(
      '/tree?p=luc&view=descendants&past=1',
    );
  });
});
