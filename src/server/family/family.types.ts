import { z } from 'zod';

const year = z.int().min(1).max(9999);
const month = z.int().min(1).max(12);

function isValidDay(y: number, m: number, d: number): boolean {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Date à précision variable (spec section 5). Les précisions `vers`, `avant`,
 * `apres` et `entre` sont à l'année : c'est la granularité des actes anciens.
 */
export const fuzzyDateSchema = z.discriminatedUnion('precision', [
  z
    .object({ precision: z.literal('exacte'), year, month, day: z.int().min(1).max(31) })
    .refine((d) => isValidDay(d.year, d.month, d.day), {
      message: 'Date impossible',
      path: ['day'],
    }),
  z.object({ precision: z.literal('mois'), year, month }),
  z.object({ precision: z.literal('annee'), year }),
  z.object({ precision: z.literal('vers'), year }),
  z.object({ precision: z.literal('avant'), year }),
  z.object({ precision: z.literal('apres'), year }),
  z.object({ precision: z.literal('entre'), from: year, to: year }).refine((d) => d.from <= d.to, {
    message: 'Le début de l’intervalle doit précéder la fin',
    path: ['to'],
  }),
]);
export type FuzzyDate = z.infer<typeof fuzzyDateSchema>;
export type FuzzyDatePrecision = FuzzyDate['precision'];

const id = z.string().min(1);

export const genderSchema = z.enum(['homme', 'femme', 'autre', 'inconnu']);
export type Gender = z.infer<typeof genderSchema>;

/** `famille` : visible selon la matrice par défaut ; `cercle` : restreint au cercle proche. */
export const visibilitySchema = z.enum(['famille', 'cercle']);
export type Visibility = z.infer<typeof visibilitySchema>;

const lifeEventSchema = z.object({
  date: fuzzyDateSchema.optional(),
  place: z.string().min(1).optional(),
});

export const personSchema = z.object({
  id,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthName: z.string().min(1).optional(),
  /** Nom d'usage dans la famille (« Lulu », « 三叔 ») : un nom comme un autre pour les droits. */
  nickname: z.string().min(1).optional(),
  gender: genderSchema,
  birth: lifeEventSchema.optional(),
  /** Présent dès que la personne est décédée, même si date et lieu sont inconnus. */
  death: lifeEventSchema.optional(),
  residence: z.string().min(1).optional(),
  visibility: visibilitySchema.default('famille'),
  /** Note libre de la famille sur la personne, en fin de fiche (visible en lecture complète). */
  notes: z.string().min(1).max(2000).optional(),
  /** Champs rattachés à une source (acte, livret, photo) : badge « Sourcé ». */
  sourcedFields: z.array(z.string().min(1)).default([]),
});
export type Person = z.infer<typeof personSchema>;

export const unionKindSchema = z.enum(['mariage', 'pacs', 'union_libre', 'inconnu']);
export const unionEndReasonSchema = z.enum(['deces', 'divorce', 'separation']);

export const unionSchema = z.object({
  id,
  /** Deux partenaires ; `null` quand l'un d'eux est inconnu. */
  partnerIds: z.tuple([id, id.nullable()]),
  kind: unionKindSchema,
  start: fuzzyDateSchema.optional(),
  /** Absente : l'union est en cours. */
  end: z.object({ date: fuzzyDateSchema.optional(), reason: unionEndReasonSchema }).optional(),
});
export type Union = z.infer<typeof unionSchema>;

export const parentChildKindSchema = z.enum(['biologique', 'adoptive', 'a_eleve', 'inconnue']);
export type ParentChildKind = z.infer<typeof parentChildKindSchema>;

export const parentChildSchema = z.object({
  parentId: id,
  childId: id,
  kind: parentChildKindSchema,
  /** Union dont l'enfant est issu, quand elle est connue. */
  unionId: id.optional(),
});
export type ParentChild = z.infer<typeof parentChildSchema>;

export const familyGraphSchema = z
  .object({
    persons: z.array(personSchema),
    unions: z.array(unionSchema),
    parentChildren: z.array(parentChildSchema),
  })
  .superRefine((graph, ctx) => {
    const personIds = new Set<string>();
    graph.persons.forEach((p, i) => {
      if (personIds.has(p.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Identifiant en double : ${p.id}`,
          path: ['persons', i, 'id'],
        });
      }
      personIds.add(p.id);
    });
    const unionIds = new Set(graph.unions.map((u) => u.id));

    const person = (value: string | null, path: (string | number)[]) => {
      if (value !== null && !personIds.has(value)) {
        ctx.addIssue({ code: 'custom', message: `Personne inconnue : ${value}`, path });
      }
    };

    graph.unions.forEach((u, i) => {
      u.partnerIds.forEach((pid, j) => {
        person(pid, ['unions', i, 'partnerIds', j]);
      });
    });
    graph.parentChildren.forEach((pc, i) => {
      person(pc.parentId, ['parentChildren', i, 'parentId']);
      person(pc.childId, ['parentChildren', i, 'childId']);
      if (pc.unionId !== undefined && !unionIds.has(pc.unionId)) {
        ctx.addIssue({
          code: 'custom',
          message: `Union inconnue : ${pc.unionId}`,
          path: ['parentChildren', i, 'unionId'],
        });
      }
    });
  });
export type FamilyGraph = z.infer<typeof familyGraphSchema>;
