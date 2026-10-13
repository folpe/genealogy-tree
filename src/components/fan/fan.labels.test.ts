import { describe, expect, it } from 'vitest';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { buildFan, type FanSlot } from './fan.helper';
import { generationLabel, slotKey, slotName, slotTitle } from './fan.labels';

const fan = buildFan(treeForViewer('m-hugo'), 'hugo', 4);
const slot = (generation: number, index: number): FanSlot => {
  const found = fan?.generations[generation - 1]?.[index];
  if (!found) throw new Error(`${generation}:${index}`);
  return found;
};

describe('libellés de l’éventail', () => {
  it('une clé stable par case', () => {
    expect(slotKey(slot(2, 3))).toBe('2:3');
  });

  it('nomme une case connue depuis le lecteur, ou depuis la personne au centre', () => {
    expect(slotTitle(slot(2, 0))).toBe('Ton grand-père');
    expect(slotName(slot(2, 0))).toBe('Ton grand-père, Paul Marchand');
    expect(slotName(slot(1, 1), 'Hugo')).toBe('La mère d’Hugo, Sophie Marchand');
  });

  it('nomme une case vide par ce qu’elle attend', () => {
    expect(slotName(slot(3, 4))).toBe(
      'Ton arrière-grand-père, à découvrir : le père de Bernard Blanc',
    );
  });

  it('numérote les générations', () => {
    expect(generationLabel(1)).toBe('1re génération');
    expect(generationLabel(3)).toBe('3e génération');
  });
});
