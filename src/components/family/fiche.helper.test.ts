import { describe, expect, it } from 'vitest';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { relativesOf } from './fiche.helper';

const hugo = treeForViewer('m-hugo');
const ids = (people: { id: string }[]) => people.map((p) => p.id);

describe('relativesOf', () => {
  it('parents, frères et sœurs, demi-frères et sœurs', () => {
    const r = relativesOf(hugo, 'hugo');
    expect(ids(r.parents)).toEqual(['luc', 'sophie']);
    expect(ids(r.siblings)).toEqual(['lea']);
    expect(ids(r.halfSiblings)).toEqual(['maxime']);
  });

  it('les unions, en cours d’abord, avec leur conjoint ; les enfants', () => {
    const r = relativesOf(hugo, 'luc');
    expect(r.unions.map((u) => u.partner?.id)).toEqual(['sophie', 'claire']);
    expect(ids(r.children)).toEqual(['maxime', 'lea', 'hugo']);
  });

  it('qui l’a élevé, et qui elle a élevé (beau-parent)', () => {
    expect(ids(relativesOf(hugo, 'maxime').raisedBy)).toEqual(['sophie']);
    expect(ids(relativesOf(hugo, 'sophie').raised)).toEqual(['maxime']);
  });

  it('un parent non renseigné ne fait pas un demi-frère, des deux côtés', () => {
    const base = treeForViewer('m-folpe');
    // Anne n'a plus que Paul : Jeanne n'est pas renseignée, ce n'est pas un autre parent.
    const tree = {
      ...base,
      parentChildren: base.parentChildren.filter(
        (l) => !(l.childId === 'anne' && l.parentId === 'jeanne'),
      ),
    };
    expect(ids(relativesOf(tree, 'luc').siblings)).toContain('anne');
    expect(ids(relativesOf(tree, 'anne').siblings)).toContain('luc');
    expect(relativesOf(tree, 'luc').halfSiblings).toEqual([]);
  });

  it('une fiche inconnue n’a aucun proche', () => {
    expect(relativesOf(hugo, 'personne').parents).toEqual([]);
  });
});
