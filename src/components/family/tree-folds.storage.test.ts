// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFolds, writeFolds } from './tree-folds.storage';

// Plis de l'arbre par appareil (revue de la PR #159) : localStorage, une clé par vue,
// format versionné ; sans stockage, l'arbre repart des plis de départ.

const KEY = 'racines:tree-folds:/tree?view=all';

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('readFolds / writeFolds', () => {
  it('relit les plis rangés pour la même vue, et seulement pour elle', () => {
    writeFolds('/tree?view=all', ['hide:marie', 'origin:jacques']);
    expect(readFolds('/tree?view=all')).toEqual(['hide:marie', 'origin:jacques']);
    expect(readFolds('/tree?view=all&p=luc')).toBeUndefined();
  });

  it('« Tout afficher » se retient aussi : une liste vide n’est pas une absence', () => {
    writeFolds('/tree?view=all', []);
    expect(readFolds('/tree?view=all')).toEqual([]);
  });

  it('absent : rien, l’arbre repart des plis de départ', () => {
    expect(readFolds('/tree?view=all')).toBeUndefined();
  });

  it('corrompu : ignoré', () => {
    window.localStorage.setItem(KEY, 'pas du json');
    expect(readFolds('/tree?view=all')).toBeUndefined();
    window.localStorage.setItem(KEY, JSON.stringify({ v: 1, folded: [3] }));
    expect(readFolds('/tree?view=all')).toBeUndefined();
  });

  it('une autre version, ou la forme d’avant (une liste nue) : ignorée', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 0, folded: [] }));
    expect(readFolds('/tree?view=all')).toBeUndefined();
    window.localStorage.setItem(KEY, JSON.stringify([]));
    expect(readFolds('/tree?view=all')).toBeUndefined();
  });

  it('stockage refusé (navigation privée, quota) : ni lecture ni écriture ne lève', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writeFolds('/tree?view=all', ['hide:marie'])).not.toThrow();
    expect(readFolds('/tree?view=all')).toBeUndefined();
  });
});
