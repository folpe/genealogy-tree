import { describe, expect, it } from 'vitest';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { addableRelations, parseAddIntent, relativeOptions } from './add-relative.helper';

describe('relativeOptions', () => {
  const hugo = treeForViewer('m-hugo');

  it('dans sa lignée : ajout possible ; deux parents connus, plus de parent à ajouter', () => {
    expect(relativeOptions(hugo, 'hugo')).toMatchObject({ canAdd: true, parentsFull: true });
  });

  it('un seul parent : il est proposé comme l’autre parent du nouveau', () => {
    const tom = relativeOptions(treeForViewer('m-folpe'), 'tom');
    expect(tom.parentsFull).toBe(false);
    expect(tom.singleParent).toEqual({ id: 'anne', label: 'Anne Marchand' });
  });

  it('les conjoints, l’union en cours d’abord, pour l’autre parent d’un enfant', () => {
    const luc = relativeOptions(treeForViewer('m-folpe'), 'luc');
    expect(luc.partners).toEqual([
      { id: 'sophie', label: 'Sophie Marchand', ongoing: true },
      { id: 'claire', label: expect.stringMatching(/^Claire/), ongoing: false },
    ]);
  });

  it('ne propose pas un autre parent que le lecteur ne peut pas modifier (ancien conjoint)', () => {
    const luc = relativeOptions(treeForViewer('m-luc'), 'luc');
    expect(luc.partners.map((p) => p.id)).toEqual(['sophie']);
  });

  it('hors de sa lignée : pas d’ajout direct', () => {
    expect(relativeOptions(treeForViewer('m-isabelle'), 'bernard').canAdd).toBe(false);
  });

  it('une fiche de mineur, même modifiable, ne propose pas d’ajout : son nom est masqué', () => {
    const luc = treeForViewer('m-luc');
    expect(luc.editableIds).toContain('jade');
    expect(relativeOptions(luc, 'jade').canAdd).toBe(false);
  });
});

describe('addableRelations', () => {
  it('les trois liens, sans parent quand il y en a déjà deux, rien hors de sa lignée', () => {
    const folpe = treeForViewer('m-folpe');
    expect(addableRelations(relativeOptions(folpe, 'tom')).map(([r]) => r)).toEqual([
      'parent',
      'child',
      'partner',
    ]);
    expect(addableRelations(relativeOptions(treeForViewer('m-hugo'), 'hugo'))).toEqual([
      ['child', '+ Enfant'],
      ['partner', '+ Conjoint'],
    ]);
    expect(addableRelations(relativeOptions(treeForViewer('m-isabelle'), 'bernard'))).toEqual([]);
  });
});

describe('parseAddIntent', () => {
  it('lit l’ajout demandé par l’éventail ou un lien, sinon rien', () => {
    expect(parseAddIntent('pere')).toEqual({ relation: 'parent', gender: 'homme' });
    expect(parseAddIntent('mere')).toEqual({ relation: 'parent', gender: 'femme' });
    expect(parseAddIntent('enfant')).toEqual({ relation: 'child' });
    expect(parseAddIntent(['conjoint'])).toEqual({ relation: 'partner' });
    expect(parseAddIntent('oncle')).toBeUndefined();
    expect(parseAddIntent(undefined)).toBeUndefined();
  });
});
