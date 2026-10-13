import { z } from 'zod';
import { AppError, ValidationError } from '../_shared/errors';
import { ParentsFullError } from './family.errors';
import { type FamilyIndex, parentsOf, partnersOf } from './family.helper';
import { assertCanAddParentChild, assertCanAddUnion } from './family.invariants';
import {
  type FuzzyDate,
  genderSchema,
  type ParentChild,
  type Person,
  type Union,
} from './family.types';
import { parseFuzzyDate } from './fuzzy-date.helper';

// Ajout d'un proche (plan phase 6, lot 2, version minimale) : un parent, un enfant ou
// un conjoint, créé en même temps que son lien. Pur : on prépare les lignes, les
// invariants du graphe tranchent, le service écrit.

const text = (max: number) => z.string().trim().min(1).max(max);
/** Un champ de formulaire vide vaut « non renseigné ». */
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    text(max).optional(),
  );
const date = optionalText(40).transform((value, ctx) => {
  if (value === undefined) return undefined;
  const parsed = parseFuzzyDate(value) ?? undefined;
  if (!parsed) {
    ctx.addIssue({ code: 'custom', message: 'Date illisible : essaie « 1987 » ou « vers 1850 »' });
    return z.NEVER;
  }
  return parsed;
});

const schema = z.object({
  anchorId: text(64),
  relation: z.enum(['parent', 'child', 'partner']),
  firstName: text(80),
  lastName: text(80),
  birthName: optionalText(80),
  gender: genderSchema,
  birth: date,
  birthPlace: optionalText(120),
  deceased: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
  death: date,
  /** Parent : l'autre parent, avec qui il forme un couple. Enfant : l'autre parent, conjoint. */
  otherParentId: optionalText(64),
});

export type AddRelativeInput = Omit<Person, 'id' | 'visibility' | 'sourcedFields'> & {
  anchorId: string;
  relation: 'parent' | 'child' | 'partner';
  otherParentId?: string;
};

export function parseAddRelative(raw: unknown): AddRelativeInput {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ValidationError('Fiche invalide', parsed.error);
  const { birth, birthPlace, deceased, death, birthName, otherParentId, ...rest } = parsed.data;
  const event = (d: FuzzyDate | undefined, place?: string) => ({
    ...(d ? { date: d } : {}),
    ...(place ? { place } : {}),
  });
  return {
    ...rest,
    ...(birthName ? { birthName } : {}),
    ...(birth || birthPlace ? { birth: event(birth, birthPlace) } : {}),
    ...(deceased ? { death: event(death) } : {}),
    ...(otherParentId ? { otherParentId } : {}),
  };
}

export type RelativePlan = {
  person: Person;
  unions: Union[];
  parentChildren: ParentChild[];
  /** Filiations existantes rattachées à la nouvelle union (l'autre parent). */
  linkUnions: { parentId: string; childId: string; unionId: string }[];
};

const invalid = (message: string) => new ValidationError(message);

export function planAddRelative(
  index: FamilyIndex,
  input: AddRelativeInput,
  ids: { person: string; union: string },
): RelativePlan {
  const anchor = index.persons.get(input.anchorId);
  if (!anchor) {
    throw new AppError({ message: 'Fiche introuvable', code: 'FAMILY_NOT_FOUND', status: 404 });
  }
  const { anchorId, relation, otherParentId, ...fields } = input;
  const person: Person = { id: ids.person, ...fields, visibility: 'famille', sourcedFields: [] };
  const plan: RelativePlan = { person, unions: [], parentChildren: [], linkUnions: [] };

  if (relation === 'partner') {
    plan.unions.push({ id: ids.union, partnerIds: [anchorId, person.id], kind: 'inconnu' });
  } else if (relation === 'parent') {
    const parents = parentsOf(index, anchorId);
    if (parents.length >= 2) {
      throw new ParentsFullError(anchor.firstName);
    }
    const link: ParentChild = { parentId: person.id, childId: anchorId, kind: 'biologique' };
    if (otherParentId) {
      if (!parents.some((p) => p.id === otherParentId)) throw invalid('Autre parent inconnu');
      plan.unions.push({ id: ids.union, partnerIds: [otherParentId, person.id], kind: 'inconnu' });
      link.unionId = ids.union;
      plan.linkUnions.push({ parentId: otherParentId, childId: anchorId, unionId: ids.union });
    }
    plan.parentChildren.push(link);
  } else {
    const union = otherParentId
      ? partnersOf(index, anchorId).find((p) => p.partnerId === otherParentId)
      : undefined;
    if (otherParentId && !union) throw invalid('Autre parent inconnu');
    const unionId = union ? { unionId: union.unionId } : {};
    for (const parentId of otherParentId ? [anchorId, otherParentId] : [anchorId]) {
      plan.parentChildren.push({ parentId, childId: person.id, kind: 'biologique', ...unionId });
    }
  }
  assertPlan(index, plan);
  return plan;
}

/** Les invariants, sur le graphe tel qu'il serait avec la nouvelle fiche. */
function assertPlan(index: FamilyIndex, plan: RelativePlan) {
  const next: FamilyIndex = { ...index, persons: new Map(index.persons) };
  next.persons.set(plan.person.id, plan.person);
  for (const union of plan.unions) assertCanAddUnion(next, union);
  for (const link of plan.parentChildren) assertCanAddParentChild(next, link);
}
