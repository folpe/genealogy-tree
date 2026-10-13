import type { RedactedPerson } from '@/server/access/access.redact';
import type { TreeForViewer } from '@/server/family/family.service';
import type { Union } from '@/server/family/family.types';

// Les proches d'une fiche, lus dans l'arbre déjà filtré : ce que la fiche montre en
// pastilles. `a_eleve` (beau-parent) n'est jamais une filiation : il a sa propre ligne.

const FILIATIONS = new Set(['biologique', 'adoptive', 'inconnue']);

export type Relatives = {
  parents: RedactedPerson[];
  siblings: RedactedPerson[];
  /** Un seul parent en commun. */
  halfSiblings: RedactedPerson[];
  /** Unions de la personne, en cours d'abord ; `partner` absent s'il est inconnu. */
  unions: { union: Union; partner: RedactedPerson | undefined }[];
  children: RedactedPerson[];
  raisedBy: RedactedPerson[];
  raised: RedactedPerson[];
};

export function relativesOf(tree: TreeForViewer, personId: string): Relatives {
  const byId = new Map(tree.persons.map((p) => [p.id, p]));
  const pick = (ids: string[]) => [...new Set(ids)].flatMap((id) => byId.get(id) ?? []);
  const links = tree.parentChildren;
  const filiation = links.filter((l) => FILIATIONS.has(l.kind));
  const parentsOf = (id: string) =>
    filiation.filter((l) => l.childId === id).map((l) => l.parentId);
  const childrenOf = (id: string) =>
    filiation.filter((l) => l.parentId === id).map((l) => l.childId);

  const parentIds = parentsOf(personId);
  const siblingIds = [...new Set(parentIds.flatMap(childrenOf))].filter((id) => id !== personId);
  const full = (id: string) => {
    const theirs = parentsOf(id);
    return parentIds.length > 0 && parentIds.every((p) => theirs.includes(p));
  };
  const unions = tree.unions
    .filter((u) => u.partnerIds.includes(personId))
    .sort((a, b) => Number(a.end !== undefined) - Number(b.end !== undefined))
    .map((union) => {
      const partnerId = union.partnerIds.find((id) => id !== personId);
      return { union, partner: partnerId ? byId.get(partnerId) : undefined };
    });
  const raisedLinks = links.filter((l) => l.kind === 'a_eleve');
  return {
    parents: pick(parentIds),
    siblings: pick(siblingIds.filter(full)),
    halfSiblings: pick(siblingIds.filter((id) => !full(id))),
    unions,
    children: pick(childrenOf(personId)),
    raisedBy: pick(raisedLinks.filter((l) => l.childId === personId).map((l) => l.parentId)),
    raised: pick(raisedLinks.filter((l) => l.parentId === personId).map((l) => l.childId)),
  };
}
