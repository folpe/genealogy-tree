import type { TreeForViewer } from '@/server/family/family.service';
import type { Gender } from '@/server/family/family.types';
import { personLabel } from './person.helper';

// Ce que le dialogue « Ajouter un proche » propose pour une fiche, lu dans l'arbre déjà
// filtré : le droit d'ajouter (décidé par la policy), les parents et les conjoints.

export type RelationKind = 'parent' | 'child' | 'partner';
export type AddIntent = { relation: RelationKind; gender?: Gender };
type Choice = { id: string; label: string };

export type RelativeOptions = {
  canAdd: boolean;
  /** Deux parents connus : on n'en ajoute plus. */
  parentsFull: boolean;
  /** Le parent connu quand il n'y en a qu'un : l'autre parent du nouveau, s'il le faut. */
  singleParent: Choice | undefined;
  /** Conjoints, l'union en cours d'abord : l'autre parent possible d'un enfant. */
  partners: (Choice & { ongoing: boolean })[];
};

export function relativeOptions(tree: TreeForViewer, anchorId: string): RelativeOptions {
  const label = (id: string) => {
    const person = tree.persons.find((p) => p.id === id);
    return person ? personLabel(person) : undefined;
  };
  const parents = tree.parentChildren
    .filter((l) => l.childId === anchorId && l.kind !== 'a_eleve')
    .flatMap((l) => {
      const name = label(l.parentId);
      return name ? [{ id: l.parentId, label: name }] : [];
    });
  const partners = tree.unions
    .filter((u) => u.partnerIds.includes(anchorId))
    .flatMap((u) => {
      const id = u.partnerIds[0] === anchorId ? u.partnerIds[1] : u.partnerIds[0];
      const name = id ? label(id) : undefined;
      return id && name ? [{ id, label: name, ongoing: u.end === undefined }] : [];
    })
    .sort((a, b) => Number(b.ongoing) - Number(a.ongoing));
  return {
    canAdd: tree.editableIds.includes(anchorId),
    parentsFull: parents.length >= 2,
    singleParent: parents.length === 1 ? parents[0] : undefined,
    partners,
  };
}

const INTENTS: Record<string, AddIntent> = {
  pere: { relation: 'parent', gender: 'homme' },
  mere: { relation: 'parent', gender: 'femme' },
  parent: { relation: 'parent' },
  enfant: { relation: 'child' },
  conjoint: { relation: 'partner' },
};

/** `?ajouter=pere` : le dialogue s'ouvre déjà réglé (depuis une case vide de l'éventail). */
export function parseAddIntent(value: string | string[] | undefined): AddIntent | undefined {
  const key = Array.isArray(value) ? value[0] : value;
  return key !== undefined && Object.hasOwn(INTENTS, key) ? INTENTS[key] : undefined;
}
