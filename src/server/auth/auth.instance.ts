// tdd-cover: e2e src/server/auth/auth.integration.test.ts
import 'server-only';
import { after } from 'next/server';
import { resolveAppUrl, resolveGoogleCredentials, resolvePasskeyRpID, serverEnv } from '../../env';
import { getDb } from '../db/client';
import { importGooglePhoto } from '../family/google-photo.service';
import { getMediaDeps } from '../media/media.instance';
import { magicLinkEmail } from '../notifications/email';
import { getEmailSender } from '../notifications/email.instance';
import { type Auth, createAuth } from './auth';

// Instance de l'app : créée à la première requête (jamais au build), à partir de l'env.
let cached: Auth | undefined;

export function getAuth(): Auth {
  if (cached) return cached;
  const env = serverEnv();
  const baseURL = resolveAppUrl(env);
  const sendEmail = getEmailSender();
  cached = createAuth({
    db: getDb(),
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins: [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
      .filter((host): host is string => Boolean(host))
      .map((host) => `https://${host}`),
    passkeyRpID: resolvePasskeyRpID(baseURL, env.PASSKEY_RP_ID),
    bootstrapAdminEmail: env.AUTH_BOOTSTRAP_ADMIN_EMAIL,
    sendMagicLink: async ({ email, url }) => sendEmail(await magicLinkEmail(email, url)),
    google: resolveGoogleCredentials(env),
    // Planifié après la réponse (`waitUntil` sur Vercel) : la connexion n'attend ni le
    // téléchargement chez Google ni la normalisation de l'image.
    onGoogleAccount: async (account) => {
      after(async () => {
        try {
          await importGooglePhoto({ ...getMediaDeps(), fetch }, account);
        } catch {
          // Après la réponse, rien ne remonte au membre : la photo n'est qu'un bonus, qu'il
          // peut toujours choisir lui-même. Pas de logger dans le projet pour le tracer.
        }
      });
    },
  });
  return cached;
}
