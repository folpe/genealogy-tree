import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { adminRecordViews, media, memberships, persons, users } from '../db/schema';
import { mediaUrlKey, verifyMediaUrl } from '../media/media.url';
import { insertFamilyGraph } from './family.repository';
import { type FamilyDeps, getTreeForViewer } from './family.service';

// Spec section 6.4 sur des données en base : ce que le service renvoie est ce qui
// part vers le client. On cherche donc les fuites dans sa forme sérialisée.
const db = testDb();
const NOW = new Date('2026-10-12T09:00:00Z');

describe.skipIf(!db)('family.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;
  const mediaKey = mediaUrlKey('un-secret-de-test-assez-long-pour-better-auth');
  const deps = (now = NOW): FamilyDeps => ({ db: client, now: () => now, mediaKey });

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

  it('par défaut, la famille du lecteur : notre famille en couple, sinon son sablier', async () => {
    const luc = await getTreeForViewer(deps(), 'u-luc');
    expect(luc.shownView).toBe('couple');
    expect(luc.drawn.personIds).toEqual(expect.arrayContaining(['sophie', 'bernard', 'paul']));
    const hugo = await getTreeForViewer(deps(), 'u-hugo');
    expect(hugo.shownView).toBe('hourglass');
    expect(hugo.centerInCouple).toBe(false);
    const owner = await getTreeForViewer(deps(), 'u-owner');
    expect(owner.shownView).toBe('all');
  });

  it('dessine l’arbre depuis le lecteur : l’union passée de son père reste masquée', async () => {
    const hugo = await getTreeForViewer(deps(), 'u-hugo', { view: 'all', past: false });
    expect(hugo.drawn.unions.map((u) => u.id)).toContain('u-luc-sophie');
    expect(hugo.drawn.unions.map((u) => u.id)).not.toContain('u-luc-claire');
    expect(hugo.drawn.edges).toContainEqual({ kind: 'parent', from: 'luc', to: 'maxime' });

    await addMember('u-maxime', 'maxime');
    const maxime = await getTreeForViewer(deps(), 'u-maxime', { view: 'all', past: false });
    expect(maxime.drawn.unions.map((u) => u.id)).toContain('u-luc-claire');
  });

  it('montre les unions passées sur demande', async () => {
    const hugo = await getTreeForViewer(deps(), 'u-hugo', { view: 'all', past: true });
    expect(hugo.drawn.unions.map((u) => u.id)).toContain('u-luc-claire');
  });

  it('sablier de Hugo : ses ancêtres et lui, sans cousin ; centré sur lui', async () => {
    const tree = await getTreeForViewer(deps(), 'u-hugo', { view: 'hourglass', past: false });
    expect(tree.centerId).toBe('hugo');
    expect(tree.drawn.personIds).toEqual(
      expect.arrayContaining(['hugo', 'luc', 'sophie', 'henri']),
    );
    expect(tree.drawn.personIds).not.toContain('tom');
    expect(tree.drawn.personIds).not.toContain('lea');
  });

  it('descendants de Luc, sur une génération', async () => {
    const tree = await getTreeForViewer(deps(), 'u-hugo', {
      view: 'descendants',
      p: 'luc',
      past: false,
      depth: 1,
    });
    expect(tree.centerId).toBe('luc');
    expect(tree.drawn.personIds).toEqual(expect.arrayContaining(['luc', 'hugo', 'lea', 'maxime']));
    expect(tree.drawn.personIds).not.toContain('jade');
    expect(tree.drawn.personIds).not.toContain('henri');
  });

  it('une personne au centre inconnue retombe sur le lecteur', async () => {
    const tree = await getTreeForViewer(deps(), 'u-hugo', {
      view: 'hourglass',
      p: 'personne',
      past: false,
    });
    expect(tree.centerId).toBe('hugo');
  });

  it('les textes restent ceux de la vue filtrée : toutes les fiches, quelle que soit la vue', async () => {
    const tree = await getTreeForViewer(deps(), 'u-hugo', { view: 'hourglass', past: false });
    expect(tree.persons.map((p) => p.id)).toContain('tom');
  });

  it('dessine aussi l’arbre d’un admin non relié à une fiche', async () => {
    const tree = await getTreeForViewer(deps(), 'u-owner');
    expect(tree.drawn.personIds).toContain('hugo');
    expect(tree.drawn.unions.length).toBeGreaterThan(0);
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

  async function givePhoto(personId: string) {
    const [row] = await client
      .insert(media)
      .values({
        kind: 'photo',
        pathname: `persons/${personId}/${personId}.jpg`,
        sha256: `sha-${personId}`,
        mime: 'image/jpeg',
        bytes: 1_000,
        width: 900,
        height: 600,
        blurDataUrl: 'data:image/webp;base64,AA',
      })
      .returning({ id: media.id });
    await client.update(persons).set({ photoMediaId: row?.id }).where(eq(persons.id, personId));
    return row?.id ?? '';
  }

  it('photo de profil signée pour une fiche visible, jamais pour un mineur hors cercle', async () => {
    const lucPhoto = await givePhoto('luc');
    await givePhoto('anne');
    await givePhoto('jade');

    const forHugo = await getTreeForViewer(deps(), 'u-hugo');
    expect(forHugo.photos['luc']).toMatchObject({ width: 900, height: 600 });
    expect(forHugo.photos['jade']).toBeUndefined();
    const forIsabelle = await getTreeForViewer(deps(), 'u-isabelle');
    // Anne est au niveau « family » pour Isabelle : la photo de profil reste visible.
    expect(forIsabelle.photos['anne']).toBeDefined();
    expect(forIsabelle.photos['jade']).toBeUndefined();

    const src = new URL(forHugo.photos['luc']?.src ?? '', 'https://famille.test');
    const verdict = verifyMediaUrl({
      mediaId: lucPhoto,
      width: src.pathname.split('/')[3] ?? '',
      expires: src.searchParams.get('e') ?? undefined,
      signature: src.searchParams.get('s') ?? undefined,
      now: NOW,
      key: mediaKey,
    });
    expect(verdict.ok).toBe(true);
  });

  it('refuse un compte sans adhésion', async () => {
    await client.insert(users).values({ id: 'u-inconnu', email: 'x@exemple.fr', name: '' });
    await expect(getTreeForViewer(deps(), 'u-inconnu')).rejects.toMatchObject({ status: 403 });
  });
});
