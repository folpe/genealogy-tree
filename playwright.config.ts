import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import {
  E2E_ADMIN_EMAIL,
  E2E_BASE_URL,
  E2E_DATABASE_URL,
  E2E_PORT,
  E2E_SERVER_LOG,
} from './tests/e2e/e2e.constants';

// Parcours de bout en bout sur un build de production local, contre une base
// Postgres locale peuplée de la famille fictive Marchand (`tests/e2e/global-setup.ts`).
//
// Le serveur écrit ses logs dans `.e2e/server.log` : sans clé Resend, l'app y écrit
// les emails, et les tests y lisent le lien de connexion.

// Next ne remplace pas une variable déjà présente, même vide : chaque variable
// documentée est vidée, pour qu'aucune valeur locale réelle (clé Resend, jeton
// Blob, base Neon) ne serve pendant les tests.
const documented = readFileSync('.env.example', 'utf8')
  .split('\n')
  .map((line) => line.split('=')[0]?.trim() ?? '')
  .filter((name) => /^[A-Z][A-Z0-9_]*$/.test(name));
const blank = Object.fromEntries(
  [...documented, 'VERCEL_OIDC_TOKEN', 'VERCEL_ENV'].map((name) => [name, '']),
);

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: E2E_BASE_URL, trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `mkdir -p .e2e && bun run build && bun run start --port ${E2E_PORT} 2> ${E2E_SERVER_LOG}`,
    url: `${E2E_BASE_URL}/login`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      ...blank,
      DATABASE_URL: E2E_DATABASE_URL,
      // Tiré à chaque passage : aucune session ne survit d'un passage à l'autre.
      BETTER_AUTH_SECRET: randomBytes(32).toString('base64url'),
      BETTER_AUTH_URL: E2E_BASE_URL,
      NEXT_PUBLIC_APP_URL: E2E_BASE_URL,
      AUTH_BOOTSTRAP_ADMIN_EMAIL: E2E_ADMIN_EMAIL,
      EMAIL_FROM: 'Ances-Tree <famille@famille.test>',
    },
  },
});
