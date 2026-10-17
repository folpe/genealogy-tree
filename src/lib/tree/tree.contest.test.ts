import { describe, expect, it } from 'vitest';
import { lineagesFamily, lineagesFamilyBothSides } from '../../../tests/fixtures/lineages-family';
import { selectDisplayedGraph } from '../../server/family/family.display';
import { contests, settleFolds } from './tree.contest';
import { hideKey, originKey } from './tree.fold';
import { defaultFolds } from './tree.lineage';

// Zéro croisement sur la lignée directe (décision de Folpe, 2026-10-17, comme
// MyHeritage) : déplier l'un replie l'autre, la dernière action du lecteur gagne.

const drawn = selectDisplayedGraph(lineagesFamily(), { focusId: 'moi' });
const defaults = defaultFolds(drawn, 'moi');
const maternal = [hideKey('tante-b'), hideKey('oncle-b')];
const without = (keys: string[], removed: string[]) => keys.filter((k) => !removed.includes(k));
const sorted = (keys: Iterable<string>) => [...keys].sort();

describe('contests', () => {
  it('lignées seules : rien ne se dispute', () => {
    expect(contests(drawn, new Set(defaults), 'moi')).toEqual([]);
  });

  it('les cousins du côté de ma mère et la famille d’elle se disputent ma droite', () => {
    expect(contests(drawn, new Set(without(defaults, maternal)), 'moi')).toEqual([
      { origin: 'elle', collaterals: ['tante-b'] },
    ]);
  });

  it('une fratrie sans enfants ne descend pas jusqu’à nous : elle ne gêne rien', () => {
    expect(contests(drawn, new Set(without(defaults, [hideKey('oncle-b')])), 'moi')).toEqual([]);
  });

  it('la famille d’elle repliée : plus rien à disputer', () => {
    const folded = new Set([...without(defaults, maternal), originKey('elle')]);
    expect(contests(drawn, folded, 'moi')).toEqual([]);
  });
});

describe('settleFolds', () => {
  it('déplier les oncles et tantes de ma mère replie la famille d’elle', () => {
    const settled = settleFolds(drawn, 'moi', defaults, without(defaults, maternal));
    expect(sorted(settled.folded)).toEqual(
      sorted([...without(defaults, maternal), originKey('elle')]),
    );
    expect(settled.closed).toEqual([{ kind: 'family', personId: 'elle' }]);
  });

  it('déplier la famille d’elle replie la branche qui la gênait, pas les autres', () => {
    const before = [...without(defaults, maternal), originKey('elle')];
    const settled = settleFolds(drawn, 'moi', before, without(defaults, maternal));
    expect(sorted(settled.folded)).toEqual(
      sorted([...defaults.filter((k) => k !== hideKey('oncle-b'))]),
    );
    expect(settled.closed).toEqual([{ kind: 'branch', personId: 'tante-b' }]);
  });

  it('« Tout afficher » : toute ma famille, celle d’elle repliée derrière son repère', () => {
    const settled = settleFolds(drawn, 'moi', defaults, []);
    expect(settled.folded).toEqual([originKey('elle')]);
    expect(settled.closed).toEqual([{ kind: 'family', personId: 'elle' }]);
  });

  it('sans dispute, les plis demandés restent tels quels', () => {
    const asked = without(defaults, [hideKey('oncle-a'), hideKey('soeur-e')]);
    expect(settleFolds(drawn, 'moi', defaults, asked)).toEqual({ folded: asked, closed: [] });
  });

  it('un état déjà disputé (mémoire d’avant) : ma famille l’emporte', () => {
    const asked = without(defaults, maternal);
    const settled = settleFolds(drawn, 'moi', asked, asked);
    expect(settled.closed).toEqual([{ kind: 'family', personId: 'elle' }]);
  });
});

describe('settleFolds, de l’autre côté du couple', () => {
  const both = selectDisplayedGraph(lineagesFamilyBothSides(), { focusId: 'moi' });
  const start = defaultFolds(both, 'moi');

  it('déplier l’oncle d’elle, du côté de moi, replie ma famille', () => {
    const settled = settleFolds(both, 'moi', start, without(start, [hideKey('oncle-e')]));
    expect(settled.closed).toEqual([{ kind: 'family', personId: 'moi' }]);
    expect(contests(both, new Set(settled.folded), 'moi')).toEqual([]);
  });

  it('puis redéplier ma famille replie l’oncle d’elle', () => {
    const before = [...without(start, [hideKey('oncle-e')]), originKey('moi')];
    const settled = settleFolds(both, 'moi', before, without(start, [hideKey('oncle-e')]));
    expect(settled.closed).toEqual([{ kind: 'branch', personId: 'oncle-e' }]);
    expect(sorted(settled.folded)).toEqual(sorted(start));
  });

  it('« Tout afficher » : ma famille entière, celle d’elle repliée', () => {
    expect(settleFolds(both, 'moi', start, []).folded).toEqual([originKey('elle')]);
  });
});
