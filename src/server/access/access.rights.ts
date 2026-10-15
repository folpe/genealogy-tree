// Encart de droits de la fiche (DESIGN.md, RightsNotice) : ce que le lecteur peut faire
// d'une fiche, dit en une phrase. La règle vient de la policy (canEdit) ; l'écran ne
// fait qu'afficher le texte calculé ici.

import { ancestorsOf, descendantsOf, siblingsOf } from '../family/family.helper';
import { type AccessContext, canEdit } from './access.policy';
import type { Member } from './access.types';

export type Rights =
  | { kind: 'admin' }
  | { kind: 'self' }
  /** Ancêtre aussi d'un membre d'une autre branche : sa lignée est prévenue. */
  | { kind: 'common' }
  | { kind: 'open' }
  | { kind: 'lineage' }
  /** Hors du périmètre : la suggestion va aux gardiens (ids de membre). */
  | { kind: 'outside'; guardians: string[] };

export type RightsNotice = { tone: 'direct' | 'suggest'; text: string };

/** Même question que pour ajouter un proche : la fiche se complète-t-elle directement ? */
export function rightsOf(ctx: AccessContext, viewer: Member, personId: string): Rights {
  const decision = canEdit(ctx, viewer, personId, { fields: ['relatives'] });
  if (decision.mode === 'suggest') return { kind: 'outside', guardians: decision.guardians };
  switch (decision.reason) {
    case 'admin':
      return viewer.personId === personId ? { kind: 'self' } : { kind: 'admin' };
    case 'self':
      return { kind: 'self' };
    case 'open':
      return { kind: 'open' };
    default:
      return isCommonAncestor(ctx, viewer, personId) ? { kind: 'common' } : { kind: 'lineage' };
  }
}

/**
 * Ancêtre du lecteur et d'un autre membre qui n'est ni son ancêtre, ni son descendant,
 * ni son frère ou sa sœur : la fiche appartient à plusieurs branches (Henri pour Hugo
 * et Isabelle, Paul pour Hugo et sa tante Anne). Une fratrie reste une seule branche.
 */
function isCommonAncestor(ctx: AccessContext, viewer: Member, personId: string): boolean {
  const own = viewer.personId;
  if (own === null || !ancestorsOf(ctx.index, own).has(personId)) return false;
  const sameLine = new Set([
    own,
    ...ancestorsOf(ctx.index, own).keys(),
    ...descendantsOf(ctx.index, own).keys(),
    ...siblingsOf(ctx.index, own).map((s) => s.id),
  ]);
  return ctx.members.some(
    (m) =>
      m.personId !== null &&
      !sameLine.has(m.personId) &&
      ancestorsOf(ctx.index, m.personId).has(personId),
  );
}

/**
 * À qui va la suggestion : les gardiens nommés ; des gardiens que le lecteur ne voit
 * pas restent anonymes ; sans gardien inscrit, l'escalade mène aux administrateurs.
 */
function recipients(guardians: string[], names: string[]): string {
  if (names.length > 0) return `à ${enumerate(names)}`;
  return guardians.length > 0 ? 'à ses proches inscrits' : 'aux administrateurs';
}

/** « Isabelle », « Isabelle et Luc », « Isabelle, Luc et Anne ». */
function enumerate(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} et ${names.at(-1)}`;
}

/**
 * Texte de l'encart, repris de la maquette Arbre (puce encre en direct, accent sinon).
 * Suggestions et veille de lignée arrivent en phase 6 : d'ici là, l'encart les annonce
 * au futur, comme les refus des services. À remettre au présent avec elles.
 */
export function rightsNotice(
  rights: Rights,
  { personName, guardianNames }: { personName: string; guardianNames: string[] },
): RightsNotice {
  switch (rights.kind) {
    case 'self':
      return {
        tone: 'direct',
        text: 'C’est ta fiche : toi seul décides de ce que la famille voit.',
      };
    case 'admin':
      return { tone: 'direct', text: 'Administrateur : tu modifies directement.' };
    case 'common':
      return {
        tone: 'direct',
        text: 'Ancêtre commun à plusieurs branches : tu modifies directement ; bientôt, toute sa lignée sera prévenue et pourra annuler.',
      };
    case 'open':
      return {
        tone: 'direct',
        text: `Fiche ouverte : aucun proche de ${personName} n’est inscrit, tu peux la compléter.`,
      };
    case 'lineage':
      return { tone: 'direct', text: 'Dans ta lignée : tu modifies directement.' };
    case 'outside':
      return {
        tone: 'suggest',
        text: `Hors de ta lignée : bientôt, tes suggestions iront ${recipients(rights.guardians, guardianNames)}.`,
      };
  }
}

/**
 * L'encart de chaque fiche visible. Les prénoms viennent des fiches déjà filtrées par
 * la policy (`persons`) : un gardien est nommé comme le lecteur le voit dans l'arbre.
 */
export function rightsNotices(
  ctx: AccessContext,
  viewer: Member,
  persons: { id: string; firstName: string }[],
): Record<string, RightsNotice> {
  const firstNames = new Map(persons.map((p) => [p.id, p.firstName]));
  const memberName = (memberId: string) => {
    const personId = ctx.members.find((m) => m.id === memberId)?.personId;
    return personId ? firstNames.get(personId) : undefined;
  };
  return Object.fromEntries(
    persons.map((person) => {
      const rights = rightsOf(ctx, viewer, person.id);
      const guardianNames =
        rights.kind === 'outside' ? rights.guardians.flatMap((id) => memberName(id) ?? []) : [];
      return [person.id, rightsNotice(rights, { personName: person.firstName, guardianNames })];
    }),
  );
}
