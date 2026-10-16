import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { accounts, invitations, memberships, users } from '../db/schema';
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
  let onGoogleAccount =
    vi.fn<(account: { userId: string; idToken: string | undefined }) => Promise<void>>();

  const auth = createAuth({
    db: client,
    secret: 'test-secret-de-trente-deux-caracteres-au-moins',
    baseURL: BASE_URL,
    passkeyRpID: 'localhost',
    bootstrapAdminEmail: ADMIN,
    sendMagicLink: async (message) => {
      sent.push(message);
    },
    google: { clientId: 'client-de-test', clientSecret: 'secret-de-test' },
    onGoogleAccount: (account) => onGoogleAccount(account),
  });

  /** Jeton de synthèse : better-auth le lit sans le vérifier dans ce parcours. */
  const anIdToken = (claims: { sub: string; email: string; picture?: string }) =>
    [
      'e30',
      Buffer.from(
        JSON.stringify({ ...claims, email_verified: true, name: 'Membre de test' }),
      ).toString('base64url'),
      'sig',
    ].join('.');

  /**
   * Parcours Google complet : départ, puis retour sur le callback avec un code. Seul
   * l'échange du code contre les jetons, chez Google, est simulé.
   */
  async function signInWithGoogle(claims: { sub: string; email: string; picture?: string }) {
    const start = await auth.api.signInSocial({
      body: { provider: 'google', callbackURL: '/tree', errorCallbackURL: '/login?via=google' },
      headers: new Headers({ origin: BASE_URL }),
      asResponse: true,
    });
    const { url } = z.object({ url: z.string() }).parse(await start.json());
    const state = new URL(url).searchParams.get('state') ?? '';
    const cookie = start.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ');
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const target = input instanceof Request ? input.url : String(input);
      if (!target.startsWith('https://oauth2.googleapis.com/token')) return realFetch(input, init);
      return Response.json({
        access_token: 'acces-de-test',
        id_token: anIdToken(claims),
        token_type: 'Bearer',
        expires_in: 3600,
      });
    });
    return auth.handler(
      new Request(`${BASE_URL}/api/auth/callback/google?code=code-de-test&state=${state}`, {
        headers: { cookie },
      }),
    );
  }

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
    onGoogleAccount = vi.fn().mockResolvedValue(undefined);
    await insertFamilyGraph(client, marchandFamily);
  });
  afterEach(() => {
    vi.restoreAllMocks();
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

  describe('Google', () => {
    const PICTURE = 'https://lh3.googleusercontent.com/a/photo-de-test=s96-c';

    async function inviteLuc() {
      await signInWithLink(ADMIN);
      const [admin] = await client.select().from(users);
      if (!admin) throw new Error('admin manquant');
      await createInvitation(client, {
        email: 'luc@exemple.fr',
        personId: 'luc',
        invitedBy: admin.id,
        now: new Date(),
      });
    }

    it('une adresse non invitée est refusée, sans compte créé', async () => {
      const response = await signInWithGoogle({ sub: 'g-inconnu', email: 'inconnu@exemple.fr' });
      const location = new URL(response.headers.get('location') ?? '', BASE_URL);
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('via')).toBe('google');
      expect(location.searchParams.get('error')).toBe('unable_to_create_user');
      expect(response.headers.get('set-cookie') ?? '').not.toContain('session_token=');
      expect(await client.select().from(users)).toHaveLength(0);
      expect(onGoogleAccount).not.toHaveBeenCalled();
    });

    it('un invité entre par Google, relié à sa fiche, et sa photo est proposée', async () => {
      await inviteLuc();
      const response = await signInWithGoogle({
        sub: 'g-luc',
        email: 'Luc@Exemple.fr',
        picture: PICTURE,
      });
      expect(response.headers.get('set-cookie')).toContain('session_token');

      const [luc] = await client.select().from(users).where(eq(users.email, 'luc@exemple.fr'));
      const [membership] = await client
        .select()
        .from(memberships)
        .where(eq(memberships.userId, luc?.id ?? ''));
      expect(membership?.personId).toBe('luc');
      expect(onGoogleAccount).toHaveBeenCalledWith({
        userId: luc?.id,
        idToken: expect.stringContaining('.'),
      });
    });

    it('un membre inscrit par lien magique retrouve son compte avec Google', async () => {
      await inviteLuc();
      await signInWithLink('luc@exemple.fr');
      const [before] = await client.select().from(users).where(eq(users.email, 'luc@exemple.fr'));

      const response = await signInWithGoogle({ sub: 'g-luc', email: 'luc@exemple.fr' });
      expect(response.headers.get('set-cookie')).toContain('session_token');

      expect(await client.select().from(users)).toHaveLength(2);
      const linked = await client
        .select({ providerId: accounts.providerId })
        .from(accounts)
        .where(eq(accounts.userId, before?.id ?? ''));
      expect(linked.map((a) => a.providerId)).toContain('google');
      expect(onGoogleAccount).toHaveBeenCalledWith(expect.objectContaining({ userId: before?.id }));
    });

    it('un import de photo raté n’empêche pas d’entrer', async () => {
      await inviteLuc();
      onGoogleAccount.mockRejectedValue(new Error('Google injoignable'));
      const response = await signInWithGoogle({ sub: 'g-luc', email: 'luc@exemple.fr' });
      expect(response.headers.get('set-cookie')).toContain('session_token');
    });
  });
});
