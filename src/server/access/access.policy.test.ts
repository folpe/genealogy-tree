import { beforeEach, describe, expect, it } from 'vitest';
import { aChildOf, aPerson, emptyGraph, exact } from '../../../tests/fixtures/builders';
import { marchandFamily, marchandMembers } from '../../../tests/fixtures/marchand-family';
import { buildFamilyIndex } from '../family/family.helper';
import {
  type AccessContext,
  buildAccessContext,
  canEdit,
  closeCircle,
  ESCALATION_DELAY_DAYS,
  escalationDue,
  guardiansOf,
  isOpenRecord,
  perimeter,
  visibilityOf,
  watchersOf,
} from './access.policy';
import type { Member } from './access.types';

const TODAY = exact(2026, 10, 9);
// Reconstruit avant chaque test : le mutation testing active les mutants sans
// recharger les modules, un contexte construit une seule fois serait périmé.
let ctx: AccessContext;
beforeEach(() => {
  ctx = buildAccessContext(buildFamilyIndex(marchandFamily), [...marchandMembers]);
});
const member = (id: string): Member => {
  const found = marchandMembers.find((m) => m.id === id);
  if (!found) throw new Error(id);
  return found;
};
const hugo = member('m-hugo');
const isabelle = member('m-isabelle');
const luc = member('m-luc');
const folpe = member('m-folpe');
const sorted = (set: Iterable<string>) => [...set].sort();
const change = (fields: string[] = ['residence']) => ({ fields });

describe('cercle proche', () => {
  it('réunit soi, conjoint, parents, enfants, frères et sœurs, demi compris', () => {
    expect(sorted(closeCircle(ctx.index, 'luc'))).toEqual(
      ['anne', 'hugo', 'jeanne', 'lea', 'luc', 'maxime', 'paul', 'sophie'].sort(),
    );
    expect(closeCircle(ctx.index, 'hugo').has('maxime')).toBe(true);
  });

  it('exclut un ancien conjoint', () => {
    expect(closeCircle(ctx.index, 'luc').has('claire')).toBe(false);
  });

  it('garde le conjoint décédé d’un veuvage', () => {
    expect(closeCircle(ctx.index, 'marie').has('jacques')).toBe(true);
  });

  it('n’inclut pas l’enfant seulement élevé', () => {
    expect(closeCircle(ctx.index, 'sophie').has('maxime')).toBe(false);
  });
});

describe('fiches ouvertes', () => {
  it('Claude : aucun membre ne l’a dans son périmètre', () => {
    expect(isOpenRecord(ctx, 'claude')).toBe(true);
  });

  it('Odette : dans la lignée de Hugo, donc protégée', () => {
    expect(isOpenRecord(ctx, 'odette')).toBe(false);
  });

  it('Jade : descendante de Luc, donc protégée', () => {
    expect(isOpenRecord(ctx, 'jade')).toBe(false);
  });

  it('Claire : ancienne compagne de Luc, donc protégée', () => {
    expect(isOpenRecord(ctx, 'claire')).toBe(false);
    expect(canEdit(ctx, luc, 'claire', change())).toMatchObject({
      mode: 'suggest',
      reason: 'outside',
    });
  });

  it('une personne inscrite n’est jamais une fiche ouverte', () => {
    expect(isOpenRecord(ctx, 'anne')).toBe(false);
  });
});

describe('périmètre', () => {
  it('Hugo : cercle, toute l’ascendance avec conjoints, et fiches ouvertes', () => {
    const p = perimeter(ctx, 'hugo');
    for (const id of [
      'hugo',
      'luc',
      'sophie',
      'lea',
      'maxime',
      'paul',
      'jeanne',
      'henri',
      'louise',
      'claude',
    ]) {
      expect(p.has(id), id).toBe(true);
    }
    for (const id of ['bernard', 'odette', 'emile', 'marthe']) expect(p.has(id), id).toBe(true);
    for (const id of ['marie', 'jacques', 'isabelle', 'anne', 'tom', 'jade', 'claire']) {
      expect(p.has(id), id).toBe(false);
    }
  });

  it('Luc : ses descendants et leurs conjoints', () => {
    const p = perimeter(ctx, 'luc');
    expect(p.has('jade')).toBe(true);
    expect(p.has('maxime')).toBe(true);
  });

  it('Isabelle : ses parents, ses grands-parents et Claude', () => {
    const p = perimeter(ctx, 'isabelle');
    for (const id of ['isabelle', 'marie', 'jacques', 'henri', 'louise', 'claude']) {
      expect(p.has(id), id).toBe(true);
    }
    for (const id of ['luc', 'paul', 'hugo', 'odette']) expect(p.has(id), id).toBe(false);
  });
});

describe('gardiens', () => {
  it('la personne elle-même si elle est inscrite', () => {
    expect(guardiansOf(ctx, 'anne')).toEqual(['m-anne']);
    expect(guardiansOf(ctx, 'isabelle')).toEqual(['m-isabelle']);
  });

  it('sinon les membres les plus proches : Paul -> Luc et Anne', () => {
    expect(guardiansOf(ctx, 'paul')).toEqual(['m-luc', 'm-anne']);
  });

  it('Marie et Jacques -> Isabelle', () => {
    expect(guardiansOf(ctx, 'marie')).toEqual(['m-isabelle']);
    expect(guardiansOf(ctx, 'jacques')).toEqual(['m-isabelle']);
  });

  it('Sophie -> Luc (conjoint) puis Hugo (enfant)', () => {
    expect(guardiansOf(ctx, 'sophie')).toEqual(['m-luc', 'm-hugo']);
  });

  it('jamais plus de trois', () => {
    expect(guardiansOf(ctx, 'henri').length).toBeLessThanOrEqual(3);
  });
});

describe('modifier : exemple de la spec (6.6)', () => {
  it.each([
    'hugo',
    'luc',
    'sophie',
    'lea',
    'maxime',
    'paul',
    'jeanne',
    'henri',
    'louise',
    'claude',
  ])('Hugo modifie directement %s', (personId) => {
    expect(canEdit(ctx, hugo, personId, change()).mode).toBe('direct');
  });

  it.each([
    ['marie', ['m-isabelle']],
    ['jacques', ['m-isabelle']],
    ['isabelle', ['m-isabelle']],
    ['anne', ['m-anne']],
  ])('Hugo suggère sur %s, la suggestion part à %j', (personId, guardians) => {
    expect(canEdit(ctx, hugo, personId, change())).toEqual({
      mode: 'suggest',
      reason: 'outside',
      guardians,
    });
  });

  it.each(['isabelle', 'marie', 'jacques', 'henri', 'louise', 'claude'])(
    'Isabelle modifie directement %s',
    (personId) => {
      expect(canEdit(ctx, isabelle, personId, change()).mode).toBe('direct');
    },
  );

  it('Isabelle ne peut que suggérer sur Luc, la suggestion part à Luc', () => {
    expect(canEdit(ctx, isabelle, 'luc', change())).toEqual({
      mode: 'suggest',
      reason: 'outside',
      guardians: ['m-luc'],
    });
  });

  it('donne la raison d’une modification directe', () => {
    expect(canEdit(ctx, hugo, 'hugo', change()).reason).toBe('self');
    expect(canEdit(ctx, hugo, 'maxime', change()).reason).toBe('circle');
    expect(canEdit(ctx, hugo, 'henri', change()).reason).toBe('lineage');
    expect(canEdit(ctx, hugo, 'claude', change()).reason).toBe('open');
  });
});

describe('veille de lignée', () => {
  it('Isabelle modifie Henri : Luc, Hugo et Anne sont prévenus', () => {
    expect(watchersOf(ctx, 'henri', { authorId: 'm-isabelle' })).toEqual([
      'm-anne',
      'm-hugo',
      'm-luc',
    ]);
  });

  it('n’inclut ni l’auteur ni un admin sans fiche', () => {
    expect(watchersOf(ctx, 'luc', { authorId: 'm-hugo' })).toEqual(['m-anne', 'm-luc']);
  });
});

describe('anti guerre d’édition', () => {
  it('une modification annulée réappliquée devient une suggestion', () => {
    expect(
      canEdit(ctx, hugo, 'henri', { fields: ['death.date'], reappliesReverted: true }),
    ).toMatchObject({ mode: 'suggest', reason: 'reverted' });
  });
});

describe('faits sourcés', () => {
  it('modifier un fait sourcé sans nouvelle source devient une suggestion', () => {
    expect(canEdit(ctx, hugo, 'henri', { fields: ['death.date'] })).toMatchObject({
      mode: 'suggest',
      reason: 'sourced',
    });
  });

  it('avec une nouvelle source, la modification est directe dans le périmètre', () => {
    expect(canEdit(ctx, hugo, 'henri', { fields: ['death.date'], withNewSource: true }).mode).toBe(
      'direct',
    );
  });

  it('un champ non sourcé reste direct', () => {
    expect(canEdit(ctx, hugo, 'henri', { fields: ['birth.place'] }).mode).toBe('direct');
  });
});

describe('admins', () => {
  it('peuvent tout trancher directement', () => {
    expect(canEdit(ctx, folpe, 'luc', change())).toEqual({
      mode: 'direct',
      reason: 'admin',
      guardians: [],
    });
  });

  it('voient tout, en journalisant les fiches restreintes', () => {
    expect(visibilityOf(ctx, folpe, 'jade', TODAY)).toEqual({ level: 'full', audit: true });
    expect(visibilityOf(ctx, folpe, 'henri', TODAY)).toEqual({ level: 'full', audit: false });
  });
});

describe('visibilité (6.4)', () => {
  it('décédés : tout pour tout le monde', () => {
    expect(visibilityOf(ctx, isabelle, 'paul', TODAY).level).toBe('full');
  });

  it('vivant dans mon périmètre : tout', () => {
    expect(visibilityOf(ctx, hugo, 'luc', TODAY).level).toBe('full');
    expect(visibilityOf(ctx, hugo, 'hugo', TODAY).level).toBe('full');
  });

  it('vivant hors périmètre : niveau famille', () => {
    expect(visibilityOf(ctx, hugo, 'anne', TODAY)).toEqual({ level: 'family', audit: false });
    expect(visibilityOf(ctx, isabelle, 'hugo', TODAY).level).toBe('family');
  });

  it('mineur : cercle proche uniquement, même dans le périmètre', () => {
    expect(visibilityOf(ctx, luc, 'jade', TODAY).level).toBe('minor');
    expect(visibilityOf(ctx, hugo, 'jade', TODAY).level).toBe('minor');
  });

  it('mineur dans le cercle proche : tout', () => {
    const graph = {
      ...emptyGraph([aPerson('p'), aPerson('k', { birth: { date: exact(2020, 1, 1) } })]),
      parentChildren: [aChildOf('p', 'k')],
    };
    const small: AccessContext = buildAccessContext(buildFamilyIndex(graph), [
      { id: 'm-p', personId: 'p', isAdmin: false, joinedAt: 1 },
    ]);
    const parent = small.members[0] as Member;
    expect(visibilityOf(small, parent, 'k', TODAY).level).toBe('full');
  });

  it('fiche restreinte au cercle : nom et liens pour les autres', () => {
    const graph = {
      ...marchandFamily,
      persons: marchandFamily.persons.map((p) =>
        p.id === 'luc' ? { ...p, visibility: 'cercle' as const } : p,
      ),
    };
    const restricted = buildAccessContext(buildFamilyIndex(graph), [...marchandMembers]);
    expect(visibilityOf(restricted, hugo, 'luc', TODAY).level).toBe('full');
    expect(visibilityOf(restricted, isabelle, 'luc', TODAY).level).toBe('structure');
    expect(visibilityOf(restricted, folpe, 'luc', TODAY)).toEqual({ level: 'full', audit: true });
  });

  it('un membre sans fiche ne voit que le niveau famille', () => {
    const pending: Member = { id: 'm-x', personId: null, isAdmin: false, joinedAt: 9 };
    expect(visibilityOf(ctx, pending, 'luc', TODAY).level).toBe('family');
    expect(canEdit(ctx, pending, 'claude', change())).toMatchObject({ mode: 'suggest' });
  });
});

describe('escalade', () => {
  const DAY = 24 * 60 * 60 * 1000;

  it('après 14 jours sans réponse', () => {
    expect(ESCALATION_DELAY_DAYS).toBe(14);
    expect(escalationDue({ createdAt: 0 }, 14 * DAY)).toBe(true);
    expect(escalationDue({ createdAt: 0 }, 14 * DAY - 1)).toBe(false);
  });

  it('jamais une suggestion déjà tranchée', () => {
    expect(escalationDue({ createdAt: 0, answeredAt: DAY }, 30 * DAY)).toBe(false);
  });
});

describe('durcissement (mutation testing)', () => {
  const small = (graph: Parameters<typeof buildFamilyIndex>[0], members: Member[]) =>
    buildAccessContext(buildFamilyIndex(graph), members);

  it('gardiens à distance 2, départagés par ancienneté, trois au plus', () => {
    expect(guardiansOf(ctx, 'henri')).toEqual(['m-luc', 'm-anne', 'm-isabelle']);
  });

  it('gardiens en remontant par les parents : Jade -> Luc', () => {
    expect(guardiansOf(ctx, 'jade')).toEqual(['m-luc']);
  });

  it('le conjoint passe avant un enfant inscrit plus tôt, l’enfant avant le parent', () => {
    const graph = {
      ...emptyGraph(['p', 'conjoint', 'aine', 'enfant', 'parent'].map((id) => aPerson(id))),
      unions: [
        { id: 'u', partnerIds: ['p', 'conjoint'] as [string, string], kind: 'mariage' as const },
      ],
      parentChildren: [aChildOf('p', 'aine'), aChildOf('p', 'enfant'), aChildOf('parent', 'p')],
    };
    const c = small(graph, [
      { id: 'm-parent', personId: 'parent', isAdmin: false, joinedAt: 1 },
      { id: 'm-enfant', personId: 'enfant', isAdmin: false, joinedAt: 2 },
      { id: 'm-conjoint', personId: 'conjoint', isAdmin: false, joinedAt: 3 },
    ]);
    expect(guardiansOf(c, 'p')).toEqual(['m-conjoint', 'm-enfant', 'm-parent']);
  });

  it('jamais plus de trois gardiens à même distance', () => {
    const kids = ['a', 'b', 'c', 'd'];
    const graph = {
      ...emptyGraph([aPerson('p'), ...kids.map((id) => aPerson(id))]),
      parentChildren: kids.map((id) => aChildOf('p', id)),
    };
    const c = small(
      graph,
      kids.map((id, i) => ({ id: `m-${id}`, personId: id, isAdmin: false, joinedAt: 10 - i })),
    );
    expect(guardiansOf(c, 'p')).toEqual(['m-d', 'm-c', 'm-b']);
  });

  it('aucun gardien sans membre', () => {
    expect(guardiansOf(small(emptyGraph([aPerson('p')]), []), 'p')).toEqual([]);
  });

  it('un partenaire inconnu n’entre pas dans le cercle proche', () => {
    const graph = {
      ...emptyGraph([aPerson('a')]),
      unions: [{ id: 'u', partnerIds: ['a', null] as [string, null], kind: 'inconnu' as const }],
    };
    expect([...closeCircle(buildFamilyIndex(graph), 'a')]).toEqual(['a']);
  });

  it('un admin sans fiche n’est jamais dans la veille de lignée, même d’une fiche ouverte', () => {
    expect(watchersOf(ctx, 'claude', { authorId: 'm-hugo' })).toEqual([
      'm-anne',
      'm-isabelle',
      'm-luc',
    ]);
  });

  it('un gardien n’est pas destinataire de sa propre suggestion', () => {
    expect(canEdit(ctx, luc, 'sophie', { fields: ['residence'], reappliesReverted: true })).toEqual(
      {
        mode: 'suggest',
        reason: 'reverted',
        guardians: ['m-hugo'],
      },
    );
  });

  it('un seul champ sourcé suffit à demander une source', () => {
    expect(canEdit(ctx, hugo, 'henri', { fields: ['birth.place', 'death.date'] }).reason).toBe(
      'sourced',
    );
  });

  it('une modification directe n’a pas de destinataire', () => {
    expect(canEdit(ctx, hugo, 'luc', change())).toEqual({
      mode: 'direct',
      reason: 'circle',
      guardians: [],
    });
  });

  it('majeur le jour de ses 18 ans', () => {
    const graph = emptyGraph([
      aPerson('majeur', { birth: { date: exact(2008, 10, 9) } }),
      aPerson('mineur', { birth: { date: exact(2008, 10, 10) } }),
      aPerson('sans-date'),
      aPerson('moi'),
    ]);
    const c = small(graph, [{ id: 'm-moi', personId: 'moi', isAdmin: false, joinedAt: 1 }]);
    const viewer = c.members[0] as Member;
    // Fiches ouvertes : visibles en entier, sauf le mineur.
    expect(visibilityOf(c, viewer, 'majeur', TODAY).level).toBe('full');
    expect(visibilityOf(c, viewer, 'mineur', TODAY).level).toBe('minor');
    expect(visibilityOf(c, viewer, 'sans-date', TODAY).level).toBe('full');
  });

  it('un membre sans fiche ne voit pas les fiches ouvertes en entier', () => {
    const pending: Member = { id: 'm-x', personId: null, isAdmin: false, joinedAt: 9 };
    expect(visibilityOf(ctx, pending, 'claude', TODAY).level).toBe('family');
  });

  it('escalade calculée depuis la date de création', () => {
    const DAY = 24 * 60 * 60 * 1000;
    expect(escalationDue({ createdAt: 10 * DAY }, 20 * DAY)).toBe(false);
    expect(escalationDue({ createdAt: 10 * DAY }, 24 * DAY)).toBe(true);
  });
});
