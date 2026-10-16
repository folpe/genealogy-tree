// tdd-cover: e2e src/server/auth/auth.integration.test.ts
import { createHash, randomBytes } from 'node:crypto';
import { and, asc, eq, gt, ilike, isNull, or, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { Member } from '../access/access.types';
import { invitations, memberships, persons, users } from '../db/schema';
import type { Db } from '../db/types';
import type { Admission } from './admission';
import { emailMatchKey, GMAIL_DOMAINS, normalizeEmail } from './admission';

/** Durée de validité d'une invitation. */
const INVITATION_TTL_DAYS = 14;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Lignes dont l'adresse peut être la même boîte que `email` : l'égalité exacte hors
 * Gmail, toutes les adresses Gmail sinon, que `sameMailbox` départage ensuite par
 * `emailMatchKey`. La clé n'est ni stockée ni indexée : les adresses d'une famille se
 * comptent en dizaines, et la règle garde un seul propriétaire.
 */
export function mailboxCandidates(column: PgColumn, email: string): SQL | undefined {
  if (!emailMatchKey(email).endsWith('@gmail.com')) return eq(column, normalizeEmail(email));
  return or(...GMAIL_DOMAINS.map((domain) => ilike(column, `%@${domain}`)));
}

/** Les lignes qui désignent la même boîte que `email`, l'adresse exacte en tête. */
export function sameMailbox<T extends { email: string }>(rows: T[], email: string): T[] {
  const key = emailMatchKey(email);
  const isExact = (row: T) => Number(normalizeEmail(row.email) === normalizeEmail(email));
  return rows
    .filter((row) => emailMatchKey(row.email) === key)
    .sort((a, b) => isExact(b) - isExact(a));
}

/**
 * Adresse enregistrée du compte qui reçoit le courrier de `email`, s'il y en a un.
 * Deux comptes pour une même boîte Gmail (inscrits avant cette règle) : seule
 * l'adresse exacte tranche, jamais un choix au hasard.
 */
export async function findAccountEmail(db: Db, email: string): Promise<string | undefined> {
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(mailboxCandidates(users.email, email));
  const [first, second] = sameMailbox(rows, email);
  if (!first) return undefined;
  if (second && normalizeEmail(first.email) !== normalizeEmail(email)) return undefined;
  return first.email;
}

/** Invitation en attente pour cette boîte, sous quelque forme qu'elle ait été envoyée. */
export async function findPendingInvitation(db: Db, email: string) {
  const rows = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      personId: invitations.personId,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .where(
      and(
        mailboxCandidates(invitations.email, email),
        isNull(invitations.usedAt),
        isNull(invitations.revokedAt),
      ),
    )
    .orderBy(asc(invitations.createdAt));
  return sameMailbox(rows, email)[0];
}

/** Invitation en cours désignée par son jeton, avec la fiche invitée et qui invite. */
export async function findInvitationByToken(db: Db, token: string, now: Date) {
  const [row] = await db
    .select({
      email: invitations.email,
      firstName: persons.firstName,
      invitedBy: invitations.invitedBy,
    })
    .from(invitations)
    .innerJoin(persons, eq(persons.id, invitations.personId))
    .where(
      and(
        eq(invitations.tokenHash, hashToken(token)),
        isNull(invitations.usedAt),
        isNull(invitations.revokedAt),
        gt(invitations.expiresAt, now),
      ),
    );
  return row;
}

/** Crée une invitation ; renvoie le jeton en clair, à mettre dans l'email et nulle part ailleurs. */
export async function createInvitation(
  db: Db,
  input: { email: string; personId: string; invitedBy: string; now: Date },
): Promise<{ id: string; token: string }> {
  const token = randomBytes(32).toString('base64url');
  const [created] = await db
    .insert(invitations)
    .values({
      email: normalizeEmail(input.email),
      personId: input.personId,
      tokenHash: hashToken(token),
      invitedBy: input.invitedBy,
      expiresAt: new Date(input.now.getTime() + INVITATION_TTL_DAYS * 24 * 3600 * 1000),
    })
    .returning({ id: invitations.id });
  if (!created) throw new Error('Invitation non créée');
  return { id: created.id, token };
}

/**
 * Rattache un compte tout juste créé : propriétaire pour l'admin d'amorçage,
 * membre relié à sa fiche pour un invité (l'invitation est consommée dans la
 * même transaction).
 */
export async function admitUser(
  db: Db,
  input: { userId: string; admission: Extract<Admission, { admitted: true }>; now: Date },
): Promise<void> {
  const { admission } = input;
  if (admission.via === 'bootstrap') {
    await db
      .insert(memberships)
      .values({ userId: input.userId, isAdmin: true, isOwner: true })
      .onConflictDoNothing();
    return;
  }
  await db.transaction(async (tx) => {
    const [invitation] = await tx
      .update(invitations)
      .set({ usedAt: input.now })
      .where(and(eq(invitations.id, admission.invitationId), isNull(invitations.usedAt)))
      .returning({ personId: invitations.personId, invitedBy: invitations.invitedBy });
    if (!invitation) throw new Error('Invitation déjà utilisée');
    await tx.insert(memberships).values({
      userId: input.userId,
      personId: invitation.personId,
      invitedBy: invitation.invitedBy,
    });
  });
}

/** Comptes vus par la policy de proximité, avec le compte d'auth qui les porte. */
export async function loadAccessMembers(db: Db): Promise<(Member & { userId: string })[]> {
  const rows = await db.select().from(memberships);
  return rows.map((m) => ({
    id: m.id,
    userId: m.userId,
    personId: m.personId,
    isAdmin: m.isAdmin,
    joinedAt: m.createdAt.getTime(),
  }));
}
