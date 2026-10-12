import { describe, expect, it } from 'vitest';
import { exact } from '../../../tests/fixtures/builders';
import { marchandFamily, marchandMembers } from '../../../tests/fixtures/marchand-family';
import { buildFamilyIndex } from '../family/family.helper';
import type { FamilyGraph } from '../family/family.types';
import { buildAccessContext } from './access.policy';
import type { Member } from './access.types';
import { viewTreeAs } from './access.view';

const TODAY = exact(2026, 10, 9);
const member = (id: string): Member => {
  const found = marchandMembers.find((m) => m.id === id);
  if (!found) throw new Error(id);
  return found;
};

/** La famille Marchand, avec un mariage Luc-Sophie daté au jour près et des retouches. */
function family(patch: (graph: FamilyGraph) => FamilyGraph = (g) => g): FamilyGraph {
  return patch({
    ...marchandFamily,
    unions: marchandFamily.unions.map((u) =>
      u.id === 'u-luc-sophie' ? { ...u, start: exact(1990, 6, 2) } : u,
    ),
  });
}

function view(viewerId: string, graph = family()) {
  const ctx = buildAccessContext(buildFamilyIndex(graph), [...marchandMembers]);
  return viewTreeAs(ctx, member(viewerId), TODAY);
}
const personIn = (tree: ReturnType<typeof view>, id: string) =>
  tree.persons.find((p) => p.id === id);
const unionIn = (tree: ReturnType<typeof view>, id: string) => tree.unions.find((u) => u.id === id);

describe('viewTreeAs', () => {
  it('garde toutes les fiches et tous les liens, dans l’ordre du graphe', () => {
    const tree = view('m-hugo');
    expect(tree.persons.map((p) => p.id)).toEqual(marchandFamily.persons.map((p) => p.id));
    expect(tree.parentChildren).toEqual(marchandFamily.parentChildren);
    expect(tree.unions.map((u) => u.id)).toEqual(marchandFamily.unions.map((u) => u.id));
  });

  it('projette chaque fiche au niveau que la policy accorde', () => {
    const tree = view('m-hugo');
    expect(personIn(tree, 'luc')).toMatchObject({ level: 'full', residence: 'Toulouse' });
    expect(personIn(tree, 'anne')).toEqual({
      level: 'family',
      id: 'anne',
      firstName: 'Anne',
      lastName: 'Marchand',
      gender: 'femme',
      birth: { date: { precision: 'annee', year: 1960 }, place: 'Toulouse' },
    });
    expect(personIn(tree, 'jade')).toMatchObject({ level: 'minor', initials: 'JM' });
  });

  it('laisse une union intacte quand je vois ses deux partenaires en entier', () => {
    expect(unionIn(view('m-hugo'), 'u-luc-sophie')?.start).toEqual(exact(1990, 6, 2));
  });

  it('ramène à l’année les dates d’une union de vivants hors périmètre', () => {
    expect(unionIn(view('m-isabelle'), 'u-luc-sophie')?.start).toEqual({
      precision: 'annee',
      year: 1990,
    });
  });

  it('retire les dates d’une union dont un partenaire a restreint sa fiche', () => {
    const restricted = family((g) => ({
      ...g,
      persons: g.persons.map((p) => (p.id === 'luc' ? { ...p, visibility: 'cercle' } : p)),
      unions: g.unions.map((u) =>
        u.id === 'u-luc-claire'
          ? { ...u, end: { date: exact(1989, 3, 1), reason: 'separation' } }
          : u,
      ),
    }));
    const tree = view('m-isabelle', restricted);
    expect(unionIn(tree, 'u-luc-sophie')).toEqual({
      id: 'u-luc-sophie',
      partnerIds: ['luc', 'sophie'],
      kind: 'mariage',
    });
    expect(unionIn(tree, 'u-luc-claire')?.end).toEqual({ reason: 'separation' });
  });

  it('n’audite rien pour un membre', () => {
    expect(view('m-hugo').audited).toEqual([]);
  });

  it('montre tout à un admin et liste les fiches qu’il ne verrait pas autrement', () => {
    const tree = view('m-folpe');
    expect(tree.persons.every((p) => p.level === 'full')).toBe(true);
    expect(unionIn(tree, 'u-luc-sophie')?.start).toEqual(exact(1990, 6, 2));
    expect(tree.audited).toContain('jade');
    expect(tree.audited).toContain('luc');
    expect(tree.audited).not.toContain('henri');
  });
});
