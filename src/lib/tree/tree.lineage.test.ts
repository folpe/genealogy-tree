import { describe, expect, it } from 'vitest';
import { extendedFamily } from '../../../tests/fixtures/extended-family';
import { selectDisplayedGraph } from '../../server/family/family.display';
import { foldGraph, hideKey, originKey } from './tree.fold';
import { defaultFolds, foldActions, hiddenSiblings, lineageOf } from './tree.lineage';

// Lignées directes dépliées, collatéraux repliés (retour de Folpe, 2026-10-17).

const drawn = selectDisplayedGraph(extendedFamily(), { focusId: 'moi' });
const defaults = new Set(defaultFolds(drawn, 'moi'));

describe('lineageOf', () => {
  it('la personne au centre, son conjoint et tous leurs ascendants', () => {
    expect([...lineageOf(drawn, 'moi')].sort()).toEqual(
      ['moi', 'conjoint', 'pere', 'mere', 'gp-p', 'gm-p', 'gp-m', 'gm-m', 'gp-c', 'gm-c'].sort(),
    );
  });
});

describe('defaultFolds', () => {
  it('replie chaque fratrie de la lignée et les familles des conjoints venus d’ailleurs', () => {
    expect([...defaults].sort()).toEqual(
      [
        hideKey('soeur'),
        hideKey('oncle-p'),
        hideKey('tante-p'),
        hideKey('tante-m1'),
        hideKey('tante-m2'),
        hideKey('soeur-c'),
        originKey('mari-tante-p'),
        originKey('mari-tm1'),
      ].sort(),
    );
  });

  it('laisse la lignée directe et la descendance', () => {
    expect(foldGraph(drawn, defaults, 'moi').personIds.sort()).toEqual(
      [
        'gp-p',
        'gm-p',
        'gp-m',
        'gm-m',
        'gp-c',
        'gm-c',
        'pere',
        'mere',
        'moi',
        'conjoint',
        'enfant1',
        'enfant2',
      ].sort(),
    );
  });

  it('sans personne au centre dans le graphe, rien n’est replié', () => {
    expect(defaultFolds(drawn, 'inconnu')).toEqual([]);
  });
});

describe('hiddenSiblings', () => {
  it('par départ de branche, les frères et sœurs masqués dont les parents sont affichés', () => {
    const hidden = hiddenSiblings(drawn, defaults, 'moi');
    expect(hidden.get('u-gp-p')).toEqual(['oncle-p', 'tante-p']);
    expect(hidden.get('u-gp-m')).toEqual(['tante-m1', 'tante-m2']);
    expect(hidden.get('u-parents')).toEqual(['soeur']);
    expect(hidden.get('u-gp-c')).toEqual(['soeur-c']);
  });

  it('une famille d’origine repliée n’a pas de repère : ses parents ne sont pas là', () => {
    const hidden = hiddenSiblings(drawn, new Set([...defaults, originKey('pere')]), 'moi');
    expect(hidden.has('u-gp-p')).toBe(false);
  });
});

describe('foldActions', () => {
  const labels = (person: string, folded: ReadonlySet<string>) =>
    foldActions(drawn, folded, 'moi', person).map((a) => a.label);

  it('dans la lignée : sa famille d’origine et sa fratrie', () => {
    expect(labels('moi', defaults)).toEqual(['Masquer sa famille', 'Afficher ses frères et sœurs']);
    expect(labels('pere', new Set())).toEqual([
      'Masquer sa famille',
      'Masquer ses frères et sœurs',
    ]);
    // Sa famille repliée emporte sa fratrie : rien d'autre à proposer.
    expect(labels('pere', new Set([originKey('pere')]))).toEqual(['Afficher sa famille']);
    expect(foldActions(drawn, defaults, 'moi', 'moi')[1]?.keys).toEqual([hideKey('soeur')]);
  });

  it('un collatéral : sa branche ; un conjoint venu d’ailleurs : sa famille', () => {
    expect(labels('oncle-p', new Set())).toEqual(['Masquer cette branche']);
    expect(labels('mari-tante-p', new Set([originKey('mari-tante-p')]))).toEqual([
      'Afficher sa famille',
    ]);
  });

  it('les grands-parents sans parents dessinés : leur fratrie seulement, s’il y en a', () => {
    expect(labels('gp-p', defaults)).toEqual([]);
  });
});
