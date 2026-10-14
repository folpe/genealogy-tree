import { describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { ValidationError } from '../_shared/errors';
import { InconsistentDatesError } from './family.errors';
import { buildFamilyIndex } from './family.helper';
import { parseAddRelative, planAddRelative } from './relatives.helper';

const index = buildFamilyIndex(marchandFamily);
const ids = { person: 'new', union: 'u-new' };

const input = (overrides: Record<string, unknown>) =>
  parseAddRelative({
    anchorId: 'bernard',
    relation: 'parent',
    firstName: 'Marcel',
    lastName: 'Blanc',
    gender: 'homme',
    ...overrides,
  });

describe('parseAddRelative', () => {
  it('lit une saisie de formulaire : textes nettoyés, champs vides absents, dates lues', () => {
    const parsed = input({
      firstName: '  Marcel ',
      birthName: '',
      birthApprox: 'on',
      birthPrecision: 'vers',
      birthYear: '1910',
      birthPlace: 'Nantes',
      deceased: 'on',
      death: '',
    });
    expect(parsed).toMatchObject({
      firstName: 'Marcel',
      birth: { date: { precision: 'vers', year: 1910 }, place: 'Nantes' },
      death: {},
    });
    expect(parsed.birthName).toBeUndefined();
  });

  it('refuse une date impossible ou un champ manquant', () => {
    expect(() => input({ birth: '1990-02-30' })).toThrow(ValidationError);
    expect(() => input({ deceased: 'on', death: 'demain' })).toThrow(ValidationError);
    expect(() => input({ firstName: ' ' })).toThrow(ValidationError);
    expect(() => input({ relation: 'cousin' })).toThrow(ValidationError);
  });

  it('sans décès coché, ignore une date de décès', () => {
    expect(input({ death: '1975-01-01' }).death).toBeUndefined();
  });
});

describe('planAddRelative', () => {
  it('un parent d’une fiche sans parents : la fiche et sa filiation', () => {
    const plan = planAddRelative(index, input({}), ids);
    expect(plan.person).toMatchObject({ id: 'new', firstName: 'Marcel', lastName: 'Blanc' });
    expect(plan.parentChildren).toEqual([
      { parentId: 'new', childId: 'bernard', kind: 'biologique' },
    ]);
    expect(plan.unions).toEqual([]);
  });

  it('un second parent en couple avec le premier : l’union relie les deux filiations', () => {
    const plan = planAddRelative(
      index,
      input({ anchorId: 'tom', gender: 'homme', otherParentId: 'anne' }),
      ids,
    );
    expect(plan.unions).toEqual([{ id: 'u-new', partnerIds: ['anne', 'new'], kind: 'inconnu' }]);
    expect(plan.parentChildren).toEqual([
      { parentId: 'new', childId: 'tom', kind: 'biologique', unionId: 'u-new' },
    ]);
    expect(plan.linkUnions).toEqual([{ parentId: 'anne', childId: 'tom', unionId: 'u-new' }]);
  });

  it('refuse un troisième parent, ou un « autre parent » qui n’en est pas un', () => {
    expect(() => planAddRelative(index, input({ anchorId: 'hugo' }), ids)).toThrow(
      'Hugo a déjà ses deux parents',
    );
    expect(() =>
      planAddRelative(index, input({ anchorId: 'tom', otherParentId: 'luc' }), ids),
    ).toThrow(ValidationError);
  });

  it('ne remplace pas en silence l’union d’une filiation existante', () => {
    // Sophie est la mère de Léa dans l'union avec Luc : on retire Luc pour l'exemple.
    const graph = {
      ...marchandFamily,
      parentChildren: marchandFamily.parentChildren.filter(
        (l) => !(l.parentId === 'luc' && l.childId === 'lea'),
      ),
    };
    expect(() =>
      planAddRelative(
        buildFamilyIndex(graph),
        input({ anchorId: 'lea', otherParentId: 'sophie' }),
        ids,
      ),
    ).toThrow('appartient déjà à une union');
  });

  it('un enfant d’un couple : les deux parents, rattachés à leur union', () => {
    const plan = planAddRelative(
      index,
      input({ anchorId: 'luc', relation: 'child', firstName: 'Zoé', otherParentId: 'sophie' }),
      ids,
    );
    expect(plan.parentChildren).toEqual([
      { parentId: 'luc', childId: 'new', kind: 'biologique', unionId: 'u-luc-sophie' },
      { parentId: 'sophie', childId: 'new', kind: 'biologique', unionId: 'u-luc-sophie' },
    ]);
  });

  it('un enfant avec un « autre parent » qui n’est pas un conjoint est refusé', () => {
    expect(() =>
      planAddRelative(
        index,
        input({ anchorId: 'luc', relation: 'child', otherParentId: 'anne' }),
        ids,
      ),
    ).toThrow(ValidationError);
  });

  it('un conjoint : une union en cours, de nature inconnue', () => {
    const plan = planAddRelative(index, input({ anchorId: 'hugo', relation: 'partner' }), ids);
    expect(plan.unions).toEqual([{ id: 'u-new', partnerIds: ['hugo', 'new'], kind: 'inconnu' }]);
    expect(plan.parentChildren).toEqual([]);
  });

  it('applique les invariants du graphe : un enfant né avant son parent est refusé', () => {
    expect(() =>
      planAddRelative(
        index,
        input({ anchorId: 'luc', relation: 'child', birth: '1950-06-01' }),
        ids,
      ),
    ).toThrow(InconsistentDatesError);
  });

  it('refuse une fiche de départ inconnue', () => {
    expect(() => planAddRelative(index, input({ anchorId: 'personne' }), ids)).toThrow(
      'Fiche introuvable',
    );
  });
});
