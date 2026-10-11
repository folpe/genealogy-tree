import { defineConfig } from 'drizzle-kit';

// Migrations par la connexion directe (non poolée) : DDL et verrous hors pgbouncer.
export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './src/server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env['DATABASE_URL_UNPOOLED'] ?? process.env['DATABASE_URL'] ?? '' },
  strict: true,
  verbose: true,
});
