import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson } from '../../../tests/fixtures/builders';
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

describe('durcissement (mutation testing)', () => {
  it('une ligne directe n’est jamais « demi »', () => {
    expect(relationship(index, 'hugo', 'paul')).toMatchObject({ half: false, parentOnPath: 'luc' });
    expect(relationship(index, 'paul', 'hugo')).toMatchObject({ half: false, parentOnPath: null });
  });

  it('trouve le parent par lequel passe le lien, côté mère', () => {
    expect(relationship(index, 'hugo', 'odette')).toMatchObject({ parentOnPath: 'sophie' });
  });

  it('le chemin ne passe pas par la filiation « a élevé »', () => {
    expect(findRelationshipPath(index, 'hugo', 'maxime')).toEqual([
      'hugo',
      'u-luc-sophie',
      'luc',
      'u-luc-claire',
      'maxime',
    ]);
  });

  it('suit une filiation sans union vers le bas', () => {
    expect(findRelationshipPath(index, 'lea', 'jade')).toEqual(['lea', 'jade']);
  });

  it('retourne une liste vide si le départ est inconnu', () => {
    expect(findRelationshipPath(index, 'inconnu', 'hugo')).toEqual([]);
  });

  it('ignore les proches d’un ancien conjoint', () => {
    const graph = {
      ...marchandFamily,
      persons: [...marchandFamily.persons, aPerson('mere-claire', { gender: 'femme' })],
      parentChildren: [...marchandFamily.parentChildren, aChildOf('mere-claire', 'claire')],
    };
    const idx = buildFamilyIndex(graph);
    expect(relationship(idx, 'luc', 'mere-claire')).toMatchObject({
      type: 'none',
      connected: true,
    });
  });

  it('retient le parent de sang le plus proche quand plusieurs conviennent', () => {
    // Jacques a été marié à Marie (grand-tante de Hugo) puis à Anne (tante de Hugo).
    const graph = {
      ...marchandFamily,
      unions: [...marchandFamily.unions, anUnion('u-anne-jacques', 'anne', 'jacques')],
    };
    const idx = buildFamilyIndex(graph);
    expect(relationship(idx, 'hugo', 'jacques')).toMatchObject({
      type: 'spouseOfRelative',
      relativeId: 'anne',
    });
    const reversed = {
      ...graph,
      unions: [anUnion('u-anne-jacques', 'anne', 'jacques'), ...marchandFamily.unions],
    };
    expect(relationship(buildFamilyIndex(reversed), 'hugo', 'jacques')).toMatchObject({
      relativeId: 'anne',
    });
  });

  it('demi-cousins : branches issues de deux unions différentes', () => {
    const graph = {
      ...marchandFamily,
      persons: [...marchandFamily.persons, aPerson('kid-max'), aPerson('kid-lea')],
      parentChildren: [
        ...marchandFamily.parentChildren,
        aChildOf('maxime', 'kid-max'),
        aChildOf('lea', 'kid-lea'),
      ],
    };
    expect(relationship(buildFamilyIndex(graph), 'kid-max', 'kid-lea')).toMatchObject({
      up: 2,
      down: 2,
      half: true,
      common: ['luc'],
    });
  });
});
