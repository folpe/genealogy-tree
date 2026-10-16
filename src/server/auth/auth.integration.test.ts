import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { accounts, invitations, memberships, sessions, users } from '../db/schema';
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
  type GoogleClaims = { sub: string; email: string; picture?: string; email_verified?: boolean };
  const anIdToken = (claims: GoogleClaims) =>
    [
      'e30',
      Buffer.from(
        JSON.stringify({ email_verified: true, ...claims, name: 'Membre de test' }),
      ).toString('base64url'),
      'sig',
    ].join('.');

  /**
   * Parcours Google complet : départ, puis retour sur le callback avec un code. Seul
   * l'échange du code contre les jetons, chez Google, est simulé.
   */
  async function signInWithGoogle(claims: GoogleClaims) {
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

    it('une adresse que Google ne dit pas vérifiée ne prend pas le compte existant', async () => {
      await inviteLuc();
      await signInWithLink('luc@exemple.fr');
      const [luc] = await client.select().from(users).where(eq(users.email, 'luc@exemple.fr'));
      expect(luc?.emailVerified).toBe(true);

      const response = await signInWithGoogle({
        sub: 'g-usurpateur',
        email: 'luc@exemple.fr',
        email_verified: false,
      });

      const location = new URL(response.headers.get('location') ?? '', BASE_URL);
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('error')).toBe('account_not_linked');
      expect(response.headers.get('set-cookie') ?? '').not.toContain('session_token=');
      const googleAccounts = await client
        .select()
        .from(accounts)
        .where(eq(accounts.providerId, 'google'));
      expect(googleAccounts).toHaveLength(0);
      expect(await client.select().from(users)).toHaveLength(2);
      expect(onGoogleAccount).not.toHaveBeenCalled();
    });

    describe('adresses Gmail, avec ou sans points', () => {
      /** Luc, invité puis inscrit par lien magique sous `a.b@gmail.com`. */
      async function lucAt(email: string) {
        await signInWithLink(ADMIN);
        const [admin] = await client.select().from(users);
        if (!admin) throw new Error('admin manquant');
        await createInvitation(client, {
          email,
          personId: 'luc',
          invitedBy: admin.id,
          now: new Date(),
        });
        await signInWithLink(email);
        const [luc] = await client.select().from(users).where(eq(users.email, email));
        if (!luc) throw new Error('compte de Luc manquant');
        return luc;
      }

      it('Google rend l’adresse sans points : même compte, même fiche, rien de créé', async () => {
        const luc = await lucAt('luc.marchand@gmail.com');
        const response = await signInWithGoogle({ sub: 'g-luc', email: 'lucmarchand@gmail.com' });
        expect(response.headers.get('set-cookie')).toContain('session_token');

        expect(await client.select().from(users)).toHaveLength(2);
        const [stored] = await client.select().from(users).where(eq(users.id, luc.id));
        expect(stored?.email).toBe('luc.marchand@gmail.com');
        const linked = await client
          .select({ providerId: accounts.providerId })
          .from(accounts)
          .where(eq(accounts.userId, luc.id));
        expect(linked.map((a) => a.providerId)).toContain('google');
      });

      it('sans `email_verified`, l’autre forme ne prend pas le compte', async () => {
        await lucAt('luc.marchand@gmail.com');
        const response = await signInWithGoogle({
          sub: 'g-usurpateur',
          email: 'lucmarchand@gmail.com',
          email_verified: false,
        });
        const location = new URL(response.headers.get('location') ?? '', BASE_URL);
        expect(location.searchParams.get('error')).toBe('account_not_linked');
        expect(response.headers.get('set-cookie') ?? '').not.toContain('session_token=');
        expect(
          await client.select().from(accounts).where(eq(accounts.providerId, 'google')),
        ).toHaveLength(0);
        expect(await client.select().from(users)).toHaveLength(2);
      });

      it('le lien magique demandé sans points ouvre le même compte', async () => {
        const luc = await lucAt('luc.marchand@gmail.com');
        sent = [];
        await auth.api.signInMagicLink({
          body: { email: 'LucMarchand+arbre@gmail.com', callbackURL: '/tree' },
          headers: new Headers({ origin: BASE_URL }),
        });
        const [link] = sent;
        if (!link) throw new Error('lien manquant');
        expect(link.email).toBe('luc.marchand@gmail.com');
        const response = await auth.handler(
          new Request(link.url, { headers: { origin: BASE_URL } }),
        );
        expect(response.headers.get('set-cookie')).toContain('session_token');
        expect(await client.select().from(users)).toHaveLength(2);
        // Une session à l'inscription, une seconde par ce lien : toutes deux à Luc.
        expect(
          await client.select().from(sessions).where(eq(sessions.userId, luc.id)),
        ).toHaveLength(2);
      });

      it('une invitation à `a.b@gmail.com` s’accepte par Google sous `ab@gmail.com`', async () => {
        await signInWithLink(ADMIN);
        const [admin] = await client.select().from(users);
        if (!admin) throw new Error('admin manquant');
        await createInvitation(client, {
          email: 'luc.marchand@gmail.com',
          personId: 'luc',
          invitedBy: admin.id,
          now: new Date(),
        });
        const response = await signInWithGoogle({ sub: 'g-luc', email: 'lucmarchand@gmail.com' });
        expect(response.headers.get('set-cookie')).toContain('session_token');

        const [luc] = await client
          .select()
          .from(users)
          .where(eq(users.email, 'lucmarchand@gmail.com'));
        const [membership] = await client
          .select()
          .from(memberships)
          .where(eq(memberships.userId, luc?.id ?? ''));
        expect(membership?.personId).toBe('luc');
        const [invitation] = await client.select().from(invitations);
        expect(invitation?.usedAt).toBeInstanceOf(Date);
      });

      it('une invitation à `a.b@gmail.com` s’accepte par lien magique sous `ab@gmail.com`', async () => {
        await signInWithLink(ADMIN);
        const [admin] = await client.select().from(users);
        if (!admin) throw new Error('admin manquant');
        await createInvitation(client, {
          email: 'luc.marchand@gmail.com',
          personId: 'luc',
          invitedBy: admin.id,
          now: new Date(),
        });
        const response = await signInWithLink('lucmarchand@gmail.com');
        expect(response?.headers.get('set-cookie')).toContain('session_token');
        const [membership] = await client
          .select()
          .from(memberships)
          .where(eq(memberships.personId, 'luc'));
        expect(membership).toBeDefined();
      });

      it('hors Gmail, un point de différence fait deux personnes', async () => {
        const luc = await lucAt('luc.marchand@exemple.fr');
        const response = await signInWithGoogle({
          sub: 'g-autre',
          email: 'lucmarchand@exemple.fr',
        });
        const location = new URL(response.headers.get('location') ?? '', BASE_URL);
        expect(location.searchParams.get('error')).toBe('unable_to_create_user');
        expect(
          await client.select().from(accounts).where(eq(accounts.userId, luc.id)),
        ).toHaveLength(0);

        sent = [];
        await expect(signInWithLink('lucmarchand@exemple.fr')).resolves.toBeUndefined();
        expect(sent).toHaveLength(0);
        expect(await client.select().from(users)).toHaveLength(2);
      });
    });

    it('un import de photo raté n’empêche pas d’entrer', async () => {
      await inviteLuc();
      onGoogleAccount.mockRejectedValue(new Error('Google injoignable'));
      const response = await signInWithGoogle({ sub: 'g-luc', email: 'luc@exemple.fr' });
      expect(response.headers.get('set-cookie')).toContain('session_token');
    });
  });
});
