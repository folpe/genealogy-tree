// tdd-cover: e2e src/server/auth/auth.integration.test.ts
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import { APP_NAME } from '../../lib/brand';
import { accounts, passkeys, rateLimits, sessions, users, verifications } from '../db/schema';
import type { Db } from '../db/types';
import { decideAdmission, normalizeEmail } from '../members/admission';
import { admitUser, findPendingInvitation } from '../members/members.repository';

// Connexion sans mot de passe (spec section 6.5) : lien magique par email, puis
// passkey proposée. Accès sur invitation seulement : la règle d'admission est
// vérifiée avant l'envoi du lien et, par sécurité, à la création du compte.

/** Durée de validité d'un lien de connexion. */
const MAGIC_LINK_TTL_SECONDS = 15 * 60;

export type AuthDeps = {
  db: Db;
  secret: string;
  baseURL: string;
  trustedOrigins?: string[] | undefined;
  passkeyRpID: string;
  bootstrapAdminEmail?: string | undefined;
  sendMagicLink: (message: { email: string; url: string }) => Promise<void>;
};

export function createAuth(deps: AuthDeps) {
  const { db } = deps;

  async function admissionFor(email: string) {
    const invitation = await findPendingInvitation(db, email);
    return decideAdmission({
      email,
      now: new Date(),
      bootstrapAdminEmail: deps.bootstrapAdminEmail,
      invitation,
    });
  }

  async function hasAccount(email: string) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizeEmail(email)));
    return user !== undefined;
  }

  return betterAuth({
    secret: deps.secret,
    baseURL: deps.baseURL,
    ...(deps.trustedOrigins ? { trustedOrigins: deps.trustedOrigins } : {}),
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
        rateLimit: rateLimits,
        passkey: passkeys,
      },
    }),
    session: {
      // Les aînés se reconnectent rarement : 30 jours, prolongés à chaque visite.
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const admission = await admissionFor(user.email);
            if (!admission.admitted) return false;
            return { data: { ...user, email: normalizeEmail(user.email) } };
          },
          // Après la création seulement : une création échouée ne consomme pas l'invitation.
          after: async (user) => {
            const admission = await admissionFor(user.email);
            if (!admission.admitted) return;
            await admitUser(db, { userId: user.id, admission, now: new Date() });
          },
        },
      },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      modelName: 'rateLimit',
      customRules: { '/sign-in/magic-link': { window: 60, max: 5 } },
    },
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_TTL_SECONDS,
        storeToken: 'hashed',
        // Même réponse pour une adresse inconnue : on n'envoie rien, sans le dire.
        sendMagicLink: async ({ email, url }) => {
          if (!(await hasAccount(email)) && !(await admissionFor(email)).admitted) return;
          await deps.sendMagicLink({ email, url });
        },
      }),
      passkey({
        rpID: deps.passkeyRpID,
        rpName: APP_NAME,
        origin: deps.baseURL,
      }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
