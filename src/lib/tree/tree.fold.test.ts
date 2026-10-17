import { describe, expect, it } from 'vitest';
import type { DisplayedGraph } from '../../server/family/family.display';
import { branchesOf, branchKeys, foldGraph, hideKey, originKey } from './tree.fold';

// a + b -> c ; c + d -> e, f ; g + h -> d ; f + i -> j ; e seul -> k ;
// c a élevé m, fils de n.
const union = (id: string, a: string, b: string) => ({
  id,
  partnerIds: [a, b] as [string, string],
  past: false,
  unknownPartner: false,
});
const graph: DisplayedGraph = {
  personIds: ['a', 'b', 'g', 'h', 'n', 'c', 'd', 'e', 'f', 'i', 'm', 'j', 'k'],
  unions: [
    union('u-ab', 'a', 'b'),
    union('u-gh', 'g', 'h'),
    union('u-cd', 'c', 'd'),
    union('u-fi', 'f', 'i'),
  ],
  edges: [
    { kind: 'partner', from: 'a', to: 'u-ab' },
    { kind: 'partner', from: 'b', to: 'u-ab' },
    { kind: 'partner', from: 'g', to: 'u-gh' },
    { kind: 'partner', from: 'h', to: 'u-gh' },
    { kind: 'partner', from: 'c', to: 'u-cd' },
    { kind: 'partner', from: 'd', to: 'u-cd' },
    { kind: 'partner', from: 'f', to: 'u-fi' },
    { kind: 'partner', from: 'i', to: 'u-fi' },
    { kind: 'child', from: 'u-ab', to: 'c' },
    { kind: 'child', from: 'u-gh', to: 'd' },
    { kind: 'child', from: 'u-cd', to: 'e' },
    { kind: 'child', from: 'u-cd', to: 'f' },
    { kind: 'child', from: 'u-fi', to: 'j' },
    { kind: 'parent', from: 'e', to: 'k' },
    { kind: 'parent', from: 'n', to: 'm' },
    { kind: 'raised', from: 'c', to: 'm' },
  ],
};

describe('foldGraph', () => {
  it('sans branche pliée, le graphe reste entier', () => {
    expect(foldGraph(graph, new Set())).toEqual(graph);
  });

  it('plier la branche de c et d cache leurs descendants et les conjoints venus par eux', () => {
    const folded = foldGraph(graph, new Set(['u-cd']));
    expect(folded.personIds).toEqual(['a', 'b', 'g', 'h', 'n', 'c', 'd', 'm']);
    expect(folded.unions.map((u) => u.id)).toEqual(['u-ab', 'u-gh', 'u-cd']);
    const ids = new Set(folded.personIds);
    const unions = new Set(folded.unions.map((u) => u.id));
    for (const edge of folded.edges) {
      expect(ids.has(edge.from) || unions.has(edge.from)).toBe(true);
      expect(ids.has(edge.to) || unions.has(edge.to)).toBe(true);
    }
  });

  it('un enfant élevé garde sa place : il tient à ses propres parents', () => {
    const folded = foldGraph(graph, new Set(['u-cd']));
    expect(folded.edges).toContainEqual({ kind: 'raised', from: 'c', to: 'm' });
    expect(folded.edges).toContainEqual({ kind: 'parent', from: 'n', to: 'm' });
  });

  it('plier la branche de f et i cache leur enfant, et garde le couple', () => {
    const folded = foldGraph(graph, new Set(['u-fi']));
    expect(folded.personIds).not.toContain('j');
    expect(folded.personIds).toContain('i');
    expect(folded.unions.map((u) => u.id)).toContain('u-fi');
  });

  it('un enfant élevé seulement dans la branche pliée part avec elle', () => {
    const lone: DisplayedGraph = {
      ...graph,
      personIds: [...graph.personIds, 'z'],
      edges: [...graph.edges, { kind: 'raised', from: 'f', to: 'z' }],
    };
    expect(foldGraph(lone, new Set(['u-cd'])).personIds).not.toContain('z');
  });

  it('la branche d’un parent seul ne cache que ses enfants à lui', () => {
    const folded = foldGraph(graph, new Set(['e']));
    expect(graph.personIds.filter((id) => !folded.personIds.includes(id))).toEqual(['k']);
  });
});

describe('branchKeys', () => {
  it('une branche par union qui a des enfants, et par parent seul', () => {
    expect([...branchKeys(graph)].sort()).toEqual(['e', 'n', 'u-ab', 'u-cd', 'u-fi', 'u-gh']);
  });
});

describe('branchesOf', () => {
  it('les branches qui partent d’une personne : ses couples, et elle seule', () => {
    const of = branchesOf(graph);
    expect(of.get('c')).toEqual(['u-cd']);
    expect(of.get('e')).toEqual(['e']);
    expect(of.get('m')).toBeUndefined();
  });
});

describe('foldGraph, une personne masquée (hide:)', () => {
  it('cache la personne, ses descendants et le conjoint venu par elle', () => {
    const folded = foldGraph(graph, new Set([hideKey('f')]), 'a');
    for (const id of ['f', 'i', 'j']) expect(folded.personIds).not.toContain(id);
    expect(folded.personIds).toContain('e');
    expect(folded.unions.map((u) => u.id)).not.toContain('u-fi');
  });

  it('avec la personne au centre, ce qui ne tient plus à elle part aussi', () => {
    // m, élevé par c, a son parent n hors de l'arbre : sans c, m et n ne tiennent plus à a.
    const folded = foldGraph(graph, new Set([hideKey('c')]), 'a');
    expect(folded.personIds).toEqual(['a', 'b']);
  });

  it('une famille sans lien avec la personne au centre reste affichée', () => {
    const apart: DisplayedGraph = {
      ...graph,
      personIds: [...graph.personIds, 'x', 'y'],
      unions: [...graph.unions, union('u-xy', 'x', 'y')],
    };
    expect(foldGraph(apart, new Set([hideKey('c')]), 'a').personIds).toEqual(['a', 'b', 'x', 'y']);
  });
});

describe('foldGraph, une famille d’origine repliée (origin:)', () => {
  it('cache les parents de d et ce qui ne tient qu’à eux, garde d', () => {
    const folded = foldGraph(graph, new Set([originKey('d')]), 'e');
    expect(folded.personIds).not.toContain('g');
    expect(folded.personIds).not.toContain('h');
    expect(folded.personIds).toContain('d');
    expect(folded.edges).not.toContainEqual({ kind: 'child', from: 'u-gh', to: 'd' });
  });

  it('replier la famille de c en garde la descendance, centrée sur un enfant', () => {
    const folded = foldGraph(graph, new Set([originKey('c')]), 'e');
    expect(folded.personIds).not.toContain('a');
    expect(folded.personIds).toContain('c');
    expect(folded.personIds).toContain('g');
  });
});
