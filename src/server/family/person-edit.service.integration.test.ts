import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { memberships, users } from '../db/schema';
import { insertFamilyGraph, loadFamilyGraph } from './family.repository';
import { editPerson } from './person-edit.service';

// Modification sur place, en base : policy par champ, invariants, écriture ciblée.
const db = testDb();

describe.skipIf(!db)('person-edit.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;
  const deps = { db: client };
  const person = async (id: string) =>
    (await loadFamilyGraph(client)).persons.find((p) => p.id === id);

  beforeEach(async () => {
    await reset();
    await insertFamilyGraph(client, marchandFamily);
    for (const [id, personId, isAdmin] of [
      ['u-owner', undefined, true],
      ['u-luc', 'luc', false],
      ['u-hugo', 'hugo', false],
      ['u-anne', 'anne', false],
      ['u-isabelle', 'isabelle', false],
    ] as const) {
      await client.insert(users).values({ id, email: `${id}@exemple.fr`, name: '' });
      await client.insert(memberships).values({ userId: id, personId, isAdmin, isOwner: isAdmin });
    }
  });
  afterAll(async () => {
    await close();
  });

  it('un champ de texte, puis un champ facultatif vidé', async () => {
    await editPerson(deps, 'u-hugo', { personId: 'luc', field: 'firstName', value: 'Lucien' });
    expect((await person('luc'))?.firstName).toBe('Lucien');
    await editPerson(deps, 'u-hugo', { personId: 'luc', field: 'nickname', value: '' });
    expect((await person('luc'))?.nickname).toBeUndefined();
  });

  it('naissance : mois et année, et lieu, un lieu connu réutilisé', async () => {
    await editPerson(deps, 'u-hugo', {
      personId: 'luc',
      field: 'birth',
      dateApprox: 'on',
      datePrecision: 'mois',
      dateYear: '1963',
      dateMonth: '3',
      place: 'Albi',
    });
    expect((await person('luc'))?.birth).toEqual({
      date: { precision: 'mois', year: 1963, month: 3 },
      place: 'Albi',
    });
  });

  it('résidence changée, puis retirée', async () => {
    await editPerson(deps, 'u-hugo', { personId: 'luc', field: 'residence', value: 'Lyon' });
    expect((await person('luc'))?.residence).toBe('Lyon');
    await editPerson(deps, 'u-hugo', { personId: 'luc', field: 'residence', value: '' });
    expect((await person('luc'))?.residence).toBeUndefined();
  });

  it('décès coché sans date, puis décoché', async () => {
    await editPerson(deps, 'u-hugo', { personId: 'luc', field: 'death', deceased: 'on' });
    expect((await person('luc'))?.death).toEqual({});
    await editPerson(deps, 'u-hugo', { personId: 'luc', field: 'death' });
    expect((await person('luc'))?.death).toBeUndefined();
  });

  it('un fait sourcé ne se modifie pas directement', async () => {
    await expect(
      editPerson(deps, 'u-hugo', {
        personId: 'henri',
        field: 'death',
        deceased: 'on',
        date: '1980-01-01',
      }),
    ).rejects.toMatchObject({ code: 'FAMILY_SOURCED' });
  });

  it('hors de sa lignée : refusé, rien n’est écrit', async () => {
    await expect(
      editPerson(deps, 'u-isabelle', { personId: 'bernard', field: 'firstName', value: 'X' }),
    ).rejects.toMatchObject({ code: 'FAMILY_OUTSIDE_PERIMETER' });
    expect((await person('bernard'))?.firstName).toBe('Bernard');
  });

  it('un décès avant la naissance est refusé', async () => {
    await expect(
      editPerson(deps, 'u-hugo', {
        personId: 'luc',
        field: 'death',
        deceased: 'on',
        date: '1950-01-01',
      }),
    ).rejects.toMatchObject({ code: 'FAMILY_INCONSISTENT_DATES' });
  });
});
