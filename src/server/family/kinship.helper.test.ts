import { describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { buildFamilyIndex } from './family.helper';
import { commonAncestors, findRelationshipPath, relationship } from './kinship.helper';

const index = buildFamilyIndex(marchandFamily);

describe('commonAncestors', () => {
  it('trouve le couple le plus proche', () => {
    expect(commonAncestors(index, 'hugo', 'isabelle')).toEqual(['henri', 'louise']);
  });

  it('trouve un seul parent commun entre demi-frères', () => {
    expect(commonAncestors(index, 'hugo', 'maxime')).toEqual(['luc']);
  });

  it('inclut la personne elle-même en ligne directe', () => {
    expect(commonAncestors(index, 'hugo', 'paul')).toEqual(['paul']);
  });

  it('est vide sans lien de sang', () => {
    expect(commonAncestors(index, 'hugo', 'jacques')).toEqual([]);
  });
});

describe('relationship', () => {
  it('décrit un lien de sang par générations', () => {
    expect(relationship(index, 'hugo', 'isabelle')).toMatchObject({
      type: 'blood',
      up: 3,
      down: 2,
      half: false,
      common: ['henri', 'louise'],
      parentOnPath: 'luc',
    });
  });

  it('repère les demi-frères', () => {
    expect(relationship(index, 'hugo', 'maxime')).toMatchObject({
      type: 'blood',
      up: 1,
      down: 1,
      half: true,
    });
  });

  it('décrit le conjoint d’un parent de sang', () => {
    expect(relationship(index, 'hugo', 'jacques')).toMatchObject({
      type: 'spouseOfRelative',
      relativeId: 'marie',
      ongoing: true,
    });
  });

  it('décrit un parent de sang du conjoint', () => {
    expect(relationship(index, 'sophie', 'paul')).toMatchObject({
      type: 'relativeOfSpouse',
      spouseId: 'luc',
    });
  });

  it('décrit la filiation « a élevé » dans les deux sens', () => {
    expect(relationship(index, 'maxime', 'sophie')).toEqual({ type: 'raised', raisedMe: true });
    expect(relationship(index, 'sophie', 'maxime')).toEqual({ type: 'raised', raisedMe: false });
  });
});

describe('findRelationshipPath', () => {
  it('passe par les unions comme dans l’arbre', () => {
    expect(findRelationshipPath(index, 'hugo', 'isabelle')).toEqual([
      'hugo',
      'u-luc-sophie',
      'luc',
      'u-paul-jeanne',
      'paul',
      'u-henri-louise',
      'marie',
      'u-marie-jacques',
      'isabelle',
    ]);
  });

  it('suit une filiation sans union', () => {
    expect(findRelationshipPath(index, 'jade', 'lea')).toEqual(['jade', 'lea']);
  });

  it('retourne une liste vide sans chemin', () => {
    expect(findRelationshipPath(index, 'hugo', 'inconnu')).toEqual([]);
  });
});
