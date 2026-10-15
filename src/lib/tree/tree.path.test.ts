import { describe, expect, it } from 'vitest';
import { pathHighlight } from './tree.path';

const unions = [
  { id: 'u-luc-sophie', partnerIds: ['luc', 'sophie'] as [string, string | null] },
  { id: 'u-paul-jeanne', partnerIds: ['paul', 'jeanne'] as [string, string | null] },
];

describe('pathHighlight', () => {
  it('allume les bulles et les traits d’un chemin qui monte par les unions', () => {
    const { persons, links } = pathHighlight(
      ['hugo', 'u-luc-sophie', 'luc', 'u-paul-jeanne', 'anne'],
      // Hugo, enfant de Luc et Sophie ; Luc et Anne, enfants de Paul et Jeanne.
      unions,
    );
    // Paul et Jeanne, au sommet du chemin, sont les ancêtres communs : allumés aussi.
    expect([...persons]).toEqual(['hugo', 'luc', 'anne', 'paul', 'jeanne']);
    expect(links).toEqual(
      new Set([
        'child:u-luc-sophie>hugo',
        // Une union détachée se dessine en branches depuis chaque parent.
        'parent:luc>hugo',
        'parent:sophie>hugo',
        // Luc rejoint son couple par le trait d'union, puis remonte vers ses parents.
        'union:u-luc-sophie',
        'child:u-paul-jeanne>luc',
        'parent:paul>luc',
        'parent:jeanne>luc',
        'child:u-paul-jeanne>anne',
        'parent:paul>anne',
        'parent:jeanne>anne',
      ]),
    );
  });

  it('cadre aussi les parents d’où partent les branches allumées', () => {
    const { framed } = pathHighlight(
      ['hugo', 'u-luc-sophie', 'luc', 'u-paul-jeanne', 'anne'],
      unions,
    );
    // Sophie, Paul et Jeanne ne sont pas sur le chemin, mais leurs branches le sont.
    expect(framed).toEqual(new Set(['hugo', 'luc', 'anne', 'sophie', 'paul', 'jeanne']));
  });

  it('n’allume pas un parent dont la branche n’est que traversée', () => {
    const { persons } = pathHighlight(
      ['hugo', 'u-luc-sophie', 'luc', 'u-paul-jeanne', 'anne'],
      unions,
    );
    // La branche de Sophie vers Hugo s'allume avec celle de Luc ; Sophie reste estompée.
    expect(persons.has('sophie')).toBe(false);
  });

  it('ne prend pas pour un sommet une union voisine d’une autre union', () => {
    // Le chemin filtré sur l'arbre affiché a perdu Luc, entre ses deux couples.
    const { persons } = pathHighlight(['hugo', 'u-luc-sophie', 'u-paul-jeanne', 'anne'], unions);
    expect(persons.has('sophie')).toBe(false);
    expect(persons.has('paul')).toBe(false);
  });

  it('un lien direct sans union : la branche du parent seul, dans un sens ou l’autre', () => {
    const { links } = pathHighlight(['jade', 'lea'], []);
    expect(links).toEqual(new Set(['parent:jade>lea', 'parent:lea>jade']));
  });

  it('trace le chemin étape par étape depuis Toi, chaque trait dans le sens du parcours', () => {
    const { steps } = pathHighlight(
      ['hugo', 'u-luc-sophie', 'luc', 'u-paul-jeanne', 'anne'],
      unions,
    );
    // Les traits vont du parent vers l'enfant : en remontant, ils se tracent à l'envers.
    const up = (id: string) => ({ id, reverse: true });
    const down = (id: string) => ({ id, reverse: false });
    expect(steps).toEqual([
      [up('child:u-luc-sophie>hugo'), up('parent:luc>hugo'), up('parent:sophie>hugo')],
      [down('union:u-luc-sophie')],
      [up('child:u-paul-jeanne>luc'), up('parent:paul>luc'), up('parent:jeanne>luc')],
      [down('child:u-paul-jeanne>anne'), down('parent:paul>anne'), down('parent:jeanne>anne')],
    ]);
  });

  it('sans union, la branche se trace du parent vers l’enfant, quel que soit le sens', () => {
    const { steps } = pathHighlight(['jade', 'lea'], []);
    // Une seule des deux branches existe dans l'arbre : chacune porte son sens.
    expect(steps).toEqual([
      [
        { id: 'parent:jade>lea', reverse: false },
        { id: 'parent:lea>jade', reverse: true },
      ],
    ]);
  });

  it('un chemin vide n’allume rien', () => {
    const { persons, links } = pathHighlight([], unions);
    expect(persons.size + links.size).toBe(0);
  });
});
