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
// passkey proposée ; Google en plus quand il est configuré. Accès sur invitation
// seulement : la règle d'admission est vérifiée avant l'envoi du lien et, pour tous
// les moyens de connexion, à la création du compte.

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
  /** Identifiants OAuth Google ; sans eux, pas de connexion Google. */
  google?: { clientId: string; clientSecret: string } | undefined;
  /** Compte Google tout juste créé ou rattaché : import de la photo sur la fiche. */
  onGoogleAccount?:
    | ((account: { userId: string; idToken: string | undefined }) => Promise<unknown>)
    | undefined;
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
    ...(deps.google
      ? {
          socialProviders: {
            google: { ...deps.google, prompt: 'select_account' as const },
          },
        }
      : {}),
    account: {
      // Liaison implicite, le défaut de better-auth rendu explicite : un membre inscrit
      // par lien magique (email vérifié) qui arrive par Google à la même adresse, que
      // Google dit vérifiée, retrouve son compte. Google n'est pas « de confiance » :
      // sans `email_verified`, pas de liaison. Conditions portées par
      // `handleOAuthUserInfo`, better-auth 1.6.33, dist/oauth2/link-account.mjs :
      // ligne 21 (fournisseur de confiance), ligne 22 (`requireLocalEmailVerified`,
      // vrai par défaut), ligne 23 (refus si l'IdP ne dit pas l'adresse vérifiée, si le
      // compte local ne l'est pas, ou si la liaison est coupée), lignes 25-28
      // (`account not linked`). Prouvé par auth.integration.test.ts.
      accountLinking: { enabled: true },
    },
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
      account: {
        create: {
          // Nouveau membre ou liaison : après `user.create.after`, le membre est relié à sa fiche.
          after: async (account) => {
            if (account.providerId !== 'google' || !deps.onGoogleAccount) return;
            try {
              await deps.onGoogleAccount({
                userId: account.userId,
                idToken: account.idToken ?? undefined,
              });
            } catch {
              // La photo n'est qu'un bonus : un téléchargement ou un import raté ne doit
              // jamais empêcher d'entrer. Le membre peut toujours la choisir lui-même.
            }
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
