import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson, emptyGraph, yearOnly } from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { type DisplayedEdge, selectDisplayedGraph } from './family.display';
import type { FamilyGraph } from './family.types';

const edge = (kind: DisplayedEdge['kind'], from: string, to: string) =>
  expect.objectContaining({ kind, from, to });

describe('selectDisplayedGraph, par défaut', () => {
  const view = selectDisplayedGraph(marchandFamily, { focusId: 'hugo' });
  const unionIds = view.unions.map((u) => u.id);

  it('ne dessine pas l’ancienne union de Luc ni son ancienne conjointe', () => {
    expect(unionIds).not.toContain('u-luc-claire');
    expect(view.personIds).not.toContain('claire');
  });

  it('rattache Maxime directement à Luc, au même niveau que Léa et Hugo', () => {
    expect(view.personIds).toContain('maxime');
    expect(view.edges).toContainEqual(edge('parent', 'luc', 'maxime'));
    expect(view.edges).toContainEqual(edge('child', 'u-luc-sophie', 'hugo'));
    expect(view.edges).toContainEqual(edge('child', 'u-luc-sophie', 'lea'));
  });

  it('expose « a élevé » comme lien secondaire', () => {
    expect(view.edges).toContainEqual(edge('raised', 'sophie', 'maxime'));
  });

  it('garde une union terminée par un décès sans remariage (veuvage)', () => {
    expect(unionIds).toContain('u-marie-jacques');
    expect(view.personIds).toContain('jacques');
    expect(view.edges).toContainEqual(edge('child', 'u-marie-jacques', 'isabelle'));
  });

  it('relie chaque union en cours à ses deux partenaires', () => {
    expect(view.edges).toContainEqual(edge('partner', 'luc', 'u-luc-sophie'));
    expect(view.edges).toContainEqual(edge('partner', 'sophie', 'u-luc-sophie'));
  });

  it('rattache un enfant sans union à son parent, adoption comprise', () => {
    expect(view.edges).toContainEqual(edge('parent', 'lea', 'jade'));
    expect(view.edges).toContainEqual({
      kind: 'parent',
      from: 'anne',
      to: 'tom',
      filiation: 'adoptive',
    });
  });

  it('n’a aucune arête vers une personne non dessinée', () => {
    const drawn = new Set([...view.personIds, ...unionIds]);
    for (const e of view.edges) {
      expect(drawn.has(e.from) && drawn.has(e.to)).toBe(true);
    }
  });
});

describe('selectDisplayedGraph, du côté de l’enfant', () => {
  it('montre l’union passée et l’autre parent dans la vue centrée sur Maxime', () => {
    const view = selectDisplayedGraph(marchandFamily, { focusId: 'maxime' });
    expect(view.unions.map((u) => u.id)).toContain('u-luc-claire');
    expect(view.personIds).toContain('claire');
    expect(view.edges).toContainEqual(edge('child', 'u-luc-claire', 'maxime'));
    expect(view.edges).not.toContainEqual(edge('parent', 'luc', 'maxime'));
  });

  it('marque l’union passée comme telle', () => {
    const view = selectDisplayedGraph(marchandFamily, { focusId: 'maxime' });
    expect(view.unions.find((u) => u.id === 'u-luc-claire')).toMatchObject({ past: true });
  });
});

describe('selectDisplayedGraph, option « Montrer les unions passées »', () => {
  it('fait réapparaître toutes les unions terminées', () => {
    const view = selectDisplayedGraph(marchandFamily, { focusId: 'hugo', showPastUnions: true });
    expect(view.unions).toHaveLength(marchandFamily.unions.length);
    expect(view.personIds).toContain('claire');
  });
});

describe('selectDisplayedGraph, remariage après veuvage', () => {
  const graph: FamilyGraph = {
    ...emptyGraph([aPerson('a'), aPerson('b'), aPerson('c'), aPerson('k')]),
    unions: [
      anUnion('u1', 'a', 'b', { start: yearOnly(1950), end: { reason: 'deces' } }),
      anUnion('u2', 'a', 'c', { start: yearOnly(1970) }),
    ],
    parentChildren: [aChildOf('a', 'k', { unionId: 'u1' }), aChildOf('b', 'k', { unionId: 'u1' })],
  };

  it('traite la première union comme passée', () => {
    const view = selectDisplayedGraph(graph, { focusId: 'a' });
    expect(view.unions.map((u) => u.id)).toEqual(['u2']);
    expect(view.personIds).not.toContain('b');
    expect(view.edges).toContainEqual(edge('parent', 'a', 'k'));
  });
});

describe('selectDisplayedGraph, parent inconnu', () => {
  it('dessine l’union avec un emplacement « parent à découvrir »', () => {
    const graph: FamilyGraph = {
      ...emptyGraph([aPerson('a'), aPerson('k')]),
      unions: [anUnion('u', 'a', null)],
      parentChildren: [aChildOf('a', 'k', { unionId: 'u' })],
    };
    const view = selectDisplayedGraph(graph, { focusId: 'k' });
    expect(view.unions).toEqual([
      { id: 'u', partnerIds: ['a', null], past: false, unknownPartner: true },
    ]);
    expect(view.edges).toContainEqual(edge('child', 'u', 'k'));
  });
});

describe('selectDisplayedGraph, ordre des fratries', () => {
  it('donne les enfants par ordre de naissance, l’aîné d’abord, les dates inconnues après', () => {
    const graph: FamilyGraph = {
      ...emptyGraph(),
      persons: [
        aPerson('mere'),
        aPerson('pere'),
        aPerson('cadet', { birth: { date: yearOnly(1990) } }),
        aPerson('inconnu'),
        aPerson('aine', { birth: { date: yearOnly(1985) } }),
        aPerson('seul', { birth: { date: yearOnly(2001) } }),
        aPerson('premier', { birth: { date: yearOnly(1980) } }),
      ],
      unions: [anUnion('u', 'pere', 'mere')],
      parentChildren: [
        ...['cadet', 'inconnu', 'aine'].flatMap((child) => [
          aChildOf('pere', child, { unionId: 'u' }),
          aChildOf('mere', child, { unionId: 'u' }),
        ]),
        aChildOf('pere', 'seul'),
        aChildOf('pere', 'premier'),
      ],
    };
    const view = selectDisplayedGraph(graph, { focusId: 'cadet' });
    const children = view.edges.flatMap((e) => (e.kind === 'child' ? [e.to] : []));
    expect(children).toEqual(['aine', 'cadet', 'inconnu']);
    const fromParent = view.edges.flatMap((e) => (e.kind === 'parent' ? [e.to] : []));
    expect(fromParent).toEqual(['premier', 'seul']);
  });
});
