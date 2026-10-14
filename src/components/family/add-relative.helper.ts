import type { RedactedPerson } from '@/server/access/access.redact';
import type { TreeForViewer } from '@/server/family/family.service';
import type { Gender } from '@/server/family/family.types';
import { personLabel } from './person.helper';

// Ce que le dialogue « Ajouter un proche » propose pour une fiche, lu dans l'arbre déjà
// filtré : le droit d'ajouter (décidé par la policy), les parents et les conjoints.

export type RelationKind = 'parent' | 'child' | 'partner';
export type AddIntent = { relation: RelationKind; gender?: Gender };
type Choice = { id: string; label: string };
/** La fiche d'où l'on ajoute : son nom de famille pré-remplit celui du nouveau. */
export type Anchor = { id: string; firstName: string; lastName: string };

/** Une fiche de mineur montre un nom masqué : on n'ajoute rien depuis elle. */
export function relativeAnchor(person: RedactedPerson): Anchor | undefined {
  if (person.level === 'minor') return undefined;
  return { id: person.id, firstName: person.firstName, lastName: person.lastName };
}

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
  // Seul un autre parent que le lecteur peut modifier est proposé : le serveur
  // refuserait les autres (la policy vaut pour lui aussi).
  const editable = new Set(tree.editableIds);
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
      return id && name && editable.has(id)
        ? [{ id, label: name, ongoing: u.end === undefined }]
        : [];
    })
    .sort((a, b) => Number(b.ongoing) - Number(a.ongoing));
  const person = tree.persons.find((p) => p.id === anchorId);
  return {
    canAdd: editable.has(anchorId) && person !== undefined && relativeAnchor(person) !== undefined,
    parentsFull: parents.length >= 2,
    singleParent:
      parents.length === 1 && parents[0] && editable.has(parents[0].id) ? parents[0] : undefined,
    partners,
  };
}

const RELATIONS: [RelationKind, string][] = [
  ['parent', '+ Parent'],
  ['child', '+ Enfant'],
  ['partner', '+ Conjoint'],
];

/** Les liens à proposer, avec leur libellé : la fiche et les actions rapides de l'arbre. */
export function addableRelations(options: RelativeOptions): [RelationKind, string][] {
  if (!options.canAdd) return [];
  return RELATIONS.filter(([relation]) => relation !== 'parent' || !options.parentsFull);
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
