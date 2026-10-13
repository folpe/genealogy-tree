import { AppError } from '../_shared/errors';
import { buildAccessContext, editableIds } from '../access/access.policy';
import type { Db } from '../db/types';
import { loadAccessMembers } from '../members/members.repository';
import { buildFamilyIndex } from './family.helper';
import { insertRelative, loadFamilyGraph } from './family.repository';
import { parseAddRelative, planAddRelative } from './relatives.helper';

// Ajout d'un proche à travers la policy (spec section 6.3) : directement dans son
// périmètre ; ailleurs, la suggestion aux gardiens (phase 6, lot 6) n'existe pas
// encore, on refuse en le disant.

export async function addRelative(
  deps: { db: Db },
  viewerUserId: string,
  raw: unknown,
): Promise<{ personId: string }> {
  const input = parseAddRelative(raw);
  const [members, graph] = await Promise.all([
    loadAccessMembers(deps.db),
    loadFamilyGraph(deps.db),
  ]);
  const viewer = members.find((m) => m.userId === viewerUserId);
  if (!viewer) {
    throw new AppError({ message: 'Accès réservé', code: 'FAMILY_FORBIDDEN', status: 403 });
  }
  const index = buildFamilyIndex(graph);
  // Fiche absente (ou à la corbeille) : introuvable, avant toute question de droits.
  if (!index.persons.has(input.anchorId)) {
    throw new AppError({ message: 'Fiche introuvable', code: 'FAMILY_NOT_FOUND', status: 404 });
  }
  // L'autre parent voit aussi ses liens changer : la policy vaut pour lui comme pour
  // la fiche de départ (un ancien conjoint, par exemple, reste hors de portée).
  const editable = new Set(editableIds(buildAccessContext(index, members), viewer));
  const touched = [input.anchorId, ...(input.otherParentId ? [input.otherParentId] : [])];
  if (!touched.every((id) => editable.has(id))) {
    throw new AppError({
      message:
        'Cette fiche est hors de ta lignée : tu ne peux pas encore y ajouter quelqu’un. Les suggestions à la famille arrivent bientôt.',
      code: 'FAMILY_OUTSIDE_PERIMETER',
      status: 403,
    });
  }
  const plan = planAddRelative(index, input, {
    person: crypto.randomUUID(),
    union: crypto.randomUUID(),
  });
  await insertRelative(deps.db, plan, {
    anchorId: input.anchorId,
    ...(input.relation === 'parent' ? { maxParents: 2 } : {}),
  });
  return { personId: plan.person.id };
}
