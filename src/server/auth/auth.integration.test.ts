import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { invitations, memberships, users } from '../db/schema';
import { insertFamilyGraph } from '../family/family.repository';
import { createInvitation } from '../members/members.repository';
import { createAuth } from './auth';

// Parcours complet contre une vraie base : better-auth, plugin magic link, hooks
// d'admission. Les emails sont capturés au lieu d'être envoyés.
const db = testDb();
const BASE_URL = 'http://localhost:3000';
const ADMIN = 'folpe@exemple.fr';

describe.skipIf(!db)('auth (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;
  let sent: { email: string; url: string }[] = [];

  const auth = createAuth({
    db: client,
    secret: 'test-secret-de-trente-deux-caracteres-au-moins',
    baseURL: BASE_URL,
    passkeyRpID: 'localhost',
    bootstrapAdminEmail: ADMIN,
    sendMagicLink: async (message) => {
      sent.push(message);
    },
  });

  /** Demande un lien puis le suit, comme le ferait le navigateur. */
  async function signInWithLink(email: string) {
    await auth.api.signInMagicLink({
      body: { email, callbackURL: '/tree' },
      headers: new Headers({ origin: BASE_URL }),
    });
    const link = sent.find((m) => m.email === email);
    if (!link) return undefined;
    return auth.handler(new Request(link.url, { headers: { origin: BASE_URL } }));
  }

  beforeEach(async () => {
    await reset();
    sent = [];
    await insertFamilyGraph(client, marchandFamily);
  });
  afterAll(async () => {
    await close();
  });

  it('une adresse non invitée ne reçoit rien, et aucun compte n’est créé', async () => {
    await expect(signInWithLink('inconnu@exemple.fr')).resolves.toBeUndefined();
    expect(sent).toHaveLength(0);
    expect(await client.select().from(users)).toHaveLength(0);
  });

  it('l’admin d’amorçage entre et devient propriétaire', async () => {
    const response = await signInWithLink('Folpe@Exemple.fr');
    expect(response?.headers.get('set-cookie')).toContain('session_token');
    const [user] = await client.select().from(users);
    const [membership] = await client.select().from(memberships);
    expect(membership).toMatchObject({
      userId: user?.id,
      personId: null,
      isAdmin: true,
      isOwner: true,
    });
  });

  it('un invité entre, relié à sa fiche, et son invitation est consommée', async () => {
    await signInWithLink(ADMIN);
    const [admin] = await client.select().from(users);
    if (!admin) throw new Error('admin manquant');
    await createInvitation(client, {
      email: 'Luc@Exemple.fr',
      personId: 'luc',
      invitedBy: admin.id,
      now: new Date(),
    });

    const response = await signInWithLink('luc@exemple.fr');
    expect(response?.headers.get('set-cookie')).toContain('session_token');

    const [luc] = await client.select().from(users).where(eq(users.email, 'luc@exemple.fr'));
    const [membership] = await client
      .select()
      .from(memberships)
      .where(eq(memberships.userId, luc?.id ?? ''));
    expect(membership).toMatchObject({
      personId: 'luc',
      isAdmin: false,
      isOwner: false,
      invitedBy: admin.id,
    });
    const [invitation] = await client.select().from(invitations);
    expect(invitation?.usedAt).toBeInstanceOf(Date);
  });

  it('une invitation expirée n’ouvre rien', async () => {
    await signInWithLink(ADMIN);
    const [admin] = await client.select().from(users);
    if (!admin) throw new Error('admin manquant');
    await createInvitation(client, {
      email: 'luc@exemple.fr',
      personId: 'luc',
      invitedBy: admin.id,
      now: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    });

    await expect(signInWithLink('luc@exemple.fr')).resolves.toBeUndefined();
    expect(await client.select().from(users)).toHaveLength(1);
  });

  it('le lien ne sert qu’une fois', async () => {
    await signInWithLink(ADMIN);
    const link = sent[0];
    if (!link) throw new Error('lien manquant');
    const replay = await auth.handler(new Request(link.url, { headers: { origin: BASE_URL } }));
    expect(replay.headers.get('set-cookie') ?? '').not.toContain('session_token=');
  });
});
