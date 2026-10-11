import { describe, expect, it } from 'vitest';
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
const ctx = buildAccessContext(buildFamilyIndex(marchandFamily), [...marchandMembers]);
const member = (id: string): Member => {
  const found = ctx.members.find((m) => m.id === id);
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
