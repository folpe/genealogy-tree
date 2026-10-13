// Droits par proximité (spec section 6, ADR 08). Fonctions pures : la phase 3 les
// appelle côté serveur dans chaque service, jamais seulement dans l'UI.

import {
  ancestorsOf,
  childrenOf,
  descendantsOf,
  type FamilyIndex,
  parentsOf,
  partnersOf,
  siblingsOf,
} from '../family/family.helper';
import type { FuzzyDate } from '../family/family.types';
import { ageAt } from '../family/fuzzy-date.helper';
import type {
  EditDecision,
  Member,
  ProposedChange,
  Visibility,
  VisibilityLevel,
} from './access.types';

export const ESCALATION_DELAY_DAYS = 14;
export const MAX_GUARDIANS = 3;
export const MAJORITY_AGE = 18;

export type AccessContext = {
  index: FamilyIndex;
  members: Member[];
  /** Fiches qu'aucun membre n'a dans sa lignée ni dans son cercle proche. */
  openRecords: Set<string>;
  /** Périmètre de base (sans les fiches ouvertes), par personne liée à un membre. */
  basePerimeters: Map<string, Set<string>>;
};

/** Conjoints dont l'union n'est pas rompue (en cours, ou veuvage). */
function unbrokenPartners(index: FamilyIndex, personId: string): string[] {
  return partnersOf(index, personId).flatMap((p) => {
    const union = index.unions.get(p.unionId);
    const unbroken = union?.end === undefined || union.end.reason === 'deces';
    return p.partnerId !== null && unbroken ? [p.partnerId] : [];
  });
}

/** Soi, conjoints (union non rompue), parents, enfants, frères et sœurs (demi compris). */
export function closeCircle(index: FamilyIndex, personId: string): Set<string> {
  return new Set([
    personId,
    ...unbrokenPartners(index, personId),
    ...parentsOf(index, personId).map((p) => p.id),
    ...childrenOf(index, personId).map((c) => c.id),
    ...siblingsOf(index, personId).map((s) => s.id),
  ]);
}

/** Cercle proche + toute l'ascendance + toute la descendance, avec leurs conjoints. */
function basePerimeter(index: FamilyIndex, personId: string): Set<string> {
  const result = closeCircle(index, personId);
  for (const id of [
    ...ancestorsOf(index, personId).keys(),
    ...descendantsOf(index, personId).keys(),
  ]) {
    result.add(id);
    for (const partner of unbrokenPartners(index, id)) result.add(partner);
  }
  return result;
}

export function buildAccessContext(index: FamilyIndex, members: Member[]): AccessContext {
  const basePerimeters = new Map<string, Set<string>>();
  for (const m of members) {
    if (m.personId !== null && !basePerimeters.has(m.personId)) {
      basePerimeters.set(m.personId, basePerimeter(index, m.personId));
    }
  }
  // Les anciens conjoints des personnes couvertes sont couverts aussi : on ne
  // modifie pas directement la fiche de l'ex d'un proche (spec section 8.1).
  const covered = new Set<string>();
  for (const set of basePerimeters.values()) {
    for (const id of set) {
      covered.add(id);
      for (const p of partnersOf(index, id)) if (p.partnerId !== null) covered.add(p.partnerId);
    }
  }
  const openRecords = new Set([...index.persons.keys()].filter((id) => !covered.has(id)));
  return { index, members, openRecords, basePerimeters };
}

/**
 * Fiche ouverte : aucun membre inscrit ne l'a dans son périmètre de base (ni comme
 * ancien conjoint d'une personne de ce périmètre). Plus protecteur que « dans son
 * cercle proche » : une fiche de la lignée d'un membre (Odette pour Hugo) n'est
 * jamais ouverte à tous.
 */
export function isOpenRecord(ctx: AccessContext, personId: string): boolean {
  return ctx.openRecords.has(personId);
}

export function perimeter(ctx: AccessContext, personId: string): Set<string> {
  const base = ctx.basePerimeters.get(personId) ?? basePerimeter(ctx.index, personId);
  return new Set([...base, ...ctx.openRecords]);
}

/**
 * Rang du lien direct pour départager des gardiens à même distance. À distance 1
 * il n'y a que conjoint, enfant ou parent ; au-delà, tous ont le même rang.
 */
function linkRank(index: FamilyIndex, from: string, to: string): number {
  if (unbrokenPartners(index, from).includes(to)) return 0;
  if (childrenOf(index, from).some((c) => c.id === to)) return 1;
  return 2;
}

/**
 * Gardiens : la personne si elle est inscrite ; sinon les membres inscrits les plus
 * proches dans le graphe (à la plus petite distance où il y en a), 3 au plus.
 * Départage : conjoint, enfant, parent, puis ancienneté du compte.
 */
export function guardiansOf(ctx: AccessContext, personId: string): string[] {
  const own = ctx.members.filter((m) => m.personId === personId);
  if (own.length > 0) return own.map((m) => m.id);

  const byPerson = new Map<string, Member[]>();
  for (const m of ctx.members) {
    if (m.personId !== null) byPerson.set(m.personId, [...(byPerson.get(m.personId) ?? []), m]);
  }
  const seen = new Set([personId]);
  let frontier = [personId];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      const neighbours = [
        ...unbrokenPartners(ctx.index, id),
        ...childrenOf(ctx.index, id).map((c) => c.id),
        ...parentsOf(ctx.index, id).map((p) => p.id),
      ];
      for (const n of neighbours) {
        if (!seen.has(n)) {
          seen.add(n);
          next.push(n);
        }
      }
    }
    const found = next.flatMap((id) => byPerson.get(id) ?? []);
    if (found.length > 0) {
      return found
        .sort(
          (a, b) =>
            linkRank(ctx.index, personId, a.personId as string) -
              linkRank(ctx.index, personId, b.personId as string) ||
            a.joinedAt - b.joinedAt ||
            a.id.localeCompare(b.id),
        )
        .slice(0, MAX_GUARDIANS)
        .map((m) => m.id);
    }
    frontier = next;
  }
  return [];
}

/** Membres à prévenir d'une modification de la fiche (veille de lignée), auteur exclu. */
export function watchersOf(
  ctx: AccessContext,
  personId: string,
  { authorId }: { authorId: string },
): string[] {
  return ctx.members
    .filter((m) => m.id !== authorId && m.personId !== null)
    .filter((m) => perimeter(ctx, m.personId as string).has(personId))
    .map((m) => m.id)
    .sort();
}

function suggest(
  ctx: AccessContext,
  viewer: Member,
  personId: string,
  reason: EditDecision['reason'],
): EditDecision {
  return {
    mode: 'suggest',
    reason,
    guardians: guardiansOf(ctx, personId).filter((id) => id !== viewer.id),
  };
}

/** Modification directe ou suggestion aux gardiens (spec section 6.3). */
export function canEdit(
  ctx: AccessContext,
  viewer: Member,
  personId: string,
  change: ProposedChange,
): EditDecision {
  if (viewer.isAdmin) return { mode: 'direct', reason: 'admin', guardians: [] };
  const own = viewer.personId;
  if (own === null || !perimeter(ctx, own).has(personId)) {
    return suggest(ctx, viewer, personId, 'outside');
  }
  if (change.reappliesReverted) return suggest(ctx, viewer, personId, 'reverted');
  const sourced = ctx.index.persons.get(personId)?.sourcedFields ?? [];
  if (!change.withNewSource && change.fields.some((f) => sourced.includes(f))) {
    return suggest(ctx, viewer, personId, 'sourced');
  }
  const reason =
    personId === own
      ? 'self'
      : closeCircle(ctx.index, own).has(personId)
        ? 'circle'
        : isOpenRecord(ctx, personId)
          ? 'open'
          : 'lineage';
  return { mode: 'direct', reason, guardians: [] };
}

/**
 * Fiches où le membre ajoute directement un proche (parent, enfant, conjoint). Même
 * règle pour l'écran et pour l'écriture : la policy décide, l'écran suit.
 */
export function editableIds(ctx: AccessContext, viewer: Member): string[] {
  return [...ctx.index.persons.keys()].filter(
    (id) => canEdit(ctx, viewer, id, { fields: ['relatives'] }).mode === 'direct',
  );
}

function isMinor(birth: FuzzyDate | undefined, today: FuzzyDate): boolean {
  if (!birth) return false;
  const age = ageAt(birth, today);
  // Dans le doute (âge approché à cheval sur 18 ans), on protège.
  return age !== null && (age.min ?? 0) < MAJORITY_AGE;
}

function levelFor(
  ctx: AccessContext,
  viewerPersonId: string | null,
  personId: string,
  today: FuzzyDate,
): VisibilityLevel {
  const person = ctx.index.persons.get(personId);
  if (!person || person.death !== undefined) return 'full';
  if (viewerPersonId === personId) return 'full';
  const inCircle = viewerPersonId !== null && closeCircle(ctx.index, viewerPersonId).has(personId);
  if (isMinor(person.birth?.date, today)) return inCircle ? 'full' : 'minor';
  if (person.visibility === 'cercle') return inCircle ? 'full' : 'structure';
  if (viewerPersonId !== null && perimeter(ctx, viewerPersonId).has(personId)) return 'full';
  return 'family';
}

/** Ce qu'un membre voit d'une fiche (spec section 6.4). `today` est fourni par l'appelant. */
export function visibilityOf(
  ctx: AccessContext,
  viewer: Member,
  personId: string,
  today: FuzzyDate,
): Visibility {
  const level = levelFor(ctx, viewer.personId, personId, today);
  if (viewer.isAdmin) return { level: 'full', audit: level !== 'full' };
  return { level, audit: false };
}

/** Une suggestion sans réponse passe aux admins après 14 jours. Horodatages en ms. */
export function escalationDue(
  suggestion: { createdAt: number; answeredAt?: number },
  now: number,
): boolean {
  if (suggestion.answeredAt !== undefined) return false;
  return now - suggestion.createdAt >= ESCALATION_DELAY_DAYS * 24 * 60 * 60 * 1000;
}
