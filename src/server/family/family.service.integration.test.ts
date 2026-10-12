import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { adminRecordViews, memberships, users } from '../db/schema';
import { insertFamilyGraph } from './family.repository';
import { type FamilyDeps, getTreeForViewer } from './family.service';

// Spec section 6.4 sur des données en base : ce que le service renvoie est ce qui
// part vers le client. On cherche donc les fuites dans sa forme sérialisée.
const db = testDb();
const NOW = new Date('2026-10-12T09:00:00Z');

describe.skipIf(!db)('family.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;
  const deps = (now = NOW): FamilyDeps => ({ db: client, now: () => now });

  async function addMember(id: string, personId: string | undefined, isAdmin = false) {
    await client.insert(users).values({ id, email: `${id}@exemple.fr`, name: '' });
    await client.insert(memberships).values({ userId: id, personId, isAdmin, isOwner: isAdmin });
  }
  const payload = async (userId: string) => JSON.stringify(await getTreeForViewer(deps(), userId));

  beforeEach(async () => {
    await reset();
    await insertFamilyGraph(client, marchandFamily);
    await addMember('u-owner', undefined, true);
    // Les comptes des maquettes : sans eux, des fiches deviendraient « ouvertes ».
    await addMember('u-luc', 'luc');
    await addMember('u-hugo', 'hugo');
    await addMember('u-anne', 'anne');
    await addMember('u-isabelle', 'isabelle');
  });
  afterAll(async () => {
    await close();
  });

  it('hors périmètre : ni date exacte ni résidence d’un vivant dans la réponse', async () => {
    const json = await payload('u-isabelle');
    // Anne (née le 2 mai 1960, à Bordeaux) et Tom (à Bordeaux) sont hors du périmètre d'Isabelle.
    expect(json).not.toContain('Bordeaux');
    expect(json).not.toMatch(/"year":1960,"month"/);
    expect(json).toContain('"firstName":"Anne"');
  });

  it('dans mon périmètre : la fiche entière', async () => {
    const tree = await getTreeForViewer(deps(), 'u-hugo');
    expect(tree.persons.find((p) => p.id === 'luc')).toMatchObject({
      level: 'full',
      residence: 'Toulouse',
      birth: { date: { precision: 'exacte', year: 1963, month: 8, day: 21 } },
    });
  });

  it('un mineur hors du cercle proche : prénom et initiales, rien d’autre', async () => {
    const tree = await getTreeForViewer(deps(), 'u-hugo');
    expect(tree.persons.find((p) => p.id === 'jade')).toEqual({
      level: 'minor',
      id: 'jade',
      firstName: 'Jade',
      initials: 'JM',
      gender: 'femme',
    });
  });

  it('range chaque fiche dans sa génération', async () => {
    const tree = await getTreeForViewer(deps(), 'u-hugo');
    expect(tree.generations).toMatchObject({ henri: 0, paul: 1, luc: 2, hugo: 3, jade: 4 });
    expect(tree.viewerPersonId).toBe('hugo');
  });

  it('un admin voit tout, et ses lectures de fiches protégées sont journalisées une fois par jour', async () => {
    const tree = await getTreeForViewer(deps(), 'u-owner');
    expect(tree.persons.every((p) => p.level === 'full')).toBe(true);
    await getTreeForViewer(deps(new Date('2026-10-12T20:00:00Z')), 'u-owner');

    const views = await client.select().from(adminRecordViews);
    const living = marchandFamily.persons.filter((p) => p.death === undefined).length;
    expect(views).toHaveLength(living);
    expect(views.every((v) => v.userId === 'u-owner' && v.viewedOn === '2026-10-12')).toBe(true);
    expect(views.map((v) => v.personId)).toContain('jade');

    await getTreeForViewer(deps(new Date('2026-10-13T09:00:00Z')), 'u-owner');
    expect(await client.select().from(adminRecordViews)).toHaveLength(living * 2);
  });

  it('un membre ne laisse aucune trace dans le journal admin', async () => {
    await getTreeForViewer(deps(), 'u-isabelle');
    expect(await client.select().from(adminRecordViews)).toHaveLength(0);
  });

  it('refuse un compte sans adhésion', async () => {
    await client.insert(users).values({ id: 'u-inconnu', email: 'x@exemple.fr', name: '' });
    await expect(getTreeForViewer(deps(), 'u-inconnu')).rejects.toMatchObject({ status: 403 });
  });
});
