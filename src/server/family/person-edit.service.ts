import { AppError } from '../_shared/errors';
import { buildAccessContext, canEdit } from '../access/access.policy';
import type { Db } from '../db/types';
import { loadAccessMembers } from '../members/members.repository';
import { buildFamilyIndex } from './family.helper';
import { assertCanUpdateDates } from './family.invariants';
import { loadFamilyGraph, updatePersonField } from './family.repository';
import { applyPersonEdit, parsePersonEdit, sourcedFieldsOf } from './person-edit.helper';

// Modification sur place (phase 6, lot 2, avancé) : un champ à la fois, à travers la
// policy (spec 6.3) et les invariants de dates. Directe seulement : la suggestion aux
// gardiens et la nouvelle source pour un fait sourcé arrivent avec la phase 6.

export async function editPerson(deps: { db: Db }, viewerUserId: string, raw: unknown) {
  const edit = parsePersonEdit(raw);
  const [members, graph] = await Promise.all([
    loadAccessMembers(deps.db),
    loadFamilyGraph(deps.db),
  ]);
  const viewer = members.find((m) => m.userId === viewerUserId);
  if (!viewer) {
    throw new AppError({ message: 'Accès réservé', code: 'FAMILY_FORBIDDEN', status: 403 });
  }
  const index = buildFamilyIndex(graph);
  const person = index.persons.get(edit.personId);
  if (!person) {
    throw new AppError({ message: 'Fiche introuvable', code: 'FAMILY_NOT_FOUND', status: 404 });
  }
  const decision = canEdit(buildAccessContext(index, members), viewer, person.id, {
    fields: sourcedFieldsOf(edit),
  });
  if (decision.mode !== 'direct') {
    throw decision.reason === 'sourced'
      ? new AppError({
          message:
            'Ce fait est sourcé : le changer demandera une nouvelle source. Ça arrive bientôt.',
          code: 'FAMILY_SOURCED',
          status: 403,
        })
      : new AppError({
          message:
            'Cette fiche est hors de ta lignée : tu ne peux pas encore la modifier. Les suggestions à la famille arrivent bientôt.',
          code: 'FAMILY_OUTSIDE_PERIMETER',
          status: 403,
        });
  }
  const after = applyPersonEdit(person, edit);
  if (edit.field === 'birth' || edit.field === 'death') {
    assertCanUpdateDates(index, person.id, {
      ...(after.birth?.date ? { birth: after.birth.date } : {}),
      ...(after.death?.date ? { death: after.death.date } : {}),
    });
  }
  await updatePersonField(deps.db, after, edit.field);
}
