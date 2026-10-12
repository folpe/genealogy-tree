// tdd-cover: e2e src/server/auth/auth.integration.test.ts
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import { persons } from './family.schema';

// Comptes de la famille (spec section 6.5) : un compte = une fiche « C'est moi ».
// Deux statuts seulement, membre et admin ; le propriétaire est un admin
// qu'on ne peut pas rétrograder.

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const memberships = pgTable(
  'memberships',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Fiche « C'est moi ». Absente seulement pour un admin pas encore relié. */
    personId: text('person_id')
      .unique()
      .references(() => persons.id, { onDelete: 'restrict' }),
    isAdmin: boolean('is_admin').notNull().default(false),
    isOwner: boolean('is_owner').notNull().default(false),
    invitedBy: text('invited_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [
    check('memberships_person_or_admin', sql`${t.personId} is not null or ${t.isAdmin}`),
    check('memberships_owner_is_admin', sql`not ${t.isOwner} or ${t.isAdmin}`),
    // Un seul propriétaire.
    uniqueIndex('memberships_one_owner').on(t.isOwner).where(sql`${t.isOwner}`),
  ],
);

/**
 * Invitation à rejoindre l'arbre, pour une fiche donnée. L'adresse est stockée
 * normalisée ; seul le haché SHA-256 du jeton est conservé (le jeton est un
 * secret porté par l'email). Une seule invitation en attente par adresse et par fiche.
 */
export const invitations = pgTable(
  'invitations',
  {
    id: id(),
    email: text('email').notNull(),
    personId: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    invitedBy: text('invited_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('invitations_pending_email')
      .on(t.email)
      .where(sql`${t.usedAt} is null and ${t.revokedAt} is null`),
    uniqueIndex('invitations_pending_person')
      .on(t.personId)
      .where(sql`${t.usedAt} is null and ${t.revokedAt} is null`),
  ],
);

export const accessRequestStatusEnum = pgEnum('access_request_status', [
  'en_attente',
  'acceptee',
  'refusee',
]);

/** Demande d'accès d'une personne sans invitation, tranchée par un admin. */
export const accessRequests = pgTable(
  'access_requests',
  {
    id: id(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    /** « Qui es-tu dans la famille ? » */
    relation: text('relation').notNull(),
    status: accessRequestStatusEnum('status').notNull().default('en_attente'),
    /** Fiche choisie par l'admin à l'acceptation. */
    personId: text('person_id').references(() => persons.id, { onDelete: 'set null' }),
    decidedBy: text('decided_by').references(() => users.id, { onDelete: 'set null' }),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('access_requests_status_idx').on(t.status)],
);
