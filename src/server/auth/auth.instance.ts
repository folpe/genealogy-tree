// tdd-cover: e2e src/server/auth/auth.integration.test.ts
import 'server-only';
import { Resend } from 'resend';
import { resolveAppUrl, resolvePasskeyRpID, serverEnv } from '../../env';
import { getDb } from '../db/client';
import { createEmailSender, magicLinkEmail } from '../notifications/email';
import { type Auth, createAuth } from './auth';

// Instance de l'app : créée à la première requête (jamais au build), à partir de l'env.
let cached: Auth | undefined;

export function getAuth(): Auth {
  if (cached) return cached;
  const env = serverEnv();
  const baseURL = resolveAppUrl(env);
  const sendEmail = createEmailSender({
    from: env.EMAIL_FROM,
    isProduction: env.VERCEL_ENV === 'production' || env.VERCEL_ENV === 'preview',
    transport: env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY).emails : undefined,
    log: (line) => process.stderr.write(`${line}\n`),
  });
  cached = createAuth({
    db: getDb(),
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins: [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
      .filter((host): host is string => Boolean(host))
      .map((host) => `https://${host}`),
    passkeyRpID: resolvePasskeyRpID(baseURL, env.PASSKEY_RP_ID),
    bootstrapAdminEmail: env.AUTH_BOOTSTRAP_ADMIN_EMAIL,
    sendMagicLink: ({ email, url }) => sendEmail(magicLinkEmail(email, url)),
  });
  return cached;
}
