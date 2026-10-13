import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { invitations, memberships, users } from '../db/schema';
import { insertFamilyGraph, loadFamilyGraph } from './family.repository';
import { editPerson } from './person-edit.service';
import { listTrash, restorePerson, trashPerson } from './person-trash.service';
import { addRelative } from './relatives.service';

// Corbeille (choix de Folpe) : une fiche mise à la corbeille disparaît de l'arbre sans
// être effacée ; un admin la restaure, liens compris.
const db = testDb();

describe.skipIf(!db)('person-trash.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;
  const deps = { db: client, now: () => new Date('2026-10-13T12:00:00Z') };
  const ids = async () => (await loadFamilyGraph(client)).persons.map((p) => p.id);

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
      await client.insert(users).values({ id, email: `${id}@exemple.fr`, name: id });
      await client.insert(memberships).values({ userId: id, personId, isAdmin, isOwner: isAdmin });
    }
  });
  afterAll(async () => {
    await close();
  });

  it('une fiche sans enfant de sa lignée part à la corbeille, avec ses liens', async () => {
    await trashPerson(deps, 'u-anne', 'tom');
    const graph = await loadFamilyGraph(client);
    expect(graph.persons.some((p) => p.id === 'tom')).toBe(false);
    expect(graph.parentChildren.some((l) => l.childId === 'tom')).toBe(false);
  });

  it('un admin voit la corbeille et restaure la fiche, liens compris', async () => {
    await trashPerson(deps, 'u-anne', 'tom');
    const trash = await listTrash(deps, 'u-owner');
    expect(trash).toEqual([
      expect.objectContaining({ id: 'tom', name: 'Tom Marchand', deletedByName: 'u-anne' }),
    ]);
    await restorePerson(deps, 'u-owner', 'tom');
    const graph = await loadFamilyGraph(client);
    expect(graph.parentChildren).toContainEqual(expect.objectContaining({ childId: 'tom' }));
  });

  it('refuse : une fiche avec des enfants, une fiche reliée à un compte, hors lignée', async () => {
    await expect(trashPerson(deps, 'u-hugo', 'paul')).rejects.toMatchObject({
      code: 'FAMILY_HAS_CHILDREN',
    });
    await expect(trashPerson(deps, 'u-owner', 'luc')).rejects.toMatchObject({
      code: 'FAMILY_LINKED_ACCOUNT',
    });
    await expect(trashPerson(deps, 'u-isabelle', 'bernard')).rejects.toMatchObject({
      code: 'FAMILY_OUTSIDE_PERIMETER',
    });
    expect(await ids()).toContain('paul');
  });

  it('une fiche à la corbeille ne reçoit plus rien ; restaurer une fiche active : introuvable', async () => {
    await trashPerson(deps, 'u-anne', 'tom');
    await expect(
      addRelative(deps, 'u-anne', {
        anchorId: 'tom',
        relation: 'child',
        firstName: 'X',
        lastName: 'Y',
        gender: 'inconnu',
      }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      editPerson(deps, 'u-anne', { personId: 'tom', field: 'firstName', value: 'Z' }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(restorePerson(deps, 'u-owner', 'luc')).rejects.toMatchObject({ status: 404 });
  });

  it('une fiche qui attend une invitation reste dans l’arbre', async () => {
    await client.insert(invitations).values({
      email: 'tom@exemple.fr',
      personId: 'tom',
      invitedBy: 'u-anne',
      tokenHash: 'h',
      expiresAt: new Date('2026-12-01T00:00:00Z'),
    });
    await expect(trashPerson(deps, 'u-anne', 'tom')).rejects.toMatchObject({
      code: 'FAMILY_LINKED_ACCOUNT',
    });
  });

  it('un enfant déjà à la corbeille ne bloque pas son parent', async () => {
    await trashPerson(deps, 'u-luc', 'jade');
    await expect(trashPerson(deps, 'u-luc', 'lea')).resolves.toBeUndefined();
  });

  it('seul un admin voit et vide la corbeille', async () => {
    await trashPerson(deps, 'u-anne', 'tom');
    await expect(listTrash(deps, 'u-anne')).rejects.toMatchObject({ status: 403 });
    await expect(restorePerson(deps, 'u-anne', 'tom')).rejects.toMatchObject({ status: 403 });
  });
});
