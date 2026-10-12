// tdd-cover: e2e src/server/notifications/email.test.ts
import 'server-only';
import { Resend } from 'resend';
import { serverEnv } from '../../env';
import { createEmailSender, type EmailMessage } from './email';

// Expéditeur de l'app. Sur Vercel (preview comme production), jamais de lien dans les logs.
let cached: ((message: EmailMessage) => Promise<void>) | undefined;

export function getEmailSender() {
  if (cached) return cached;
  const env = serverEnv();
  cached = createEmailSender({
    from: env.EMAIL_FROM,
    isProduction: env.VERCEL_ENV === 'production' || env.VERCEL_ENV === 'preview',
    transport: env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY).emails : undefined,
    log: (line) => process.stderr.write(`${line}\n`),
  });
  return cached;
}
