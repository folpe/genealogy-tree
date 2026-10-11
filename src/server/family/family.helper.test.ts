import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson, emptyGraph } from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import {
  ancestorsOf,
  buildFamilyIndex,
  childrenOf,
  descendantsOf,
  isOngoing,
  parentsOf,
  partnersOf,
  raisedBy,
  siblingsOf,
} from './family.helper';
import type { FamilyGraph } from './family.types';

const index = buildFamilyIndex(marchandFamily);
const ids = (links: { id: string }[]) => links.map((l) => l.id).sort();

describe('parentsOf', () => {
  it('retourne les deux parents d’une union', () => {
    expect(ids(parentsOf(index, 'hugo'))).toEqual(['luc', 'sophie']);
  });

  it('ne compte pas la filiation « a élevé » comme un parent', () => {
    expect(ids(parentsOf(index, 'maxime'))).toEqual(['claire', 'luc']);
  });

  it('compte l’adoption comme une filiation à part entière', () => {
    expect(parentsOf(index, 'tom')).toEqual([{ id: 'anne', kind: 'adoptive' }]);
  });

  it('filtre par type de filiation', () => {
    expect(parentsOf(index, 'tom', { kinds: ['biologique'] })).toEqual([]);
  });

  it('retourne une liste vide pour une personne inconnue', () => {
    expect(parentsOf(index, 'personne')).toEqual([]);
  });
});

describe('raisedBy', () => {
  it('expose la filiation « a élevé » séparément', () => {
    expect(raisedBy(index, 'maxime')).toEqual(['sophie']);
    expect(raisedBy(index, 'hugo')).toEqual([]);
  });
});

describe('childrenOf', () => {
  it('retourne les enfants de toutes les unions', () => {
    expect(ids(childrenOf(index, 'luc'))).toEqual(['hugo', 'lea', 'maxime']);
  });

  it('n’inclut pas les enfants seulement élevés', () => {
    expect(ids(childrenOf(index, 'sophie'))).toEqual(['hugo', 'lea']);
  });
});

describe('partnersOf', () => {
  it('distingue unions en cours et passées', () => {
    expect(partnersOf(index, 'luc').map((p) => [p.partnerId, p.ongoing])).toEqual([
      ['claire', false],
      ['sophie', true],
    ]);
    expect(partnersOf(index, 'luc', { ongoingOnly: true }).map((p) => p.partnerId)).toEqual([
      'sophie',
    ]);
  });

  it('accepte un partenaire inconnu', () => {
    const solo = buildFamilyIndex({
      ...emptyGraph([aPerson('a')]),
      unions: [anUnion('u', 'a', null)],
    });
    expect(partnersOf(solo, 'a')).toEqual([{ unionId: 'u', partnerId: null, ongoing: true }]);
  });

  it('dit si une union est en cours', () => {
    expect(isOngoing(anUnion('u', 'a', 'b'))).toBe(true);
    expect(isOngoing(anUnion('u', 'a', 'b', { end: { reason: 'divorce' } }))).toBe(false);
  });
});

describe('siblingsOf', () => {
  it('distingue frères et sœurs pleins et demi', () => {
    expect(siblingsOf(index, 'hugo')).toEqual([
      { id: 'lea', half: false },
      { id: 'maxime', half: true },
    ]);
    expect(siblingsOf(index, 'maxime')).toEqual([
      { id: 'hugo', half: true },
      { id: 'lea', half: true },
    ]);
  });

  it('ne fait pas de frère et sœur par la seule filiation « a élevé »', () => {
    const graph: FamilyGraph = {
      ...emptyGraph([aPerson('p'), aPerson('a'), aPerson('b')]),
      parentChildren: [aChildOf('p', 'a'), aChildOf('p', 'b', { kind: 'a_eleve' })],
    };
    expect(siblingsOf(buildFamilyIndex(graph), 'a')).toEqual([]);
  });

  it('retourne une liste vide sans parents connus', () => {
    expect(siblingsOf(index, 'henri')).toEqual([]);
  });
});

describe('ancestorsOf', () => {
  it('remonte sans limite avec la génération', () => {
    const ancestors = ancestorsOf(index, 'hugo');
    expect(ancestors.get('luc')).toBe(1);
    expect(ancestors.get('paul')).toBe(2);
    expect(ancestors.get('henri')).toBe(3);
    expect(ancestors.get('emile')).toBe(3);
    expect(ancestors.get('bernard')).toBe(2);
    expect(ancestors.has('hugo')).toBe(false);
    expect(ancestors.size).toBe(10);
  });

  it('n’inclut jamais un beau-parent', () => {
    expect(ancestorsOf(index, 'maxime').has('sophie')).toBe(false);
    expect(ancestorsOf(index, 'maxime').has('claire')).toBe(true);
  });
});

describe('descendantsOf', () => {
  it('descend avec la génération', () => {
    const descendants = descendantsOf(index, 'paul');
    expect(descendants.get('luc')).toBe(1);
    expect(descendants.get('hugo')).toBe(2);
    expect(descendants.get('jade')).toBe(3);
    expect(descendants.get('tom')).toBe(2);
    expect(descendants.has('sophie')).toBe(false);
  });
});

describe('performance', () => {
  it('construit l’index et répond vite sur 2 000 personnes', () => {
    const persons = Array.from({ length: 2000 }, (_, i) => aPerson(`p${i}`));
    const parentChildren = persons.slice(1).map((p, i) => aChildOf(`p${Math.floor(i / 2)}`, p.id));
    const start = performance.now();
    const big = buildFamilyIndex({ ...emptyGraph(persons), parentChildren });
    ancestorsOf(big, 'p1999');
    descendantsOf(big, 'p0');
    siblingsOf(big, 'p1000');
    expect(performance.now() - start).toBeLessThan(50);
  });
});
