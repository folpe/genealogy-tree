import { describe, expect, it } from 'vitest';
import { closureNotice } from './tree-fold-notice';

// Un pli posé tout seul pour garder l'arbre lisible s'annonce, sans bloquer.

const people = {
  sophie: { name: 'Sophie' },
  luc: { name: 'Toi', me: true },
  robert: { name: 'Robert' },
  celine: { name: 'Céline' },
  paul: { name: 'Paul' },
};

describe('closureNotice', () => {
  it('rien de replié : rien à dire', () => {
    expect(closureNotice([], people)).toBe('');
  });

  it('la famille d’un conjoint, par son prénom', () => {
    expect(closureNotice([{ kind: 'family', personId: 'sophie' }], people)).toBe(
      'Famille de Sophie repliée pour garder l’arbre lisible',
    );
  });

  it('la sienne, au tutoiement', () => {
    expect(closureNotice([{ kind: 'family', personId: 'luc' }], people)).toBe(
      'Ta famille repliée pour garder l’arbre lisible',
    );
  });

  it('une ou plusieurs branches', () => {
    expect(closureNotice([{ kind: 'branch', personId: 'robert' }], people)).toBe(
      'Branche de Robert repliée pour garder l’arbre lisible',
    );
    const three = ['robert', 'celine', 'paul'].map((personId) => ({
      kind: 'branch' as const,
      personId,
    }));
    expect(closureNotice(three, people)).toBe(
      'Branches de Robert, Céline et Paul repliées pour garder l’arbre lisible',
    );
  });

  it('une famille et des branches : les deux, l’une après l’autre', () => {
    expect(
      closureNotice(
        [
          { kind: 'family', personId: 'sophie' },
          { kind: 'branch', personId: 'robert' },
        ],
        people,
      ),
    ).toBe('Famille de Sophie et branche de Robert repliées pour garder l’arbre lisible');
  });
});
