import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { APP_NAME } from './lib/brand';

// Variables d'environnement validées au premier usage (pas au chargement du module,
// pour que `next build` passe sans secrets). Un oubli fait échouer la première
// requête avec la liste des variables manquantes.

type UrlSources = {
  BETTER_AUTH_URL?: string | undefined;
  NEXT_PUBLIC_APP_URL?: string | undefined;
  VERCEL_BRANCH_URL?: string | undefined;
  VERCEL_URL?: string | undefined;
};

/** URL publique de l'app : explicite, sinon celle de la branche Vercel, sinon localhost. */
export function resolveAppUrl(sources: UrlSources): string {
  if (sources.BETTER_AUTH_URL) return sources.BETTER_AUTH_URL;
  if (sources.NEXT_PUBLIC_APP_URL) return sources.NEXT_PUBLIC_APP_URL;
  if (sources.VERCEL_BRANCH_URL) return `https://${sources.VERCEL_BRANCH_URL}`;
  if (sources.VERCEL_URL) return `https://${sources.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/** RP ID des passkeys : `folpe.me` en production (ADR 12), l'hôte de l'app ailleurs. */
export function resolvePasskeyRpID(appUrl: string, configured: string | undefined): string {
  return configured ?? new URL(appUrl).hostname;
}

function load() {
  return createEnv({
    server: {
      DATABASE_URL: z.url(),
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url().optional(),
      AUTH_BOOTSTRAP_ADMIN_EMAIL: z.email().optional(),
      PASSKEY_RP_ID: z.string().min(1).optional(),
      RESEND_API_KEY: z.string().startsWith('re_').optional(),
      EMAIL_FROM: z.string().min(3).default(`${APP_NAME} <famille@mail.folpe.me>`),
      VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
      VERCEL_BRANCH_URL: z.string().optional(),
      VERCEL_URL: z.string().optional(),
    },
    client: {
      NEXT_PUBLIC_APP_URL: z.url().optional(),
    },
    runtimeEnv: {
      DATABASE_URL: process.env['DATABASE_URL'],
      BETTER_AUTH_SECRET: process.env['BETTER_AUTH_SECRET'],
      BETTER_AUTH_URL: process.env['BETTER_AUTH_URL'],
      AUTH_BOOTSTRAP_ADMIN_EMAIL: process.env['AUTH_BOOTSTRAP_ADMIN_EMAIL'],
      PASSKEY_RP_ID: process.env['PASSKEY_RP_ID'],
      RESEND_API_KEY: process.env['RESEND_API_KEY'],
      EMAIL_FROM: process.env['EMAIL_FROM'],
      VERCEL_ENV: process.env['VERCEL_ENV'],
      VERCEL_BRANCH_URL: process.env['VERCEL_BRANCH_URL'],
      VERCEL_URL: process.env['VERCEL_URL'],
      NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    },
    emptyStringAsUndefined: true,
  });
}

let cached: ReturnType<typeof load> | undefined;

export function serverEnv() {
  cached ??= load();
  return cached;
}
