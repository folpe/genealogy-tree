import { describe, expect, it } from 'vitest';
import { entryWaves, firstVisibleRow } from './tree.entry';

const nodes = [
  { id: 'paul', row: 0, y: 40 },
  { id: 'jeanne', row: 0, y: 40 },
  { id: 'luc', row: 1, y: 240 },
  { id: 'hugo', row: 2, y: 440 },
];

describe('entryWaves', () => {
  it('range les bulles par génération, du haut vers le bas', () => {
    expect(entryWaves(nodes, []).persons).toEqual([['paul', 'jeanne'], ['luc'], ['hugo']]);
  });

  it('range un trait avec la génération d’où il part', () => {
    const links = [
      // Le trait d'union d'un couple part de leur rangée ; une branche, de sous elle.
      { id: 'union:u-paul-jeanne', d: 'M60,40 L140,40' },
      { id: 'child:u-paul-jeanne>luc', d: 'M100,40 C100,140 100,140 100,212' },
      { id: 'parent:luc>hugo', d: 'M100,290 C100,365 100,365 100,412' },
    ];
    expect(entryWaves(nodes, links).links).toEqual([
      ['union:u-paul-jeanne', 'child:u-paul-jeanne>luc'],
      ['parent:luc>hugo'],
      [],
    ]);
  });

  it('range l’arc d’un couple éloigné, qui part au-dessus des bulles, avec ce couple', () => {
    // Arc d'union au-dessus d'une rangée : 38 px au-dessus du centre des bulles de Luc.
    const links = [{ id: 'union:u-luc-x', d: 'M100,202 C100,126 300,126 300,202' }];
    expect(entryWaves(nodes, links).links).toEqual([[], ['union:u-luc-x'], []]);
  });

  it('range une poignée de branche avec la génération au-dessus d’elle', () => {
    const handles = [{ id: 'u-paul-jeanne', y: 140 }];
    expect(entryWaves(nodes, [], handles).handles).toEqual([['u-paul-jeanne'], [], []]);
  });

  it('un trait illisible ne bloque rien : il part avec la première génération', () => {
    expect(entryWaves(nodes, [{ id: 'x', d: '' }]).links[0]).toEqual(['x']);
  });

  it('un arbre vide ne rend aucune vague', () => {
    expect(entryWaves([], [])).toEqual({ persons: [], links: [], handles: [] });
  });
});

describe('firstVisibleRow', () => {
  const rows = [
    { id: 'a', row: 0, y: 0 },
    { id: 'b', row: 1, y: 200 },
    { id: 'c', row: 2, y: 400 },
  ];

  it('rend la plus haute génération dont une bulle touche l’écran', () => {
    expect(firstVisibleRow(rows, 150, 60)).toBe(1);
    expect(firstVisibleRow(rows, 230, 60)).toBe(1);
    expect(firstVisibleRow(rows, 270, 60)).toBe(2);
  });

  it('tout l’arbre à l’écran, ou rien au-dessous : la première génération', () => {
    expect(firstVisibleRow(rows, -100, 60)).toBe(0);
    expect(firstVisibleRow(rows, 900, 60)).toBe(0);
    expect(firstVisibleRow([], 0, 60)).toBe(0);
  });
});
