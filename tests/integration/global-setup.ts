import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Applique les migrations versionnées une fois avant la suite : le schéma testé
// est exactement celui que recevra Neon.
export default async function setup() {
  const url = process.env['DATABASE_URL'];
  if (!url) return;
  const connection = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(connection), { migrationsFolder: 'src/server/db/migrations' });
  } finally {
    await connection.end();
  }
}
