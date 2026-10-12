import type { FuzzyDate, ParentChild, Union } from '../family/family.types';
import { type AccessContext, visibilityOf } from './access.policy';
import { type RedactedPerson, redactPerson, redactUnion } from './access.redact';
import type { Member, VisibilityLevel } from './access.types';

// L'arbre tel qu'un membre a le droit de le voir (spec section 6.4). C'est la seule
// forme du graphe qui quitte le serveur : la policy et la projection s'appliquent
// ici, avant toute sérialisation vers le client.

export type TreeView = {
  persons: RedactedPerson[];
  unions: Union[];
  parentChildren: ParentChild[];
  /** Fiches qu'un admin lit au-delà de ce qu'il verrait sans ce rôle : à journaliser. */
  audited: string[];
};

/** Du moins au plus restrictif. */
const RESTRICTION: Record<VisibilityLevel, number> = { full: 0, family: 1, structure: 2, minor: 3 };

export function viewTreeAs(ctx: AccessContext, viewer: Member, today: FuzzyDate): TreeView {
  const levels = new Map<string, VisibilityLevel>();
  const audited: string[] = [];
  const persons = [...ctx.index.persons.values()].map((person) => {
    const visibility = visibilityOf(ctx, viewer, person.id, today);
    levels.set(person.id, visibility.level);
    if (visibility.audit) audited.push(person.id);
    return redactPerson(person, visibility.level);
  });

  const unions = [...ctx.index.unions.values()].map((union) => {
    const level = union.partnerIds
      .flatMap((id) => (id === null ? [] : [levels.get(id) ?? 'full']))
      .reduce<VisibilityLevel>((a, b) => (RESTRICTION[b] > RESTRICTION[a] ? b : a), 'full');
    return redactUnion(union, level);
  });

  const parentChildren = [...ctx.index.linksByChild.values()].flat();
  return { persons, unions, parentChildren, audited };
}
