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

  it('une fiche inconnue n’a aucun proche', () => {
    expect(relativesOf(hugo, 'personne').parents).toEqual([]);
  });
});
