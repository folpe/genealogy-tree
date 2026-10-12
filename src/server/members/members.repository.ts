// tdd-cover: e2e src/server/auth/auth.integration.test.ts
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { invitations, memberships } from '../db/schema';
import type { Db } from '../db/types';
import type { Admission } from './admission';
import { normalizeEmail } from './admission';

/** Durée de validité d'une invitation. */
const INVITATION_TTL_DAYS = 14;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function findPendingInvitation(db: Db, email: string) {
  const [invitation] = await db
    .select({
      id: invitations.id,
      personId: invitations.personId,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.email, normalizeEmail(email)),
        isNull(invitations.usedAt),
        isNull(invitations.revokedAt),
      ),
    );
  return invitation;
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
