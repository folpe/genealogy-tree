import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../../src/server/db/schema';
import { assertSeedTarget } from '../../src/server/db/seed-guard';
import { insertFamilyGraph } from '../../src/server/family/family.repository';
import { createInvitation } from '../../src/server/members/members.repository';
import { marchandFamily } from '../fixtures/marchand-family';
import { E2E_ADMIN_EMAIL, E2E_DATABASE_URL, E2E_ISABELLE_EMAIL } from './e2e.constants';

// Base e2e repartie de zéro à chaque passage : schéma migré, famille Marchand,
// propriétaire (l'admin d'amorçage, déjà inscrit), comptes des maquettes (sans eux,
// des fiches deviendraient « ouvertes ») et une invitation en attente pour Isabelle.
// Base locale uniquement.
export default async function setup() {
  assertSeedTarget(E2E_DATABASE_URL, '');
  const connection = postgres(E2E_DATABASE_URL, { max: 1, onnotice: () => {} });
  const db = drizzle(connection, { schema });
  try {
    await db.execute(sql`drop schema if exists public cascade`);
    await db.execute(sql`drop schema if exists drizzle cascade`);
    await db.execute(sql`create schema public`);
    await migrate(db, { migrationsFolder: 'src/server/db/migrations' });
    await insertFamilyGraph(db, marchandFamily);

    await db.insert(schema.users).values({ id: 'u-admin', email: E2E_ADMIN_EMAIL });
    await db.insert(schema.memberships).values({
      userId: 'u-admin',
      isAdmin: true,
      isOwner: true,
    });
    for (const personId of ['luc', 'hugo', 'anne']) {
      await db
        .insert(schema.users)
        .values({ id: `u-${personId}`, email: `${personId}@famille.test` });
      await db.insert(schema.memberships).values({ userId: `u-${personId}`, personId });
    }
    await createInvitation(db, {
      email: E2E_ISABELLE_EMAIL,
      personId: 'isabelle',
      invitedBy: 'u-admin',
      now: new Date(),
    });
  } finally {
    await connection.end();
  }
}
