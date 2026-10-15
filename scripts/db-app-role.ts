import { randomBytes } from 'node:crypto';
import postgres from 'postgres';

// Crée, ou réinitialise, le rôle applicatif d'une branche Neon : lecture et écriture
// des données, aucun DDL. Le rôle propriétaire reste réservé aux migrations.
//
// Entrées : OWNER_DATABASE_URL (directe) et OWNER_DATABASE_URL_POOLED.
// Sortie : l'URL poolée du rôle applicatif, sur stdout seulement, pour être
// branchée sur `vercel env add` sans jamais s'afficher.

// Rôle de la production (Neon), créé sous l'ancien nom de l'app : il ne se renomme pas
// sans changer les chaînes de connexion de Vercel.
const ROLE = 'ances_tree_app';

const ownerUrl = process.env['OWNER_DATABASE_URL'];
const pooledUrl = process.env['OWNER_DATABASE_URL_POOLED'];
if (!ownerUrl || !pooledUrl) {
  throw new Error('OWNER_DATABASE_URL et OWNER_DATABASE_URL_POOLED sont requises');
}

const owner = new URL(ownerUrl);
const database = owner.pathname.slice(1);
const ownerRole = decodeURIComponent(owner.username);
// base64url : lettres, chiffres, `-` et `_`, sans risque dans un littéral SQL.
const password = randomBytes(24).toString('base64url');

const sql = postgres(ownerUrl, { max: 1, onnotice: () => {} });
try {
  await sql.begin(async (tx) => {
    const [existing] = await tx`select 1 from pg_roles where rolname = ${ROLE}`;
    if (!existing) await tx.unsafe(`create role ${ROLE} login`);
    await tx.unsafe(`alter role ${ROLE} with login password '${password}'`);
    await tx.unsafe(`grant connect on database "${database}" to ${ROLE}`);
    await tx.unsafe(`grant usage on schema public to ${ROLE}`);
    await tx.unsafe(
      `grant select, insert, update, delete on all tables in schema public to ${ROLE}`,
    );
    await tx.unsafe(`grant usage, select on all sequences in schema public to ${ROLE}`);
    // Les tables créées plus tard par les migrations (rôle propriétaire) suivent.
    await tx.unsafe(
      `alter default privileges for role "${ownerRole}" in schema public grant select, insert, update, delete on tables to ${ROLE}`,
    );
    await tx.unsafe(
      `alter default privileges for role "${ownerRole}" in schema public grant usage, select on sequences to ${ROLE}`,
    );
  });
} finally {
  await sql.end();
}

const app = new URL(pooledUrl);
app.username = ROLE;
app.password = password;
process.stdout.write(app.toString());
