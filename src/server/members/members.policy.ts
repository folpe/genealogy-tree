import { closeCircle } from '../access/access.policy';
import { descendantsOf, type FamilyIndex } from '../family/family.helper';

// Règles des comptes (spec section 6.5), pures. Tout membre invite son cercle
// proche et ses descendants : c'est le moteur d'adoption. Le reste passe par un
// admin, ou par une demande d'accès.

export type MemberRecord = {
  id: string;
  personId?: string | undefined;
  isAdmin: boolean;
  isOwner: boolean;
};

export type Decision<R extends string> = { allowed: true } | { allowed: false; reason: R };

export function canInvite(
  index: FamilyIndex,
  viewer: MemberRecord,
  personId: string,
  /** Fiches déjà reliées à un compte. */
  linkedPersonIds: Set<string>,
): Decision<'unknown-person' | 'already-member' | 'outside'> {
  if (!index.persons.has(personId)) return { allowed: false, reason: 'unknown-person' };
  if (linkedPersonIds.has(personId)) return { allowed: false, reason: 'already-member' };
  if (viewer.isAdmin) return { allowed: true };
  if (!viewer.personId) return { allowed: false, reason: 'outside' };
  const reachable =
    closeCircle(index, viewer.personId).has(personId) ||
    descendantsOf(index, viewer.personId).has(personId);
  return reachable ? { allowed: true } : { allowed: false, reason: 'outside' };
}

export function canSetAdmin(
  members: MemberRecord[],
  viewer: MemberRecord,
  targetId: string,
  makeAdmin: boolean,
): Decision<'not-admin' | 'unknown-member' | 'owner-protected' | 'last-admin'> {
  if (!viewer.isAdmin) return { allowed: false, reason: 'not-admin' };
  const target = members.find((m) => m.id === targetId);
  if (!target) return { allowed: false, reason: 'unknown-member' };
  if (makeAdmin) return { allowed: true };
  if (target.isOwner) return { allowed: false, reason: 'owner-protected' };
  const otherAdmins = members.filter((m) => m.isAdmin && m.id !== targetId);
  if (otherAdmins.length === 0) return { allowed: false, reason: 'last-admin' };
  return { allowed: true };
}
