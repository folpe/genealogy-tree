import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/server/db/schema';
import { assertSeedTarget } from '../src/server/db/seed-guard';
import { insertFamilyGraph } from '../src/server/family/family.repository';
import { marchandFamily } from '../tests/fixtures/marchand-family';

// Peuple une base de dev avec la famille fictive Marchand (jamais de données réelles).
// Le schéma doit être migré (`bun run db:migrate`) et la base vide.
const url = process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL manquante');
assertSeedTarget(url, process.env['SEED_ALLOWED_HOSTS'] ?? '');

const connection = postgres(url, { max: 1 });
try {
  await insertFamilyGraph(drizzle(connection, { schema }), marchandFamily);
  console.log(
    `Seed : ${marchandFamily.persons.length} personnes, ${marchandFamily.unions.length} unions.`,
  );
} finally {
  await connection.end();
}
