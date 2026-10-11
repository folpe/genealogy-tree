// tdd-cover: e2e src/server/auth/auth.integration.test.ts
import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { serverEnv } from '../../env';
import * as schema from './schema';
import type { Db } from './types';

// Client de l'app, créé au premier appel puis gardé pour la durée du processus.
// `prepare: false` : la connexion poolée de Neon (pgbouncer en mode transaction)
// ne garde pas les requêtes préparées d'une transaction à l'autre.

declare global {
  var __ancesTreeDb: Db | undefined;
}

export function getDb(): Db {
  if (globalThis.__ancesTreeDb) return globalThis.__ancesTreeDb;
  const db = drizzle(postgres(serverEnv().DATABASE_URL, { prepare: false }), { schema });
  globalThis.__ancesTreeDb = db;
  return db;
}
