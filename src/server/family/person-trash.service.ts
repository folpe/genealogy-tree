import { AppError } from '../_shared/errors';
import { type AccessContext, buildAccessContext, canEdit } from '../access/access.policy';
import type { Member } from '../access/access.types';
import type { Db } from '../db/types';
import { loadAccessMembers } from '../members/members.repository';
import { buildFamilyIndex, childrenOf } from './family.helper';
import { loadFamilyGraph, loadTrash, setPersonTrashed } from './family.repository';

// Corbeille (choix de Folpe, 2026-10-13) : une fiche mise à la corbeille disparaît de
// l'arbre sans être effacée, et un admin la restaure. Un membre n'y met qu'une fiche de
// sa lignée, sans enfant et sans compte ; un admin, toute fiche sans compte.

type TrashDeps = { db: Db; now: () => Date };

const forbidden = (message: string, code: string) => new AppError({ message, code, status: 403 });

async function viewerOf(db: Db, viewerUserId: string) {
  const members = await loadAccessMembers(db);
  const viewer = members.find((m) => m.userId === viewerUserId);
  if (!viewer) throw forbidden('Accès réservé', 'FAMILY_FORBIDDEN');
  return { members, viewer };
}

/**
 * Pourquoi une fiche ne peut pas aller à la corbeille, ou rien si elle le peut. Seule
 * source de la règle : le service refuse avec, l'arbre montre le bouton sans.
 */
export function trashRefusal(
  ctx: AccessContext,
  viewer: Member,
  personId: string,
): { message: string; code: string } | undefined {
  if (ctx.members.some((m) => m.personId === personId)) {
    return {
      message: 'Cette fiche est reliée à un compte : elle ne peut pas aller à la corbeille.',
      code: 'FAMILY_LINKED_ACCOUNT',
    };
  }
  if (canEdit(ctx, viewer, personId, { fields: ['delete'] }).mode !== 'direct') {
    return {
      message: 'Cette fiche est hors de ta lignée : tu ne peux pas la mettre à la corbeille.',
      code: 'FAMILY_OUTSIDE_PERIMETER',
    };
  }
  if (!viewer.isAdmin && childrenOf(ctx.index, personId).length > 0) {
    return {
      message: 'Cette fiche a des enfants : seul un admin peut la mettre à la corbeille.',
      code: 'FAMILY_HAS_CHILDREN',
    };
  }
  return undefined;
}

export async function trashPerson(deps: TrashDeps, viewerUserId: string, personId: string) {
  const [{ members, viewer }, graph] = await Promise.all([
    viewerOf(deps.db, viewerUserId),
    loadFamilyGraph(deps.db),
  ]);
  const index = buildFamilyIndex(graph);
  if (!index.persons.has(personId)) {
    throw new AppError({ message: 'Fiche introuvable', code: 'FAMILY_NOT_FOUND', status: 404 });
  }
  const refusal = trashRefusal(buildAccessContext(index, members), viewer, personId);
  if (refusal) throw forbidden(refusal.message, refusal.code);
  await setPersonTrashed(deps.db, personId, { at: deps.now(), by: viewerUserId });
}

async function requireAdmin(db: Db, viewerUserId: string) {
  const { viewer } = await viewerOf(db, viewerUserId);
  if (!viewer.isAdmin) throw forbidden('Réservé aux admins', 'FAMILY_ADMIN_ONLY');
}

export async function listTrash(deps: TrashDeps, viewerUserId: string) {
  await requireAdmin(deps.db, viewerUserId);
  const rows = await loadTrash(deps.db);
  return rows.map((row) => ({
    id: row.id,
    name: `${row.firstName} ${row.lastName}`,
    deletedAt: row.deletedAt ?? undefined,
    deletedByName: row.deletedByName ?? undefined,
  }));
}

export async function restorePerson(deps: TrashDeps, viewerUserId: string, personId: string) {
  await requireAdmin(deps.db, viewerUserId);
  if (!(await setPersonTrashed(deps.db, personId, undefined))) {
    throw new AppError({ message: 'Fiche introuvable', code: 'FAMILY_NOT_FOUND', status: 404 });
  }
}
