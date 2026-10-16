// tdd-cover: e2e src/server/members/members.service.integration.test.ts
import { and, count, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { AppError, ValidationError } from '../_shared/errors';
import { accessRequests, invitations, memberships, persons, users } from '../db/schema';
import type { Db } from '../db/types';
import { buildFamilyIndex } from '../family/family.helper';
import { loadFamilyGraph } from '../family/family.repository';
import { accessRequestEmail, type EmailMessage, invitationEmail } from '../notifications/email';
import type { InvitationReason } from '../notifications/emails/email-templates';
import { normalizeEmail } from './admission';
import { canInvite, canSetAdmin, type MemberRecord } from './members.policy';
import {
  createInvitation,
  findInvitationByToken,
  mailboxCandidates,
  sameMailbox,
} from './members.repository';

// Comptes de la famille (spec section 6.5). Les règles sont dans members.policy ;
// ici, le chargement, les écritures et les emails. Chaque fonction revérifie les
// droits côté serveur, quel que soit l'écran qui l'appelle.

export type MembersDeps = {
  db: Db;
  now: () => Date;
  appUrl: string;
  sendEmail: (message: EmailMessage) => Promise<void>;
};

/** Plafond de demandes d'accès par heure, toutes adresses confondues (formulaire public). */
export const ACCESS_REQUESTS_PER_HOUR = 20;

const forbidden = () =>
  new AppError({ message: 'Action réservée', code: 'MEMBERS_FORBIDDEN', status: 403 });

/** La base a refusé un doublon (index unique). */
function isUniqueViolation(error: unknown): boolean {
  const cause = error instanceof Error ? error.cause : undefined;
  return cause instanceof Error && Reflect.get(cause, 'code') === '23505';
}

async function loadMembers(db: Db): Promise<(MemberRecord & { userId: string })[]> {
  const rows = await db.select().from(memberships);
  return rows.map((m) => ({
    id: m.id,
    userId: m.userId,
    personId: m.personId ?? undefined,
    isAdmin: m.isAdmin,
    isOwner: m.isOwner,
  }));
}

async function sendInvitation(
  deps: MembersDeps,
  input: {
    viewer: MemberRecord;
    viewerUserId: string;
    personId: string;
    email: string;
    reason?: InvitationReason;
  },
) {
  const index = buildFamilyIndex(await loadFamilyGraph(deps.db));
  const members = await loadMembers(deps.db);
  const linked = new Set(members.flatMap((m) => (m.personId ? [m.personId] : [])));

  const decision = canInvite(index, input.viewer, input.personId, linked);
  if (!decision.allowed) {
    if (decision.reason === 'already-member') {
      throw new AppError({
        message: 'Cette personne a déjà un compte',
        code: 'MEMBERS_ALREADY_MEMBER',
        status: 409,
      });
    }
    if (decision.reason === 'unknown-person') {
      throw new AppError({ message: 'Fiche introuvable', code: 'MEMBERS_NOT_FOUND', status: 404 });
    }
    throw forbidden();
  }

  let token: string;
  try {
    ({ token } = await createInvitation(deps.db, {
      email: input.email,
      personId: input.personId,
      invitedBy: input.viewerUserId,
      now: deps.now(),
    }));
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    throw new AppError({
      message: 'Une invitation est déjà en attente pour cette personne ou cette adresse',
      code: 'MEMBERS_INVITATION_PENDING',
      status: 409,
      cause: error,
    });
  }

  const inviter = input.viewer.personId ? index.persons.get(input.viewer.personId) : undefined;
  const person = index.persons.get(input.personId);
  await deps.sendEmail(
    await invitationEmail({
      to: normalizeEmail(input.email),
      inviterName: inviter?.firstName ?? 'L’administrateur de l’arbre',
      firstName: person?.firstName ?? '',
      url: `${deps.appUrl}/invite/${token}`,
      ...(input.reason ? { reason: input.reason } : {}),
    }),
  );
}

const inviteSchema = z.object({ personId: z.string().min(1), email: z.email() });
const claimSchema = z.string().min(1).max(64);

export async function inviteMember(
  deps: MembersDeps,
  viewerUserId: string,
  input: { personId: string; email: string },
): Promise<void> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError('Invitation invalide', parsed.error);
  const viewer = (await loadMembers(deps.db)).find((m) => m.userId === viewerUserId);
  if (!viewer) throw forbidden();
  await sendInvitation(deps, { viewer, viewerUserId, ...parsed.data });
}

const accessRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  relation: z.string().trim().min(1).max(500),
});

export async function requestAccess(
  deps: MembersDeps,
  input: { name: string; email: string; relation: string },
): Promise<{ id: string }> {
  const parsed = accessRequestSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError('Demande invalide', parsed.error);
  const { name, relation } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const now = deps.now();

  // Une demande en attente par boîte (Gmail ignore les points) : on ne relance pas les admins.
  const candidates = await deps.db
    .select({ id: accessRequests.id, email: accessRequests.email })
    .from(accessRequests)
    .where(
      and(mailboxCandidates(accessRequests.email, email), eq(accessRequests.status, 'en_attente')),
    );
  const [pending] = sameMailbox(candidates, email);
  if (pending) return { id: pending.id };

  const [recent] = await deps.db
    .select({ n: count() })
    .from(accessRequests)
    .where(gt(accessRequests.createdAt, new Date(now.getTime() - 3600 * 1000)));
  if ((recent?.n ?? 0) >= ACCESS_REQUESTS_PER_HOUR) {
    throw new AppError({
      message: 'Trop de demandes en ce moment, réessaie plus tard',
      code: 'MEMBERS_TOO_MANY_REQUESTS',
      status: 429,
    });
  }

  const [created] = await deps.db
    .insert(accessRequests)
    .values({ name, email, relation, createdAt: now })
    .returning({ id: accessRequests.id });
  if (!created) throw new Error('Demande non enregistrée');

  const admins = await deps.db
    .select({ email: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.isAdmin, true));
  for (const admin of admins) {
    await deps.sendEmail(
      await accessRequestEmail({
        to: admin.email,
        name,
        email,
        relation,
        url: `${deps.appUrl}/admin`,
      }),
    );
  }
  return { id: created.id };
}

export async function decideAccessRequest(
  deps: MembersDeps,
  viewerUserId: string,
  requestId: string,
  decision: { accept: true; personId: string } | { accept: false },
): Promise<void> {
  const viewer = (await loadMembers(deps.db)).find((m) => m.userId === viewerUserId);
  if (!viewer?.isAdmin) throw forbidden();

  const [request] = await deps.db
    .select()
    .from(accessRequests)
    .where(and(eq(accessRequests.id, requestId), eq(accessRequests.status, 'en_attente')));
  if (!request) {
    throw new AppError({
      message: 'Demande introuvable ou déjà traitée',
      code: 'MEMBERS_NOT_FOUND',
      status: 404,
    });
  }

  if (decision.accept) {
    await sendInvitation(deps, {
      viewer,
      viewerUserId,
      personId: decision.personId,
      email: request.email,
      reason: 'accepted-request',
    });
  }
  await deps.db
    .update(accessRequests)
    .set({
      status: decision.accept ? 'acceptee' : 'refusee',
      ...(decision.accept ? { personId: decision.personId } : {}),
      decidedBy: viewerUserId,
      decidedAt: deps.now(),
    })
    .where(eq(accessRequests.id, requestId));
}

export async function setAdmin(
  deps: MembersDeps,
  viewerUserId: string,
  membershipId: string,
  makeAdmin: boolean,
): Promise<void> {
  const members = await loadMembers(deps.db);
  const viewer = members.find((m) => m.userId === viewerUserId);
  if (!viewer) throw forbidden();
  const decision = canSetAdmin(members, viewer, membershipId, makeAdmin);
  if (!decision.allowed) {
    const errors = {
      'not-admin': forbidden,
      'unknown-member': () =>
        new AppError({ message: 'Membre introuvable', code: 'MEMBERS_NOT_FOUND', status: 404 }),
      'owner-protected': () =>
        new AppError({
          message: 'Le propriétaire reste admin',
          code: 'MEMBERS_OWNER_PROTECTED',
          status: 409,
        }),
      'last-admin': () =>
        new AppError({
          message: 'Il faut au moins un admin',
          code: 'MEMBERS_LAST_ADMIN',
          status: 409,
        }),
    };
    throw errors[decision.reason]();
  }
  await deps.db
    .update(memberships)
    .set({ isAdmin: makeAdmin })
    .where(eq(memberships.id, membershipId));
}

const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`;

/** Aperçu public d'une invitation (page `/invite/<jeton>`), ou rien si le lien n'est plus valable. */
export async function getInvitationPreview(db: Db, token: string, now: Date) {
  const invitation = await findInvitationByToken(db, token, now);
  if (!invitation) return undefined;
  const members = await loadMembers(db);
  const inviter = members.find((m) => m.userId === invitation.invitedBy);
  const index = buildFamilyIndex(await loadFamilyGraph(db));
  const inviterPerson = inviter?.personId ? index.persons.get(inviter.personId) : undefined;
  return {
    email: invitation.email,
    firstName: invitation.firstName,
    inviterName: inviterPerson?.firstName ?? 'L’administrateur de l’arbre',
  };
}

/**
 * Le compte connecté, pour l'avatar et le menu de l'app : sa propre fiche (qu'on voit
 * toujours en entier), ou son email s'il n'est relié à aucune.
 */
export async function getViewerAccount(deps: Pick<MembersDeps, 'db'>, viewerUserId: string) {
  const [row] = await deps.db
    .select({
      email: users.email,
      isAdmin: memberships.isAdmin,
      personId: memberships.personId,
      firstName: persons.firstName,
      lastName: persons.lastName,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .leftJoin(persons, eq(persons.id, memberships.personId))
    .where(eq(memberships.userId, viewerUserId));
  if (!row) throw forbidden();
  const person =
    typeof row.firstName === 'string' && typeof row.lastName === 'string'
      ? { firstName: row.firstName, lastName: row.lastName }
      : undefined;
  return {
    personId: person ? (row.personId ?? undefined) : undefined,
    name: person ? fullName(person) : row.email,
    initials: person
      ? `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase()
      : row.email.charAt(0).toUpperCase(),
    email: row.email,
    isAdmin: row.isAdmin,
  };
}

/**
 * « C'est moi » : un admin sans fiche (le propriétaire à l'amorçage) se relie à la
 * sienne. Réservé à ce cas : un membre a toujours sa fiche (contrainte en base) et
 * n'en change pas ainsi ; une fiche déjà reliée à un autre compte reste à lui.
 */
export async function claimOwnPerson(
  deps: Pick<MembersDeps, 'db'>,
  viewerUserId: string,
  personId: string,
) {
  const parsed = claimSchema.safeParse(personId);
  if (!parsed.success) throw new ValidationError('Fiche invalide', parsed.error);
  const [person] = await deps.db
    .select({ id: persons.id })
    .from(persons)
    // Une fiche à la corbeille ne se réclame pas.
    .where(and(eq(persons.id, parsed.data), isNull(persons.deletedAt)));
  if (!person) {
    throw new AppError({ message: 'Fiche introuvable', code: 'MEMBERS_NOT_FOUND', status: 404 });
  }
  // Une invitation en attente sur cette fiche la promet déjà à quelqu'un d'autre.
  const [pending] = await deps.db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.personId, person.id),
        isNull(invitations.usedAt),
        isNull(invitations.revokedAt),
      ),
    );
  if (pending) {
    throw new AppError({
      message: 'Une invitation attend déjà quelqu’un sur cette fiche.',
      code: 'MEMBERS_INVITATION_PENDING',
      status: 409,
    });
  }
  let updated: { id: string }[];
  try {
    // Les conditions sont dans l'écriture même : deux réclamations simultanées du
    // même compte ne peuvent pas le faire changer de fiche.
    updated = await deps.db
      .update(memberships)
      .set({ personId: person.id })
      .where(
        and(
          eq(memberships.userId, viewerUserId),
          eq(memberships.isAdmin, true),
          isNull(memberships.personId),
        ),
      )
      .returning({ id: memberships.id });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    throw new AppError({
      message: 'Cette fiche est déjà reliée à un autre compte.',
      code: 'MEMBERS_PERSON_TAKEN',
      status: 409,
    });
  }
  if (updated.length !== 1) throw forbidden();
}

/** Page Membres : les comptes, et les fiches que je peux inviter. */
export async function listMembers(deps: MembersDeps, viewerUserId: string) {
  const members = await loadMembers(deps.db);
  const viewer = members.find((m) => m.userId === viewerUserId);
  if (!viewer) throw forbidden();
  const index = buildFamilyIndex(await loadFamilyGraph(deps.db));
  const emails = new Map(
    (await deps.db.select({ id: users.id, email: users.email }).from(users)).map((u) => [
      u.id,
      u.email,
    ]),
  );
  const linked = new Set(members.flatMap((m) => (m.personId ? [m.personId] : [])));
  const person = (id: string | undefined) => (id ? index.persons.get(id) : undefined);

  return {
    viewer: { membershipId: viewer.id, isAdmin: viewer.isAdmin },
    members: members.map((m) => {
      const p = person(m.personId);
      return {
        id: m.id,
        label: p ? fullName(p) : (emails.get(m.userId) ?? ''),
        isAdmin: m.isAdmin,
        isOwner: m.isOwner,
      };
    }),
    invitable: [...index.persons.values()]
      .filter((p) => canInvite(index, viewer, p.id, linked).allowed)
      .map((p) => ({ personId: p.id, label: fullName(p) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}

/** Administration : demandes en attente et fiches encore sans compte. */
export async function listAccessRequests(deps: MembersDeps, viewerUserId: string) {
  const members = await loadMembers(deps.db);
  const viewer = members.find((m) => m.userId === viewerUserId);
  if (!viewer?.isAdmin) throw forbidden();
  const index = buildFamilyIndex(await loadFamilyGraph(deps.db));
  const linked = new Set(members.flatMap((m) => (m.personId ? [m.personId] : [])));
  const requests = await deps.db
    .select({
      id: accessRequests.id,
      name: accessRequests.name,
      email: accessRequests.email,
      relation: accessRequests.relation,
      createdAt: accessRequests.createdAt,
    })
    .from(accessRequests)
    .where(eq(accessRequests.status, 'en_attente'));
  return {
    requests,
    unlinkedPersons: [...index.persons.values()]
      .filter((p) => !linked.has(p.id))
      .map((p) => ({ personId: p.id, label: fullName(p) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
