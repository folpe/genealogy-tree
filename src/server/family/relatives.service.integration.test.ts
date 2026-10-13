import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { memberships, users } from '../db/schema';
import { insertFamilyGraph, loadFamilyGraph } from './family.repository';
import { addRelative } from './relatives.service';

// Ajout d'un proche sur des données en base : policy, invariants et écriture d'un bloc.
const db = testDb();

describe.skipIf(!db)('relatives.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;
  const deps = { db: client };

  async function addMember(id: string, personId: string | undefined, isAdmin = false) {
    await client.insert(users).values({ id, email: `${id}@exemple.fr`, name: '' });
    await client.insert(memberships).values({ userId: id, personId, isAdmin, isOwner: isAdmin });
  }

  beforeEach(async () => {
    await reset();
    await insertFamilyGraph(client, marchandFamily);
    await addMember('u-owner', undefined, true);
    await addMember('u-luc', 'luc');
    await addMember('u-hugo', 'hugo');
    await addMember('u-anne', 'anne');
    await addMember('u-isabelle', 'isabelle');
  });
  afterAll(async () => {
    await close();
  });

  const bernardsFather = {
    anchorId: 'bernard',
    relation: 'parent',
    firstName: 'Marcel',
    lastName: 'Blanc',
    gender: 'homme',
    birth: '1910',
    birthPlace: 'Nantes',
    deceased: 'on',
  };

  it('dans la lignée : la fiche, sa naissance, son lieu et sa filiation sont écrits', async () => {
    const { personId } = await addRelative(deps, 'u-hugo', bernardsFather);
    const graph = await loadFamilyGraph(client);
    expect(graph.persons.find((p) => p.id === personId)).toMatchObject({
      firstName: 'Marcel',
      birth: { date: { precision: 'annee', year: 1910 }, place: 'Nantes' },
      death: {},
    });
    expect(graph.parentChildren).toContainEqual({
      parentId: personId,
      childId: 'bernard',
      kind: 'biologique',
    });
  });

  it('un lieu déjà connu est réutilisé, pas dupliqué', async () => {
    await addRelative(deps, 'u-hugo', bernardsFather);
    const second = await addRelative(deps, 'u-hugo', {
      ...bernardsFather,
      firstName: 'Yvonne',
      gender: 'femme',
      otherParentId: undefined,
    });
    const graph = await loadFamilyGraph(client);
    expect(graph.persons.find((p) => p.id === second.personId)?.birth?.place).toBe('Nantes');
  });

  it('un second parent en couple : l’union relie aussi la filiation existante', async () => {
    const first = await addRelative(deps, 'u-hugo', bernardsFather);
    const second = await addRelative(deps, 'u-hugo', {
      ...bernardsFather,
      firstName: 'Yvonne',
      gender: 'femme',
      otherParentId: first.personId,
    });
    const graph = await loadFamilyGraph(client);
    const union = graph.unions.find((u) => u.partnerIds.includes(second.personId));
    expect(union?.partnerIds).toEqual([first.personId, second.personId]);
    const links = graph.parentChildren.filter((l) => l.childId === 'bernard');
    expect(links.map((l) => l.unionId)).toEqual([union?.id, union?.id]);
  });

  it('hors périmètre : refusé, rien n’est écrit', async () => {
    const before = (await loadFamilyGraph(client)).persons.length;
    await expect(addRelative(deps, 'u-isabelle', bernardsFather)).rejects.toMatchObject({
      code: 'FAMILY_OUTSIDE_PERIMETER',
    });
    expect((await loadFamilyGraph(client)).persons).toHaveLength(before);
  });

  it('l’autre parent hors de portée (un ancien conjoint) bloque l’ajout', async () => {
    const before = (await loadFamilyGraph(client)).parentChildren.length;
    await expect(
      addRelative(deps, 'u-luc', {
        anchorId: 'luc',
        relation: 'child',
        firstName: 'Zoé',
        lastName: 'Marchand',
        gender: 'femme',
        otherParentId: 'claire',
      }),
    ).rejects.toMatchObject({ code: 'FAMILY_OUTSIDE_PERIMETER' });
    expect((await loadFamilyGraph(client)).parentChildren).toHaveLength(before);
  });

  it('deux ajouts simultanés ne donnent jamais trois parents', async () => {
    await addRelative(deps, 'u-owner', bernardsFather);
    const results = await Promise.allSettled([
      addRelative(deps, 'u-owner', { ...bernardsFather, firstName: 'A', gender: 'femme' }),
      addRelative(deps, 'u-owner', { ...bernardsFather, firstName: 'B', gender: 'femme' }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const graph = await loadFamilyGraph(client);
    expect(graph.parentChildren.filter((l) => l.childId === 'bernard')).toHaveLength(2);
  });

  it('un compte inconnu est refusé', async () => {
    await expect(addRelative(deps, 'u-personne', bernardsFather)).rejects.toMatchObject({
      status: 403,
    });
  });
});
