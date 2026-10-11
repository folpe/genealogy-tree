import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../src/server/db/schema';
import type { Db } from '../../src/server/db/types';

const TABLES = [
  'sourced_facts',
  'media_persons',
  'residences',
  'events',
  'parent_child',
  'unions',
  'sources',
  'persons',
  'media',
  'places',
];

/** Base d'intégration (schéma migré par `global-setup.ts`), ou `undefined` sans DATABASE_URL. */
export function testDb():
  | { client: Db; reset: () => Promise<void>; close: () => Promise<void> }
  | undefined {
  const url = process.env['DATABASE_URL'];
  if (!url) return undefined;
  const connection = postgres(url, { max: 1, onnotice: () => {} });
  const client = drizzle(connection, { schema });
  return {
    client,
    // Vide les tables de la base de test entre deux cas.
    reset: async () => {
      await client.execute(sql.raw(`truncate table ${TABLES.join(', ')} cascade`));
    },
    close: () => connection.end(),
  };
}
