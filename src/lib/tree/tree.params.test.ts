import { describe, expect, it } from 'vitest';
import { familyToggleHref, parseTreeParams, treeHref } from './tree.params';

describe('parseTreeParams', () => {
  it('sans paramètre : la vue par défaut du lecteur, unions passées masquées', () => {
    expect(parseTreeParams({})).toEqual({ past: false });
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
      past: false,
    });
    expect(parseTreeParams({ depth: '500' })).toEqual({ past: false });
    expect(parseTreeParams({ p: 'x'.repeat(200) })).toEqual({ past: false });
    expect(parseTreeParams({ view: 'couple' }).view).toBe('couple');
  });

  it('un paramètre répété ne garde que le premier', () => {
    expect(parseTreeParams({ view: ['descendants', 'hourglass'] }).view).toBe('descendants');
  });
});

describe('treeHref', () => {
  it('n’écrit que ce qui est choisi', () => {
    expect(treeHref({ past: false })).toBe('/tree');
    expect(treeHref({ view: 'all', past: false })).toBe('/tree?view=all');
    expect(treeHref({ view: 'descendants', p: 'luc', past: true })).toBe(
      '/tree?p=luc&view=descendants&past=1',
    );
    expect(treeHref({ view: 'all', past: false, depth: 3 })).toBe('/tree?view=all');
    expect(treeHref({ view: 'hourglass', past: false, depth: 3 })).toBe(
      '/tree?view=hourglass&depth=3',
    );
  });
});

describe('familles des conjoints (Toute la famille)', () => {
  it('lit les familles dépliées et la fiche demandée', () => {
    expect(parseTreeParams({ view: 'all', famille: 'conjoint,mari-tm1', fiche: 'luc' })).toEqual({
      view: 'all',
      past: false,
      families: ['conjoint', 'mari-tm1'],
      reveal: 'luc',
    });
  });

  it('écrit les familles dépliées seulement pour Toute la famille', () => {
    expect(treeHref({ view: 'all', past: false, families: ['conjoint'] })).toBe(
      '/tree?view=all&famille=conjoint',
    );
    expect(treeHref({ view: 'couple', past: false, families: ['conjoint'] })).toBe(
      '/tree?view=couple',
    );
  });

  it('déplier ou replier la famille d’un conjoint ramène la caméra sur lui', () => {
    const params = { view: 'all' as const, past: false, families: ['mari-tm1'] };
    expect(familyToggleHref(params, 'conjoint', false)).toBe(
      '/tree?view=all&famille=mari-tm1%2Cconjoint&focus=conjoint',
    );
    expect(familyToggleHref(params, 'mari-tm1', true)).toBe('/tree?view=all&focus=mari-tm1');
  });

  it('une famille ouverte par une fiche demandée se replie', () => {
    const params = parseTreeParams({ view: 'all', fiche: 'gp-c' });
    expect(familyToggleHref(params, 'conjoint', true)).toBe('/tree?view=all&focus=conjoint');
  });
});
