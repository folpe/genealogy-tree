import { describe, expect, it } from 'vitest';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { paletteItems, pushRecent, recentItems } from './command-palette.helper';

const tree = treeForViewer('m-hugo');
const directory = {
  persons: tree.persons,
  relations: { jeanne: 'ta grand-mère', luc: 'ton père', hugo: 'toi' },
  proximity: { hugo: 0, luc: 1, jeanne: 2 },
};

describe('paletteItems', () => {
  it('cherche par nom de naissance et décrit la personne', () => {
    const [jeanne] = paletteItems(directory, 'roux');
    expect(jeanne).toMatchObject({
      id: 'jeanne',
      name: 'Jeanne Marchand',
      detail: 'née Roux, 1934 - 2019',
      relation: 'ta grand-mère',
    });
  });

  it('ignore les accents, et les proches passent devant', () => {
    expect(paletteItems(directory, 'emile')[0]?.name).toBe('Émile Roux');
    expect(paletteItems(directory, 'marchand')[0]?.id).toBe('hugo');
  });

  it('une requête vide ne cherche rien', () => {
    expect(paletteItems(directory, '  ')).toEqual([]);
  });
});

describe('récemment consultés', () => {
  it('le dernier en tête, sans doublon, cinq au plus', () => {
    let recent: string[] = [];
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'b']) recent = pushRecent(recent, id);
    expect(recent).toEqual(['b', 'f', 'e', 'd', 'c']);
  });

  it('ne montre que les fiches encore visibles', () => {
    expect(recentItems(directory, ['luc', 'disparu']).map((i) => i.id)).toEqual(['luc']);
  });
});
