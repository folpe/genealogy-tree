import { z } from 'zod';
import { ValidationError } from '../_shared/errors';
import { parseDateFields } from './date-fields.helper';
import { genderSchema, type Person } from './family.types';

// Modification sur place d'une fiche (phase 6, lot 2, avancé) : un champ à la fois,
// comme dans Contacts. Pur : on lit la saisie, on l'applique à la fiche ; le service
// décide des droits et écrit.

const text = (max: number) => z.string().trim().min(1).max(max);
/** Un champ de formulaire vide vaut « non renseigné ». */
const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optionalText = (max: number) => z.preprocess(blankToUndefined, text(max).optional());
const id = z.string().min(1).max(64);

const schema = z.discriminatedUnion('field', [
  z.object({ personId: id, field: z.enum(['firstName', 'lastName']), value: text(80) }),
  z.object({
    personId: id,
    field: z.enum(['birthName', 'nickname', 'residence']),
    value: optionalText(120),
  }),
  z.object({ personId: id, field: z.literal('gender'), value: genderSchema }),
  // La date se lit à part, champ par champ (`date-fields.helper`).
  z.object({ personId: id, field: z.literal('birth'), place: optionalText(120) }),
  z.object({
    personId: id,
    field: z.literal('death'),
    /** Absente : une date ou un lieu valent décès ; présente, elle fait foi. */
    deceased: z.preprocess(
      (v) => (v === undefined ? undefined : v === 'on' || v === true),
      z.boolean().optional(),
    ),
    place: optionalText(120),
  }),
]);

type LifeEvent = NonNullable<Person['birth']>;

export type PersonEdit =
  | { personId: string; field: 'firstName' | 'lastName'; value: string }
  | { personId: string; field: 'birthName' | 'nickname' | 'residence'; value?: string }
  | { personId: string; field: 'gender'; value: Person['gender'] }
  /** `event` absent : rien de connu (naissance) ou pas décédée (décès). */
  | { personId: string; field: 'birth' | 'death'; event?: LifeEvent };

export function parsePersonEdit(raw: unknown): PersonEdit {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Modification invalide';
    throw new ValidationError(message, parsed.error);
  }
  const edit = parsed.data;
  const { personId } = edit;
  switch (edit.field) {
    case 'firstName':
    case 'lastName':
      return { personId, field: edit.field, value: edit.value };
    case 'gender':
      return { personId, field: edit.field, value: edit.value };
    case 'birthName':
    case 'nickname':
    case 'residence':
      return edit.value === undefined
        ? { personId, field: edit.field }
        : { personId, field: edit.field, value: edit.value };
    case 'birth':
    case 'death': {
      const date = parseDateFields(raw, 'date');
      const event: LifeEvent = {
        ...(date ? { date } : {}),
        ...(edit.place ? { place: edit.place } : {}),
      };
      // Décès : la case fait foi quand elle est envoyée ; sans elle, une date ou un lieu
      // disent un décès (l'écran coche la case dès qu'on en saisit un).
      const given = Object.keys(event).length > 0;
      const known = edit.field === 'death' ? (edit.deceased ?? given) : given;
      return { personId, field: edit.field, ...(known ? { event } : {}) };
    }
  }
}

/** Retire un champ facultatif de la fiche, sans toucher au reste. */
function without(
  person: Person,
  field: 'birthName' | 'nickname' | 'residence' | 'birth' | 'death',
) {
  const copy = { ...person };
  delete copy[field];
  return copy;
}

export function applyPersonEdit(person: Person, edit: PersonEdit): Person {
  switch (edit.field) {
    case 'firstName':
    case 'lastName':
      return { ...person, [edit.field]: edit.value };
    case 'gender':
      return { ...person, gender: edit.value };
    case 'birthName':
    case 'nickname':
    case 'residence':
      return edit.value === undefined
        ? without(person, edit.field)
        : { ...person, [edit.field]: edit.value };
    case 'birth':
    case 'death':
      return edit.event ? { ...person, [edit.field]: edit.event } : without(person, edit.field);
  }
}

/** Champs de la fiche touchés, au format des faits sourcés (`death.date`...). */
export function sourcedFieldsOf(edit: PersonEdit): string[] {
  if (edit.field === 'birth' || edit.field === 'death') {
    return [`${edit.field}.date`, `${edit.field}.place`];
  }
  return [edit.field];
}
