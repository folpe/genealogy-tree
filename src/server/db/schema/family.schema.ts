// tdd-cover: e2e src/server/family/family.repository.integration.test.ts
import { type SQL, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  type PgColumn,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Modèle de la spec, section 5. Les contraintes doublent les invariants du domaine :
// un service contourné ne doit pas pouvoir écrire un état impossible.
//
// Date à précision variable : trois colonnes `<x>_precision`, `<x>_value` (début,
// au 1er janvier ou au 1er du mois selon la précision) et `<x>_value_end` (fin,
// pour `entre` seulement). Encodage dans `family/family.mapper.ts`.

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const genderEnum = pgEnum('gender', ['homme', 'femme', 'autre', 'inconnu']);
export const visibilityEnum = pgEnum('visibility', ['famille', 'cercle']);
export const datePrecisionEnum = pgEnum('date_precision', [
  'exacte',
  'mois',
  'annee',
  'vers',
  'avant',
  'apres',
  'entre',
]);
export const unionKindEnum = pgEnum('union_kind', ['mariage', 'pacs', 'union_libre', 'inconnu']);
export const unionEndReasonEnum = pgEnum('union_end_reason', ['deces', 'divorce', 'separation']);
export const filiationKindEnum = pgEnum('filiation_kind', [
  'biologique',
  'adoptive',
  'a_eleve',
  'inconnue',
]);
export const eventKindEnum = pgEnum('event_kind', [
  'naissance',
  'deces',
  'bapteme',
  'inhumation',
  'demenagement',
  'autre',
]);
export const sourceKindEnum = pgEnum('source_kind', [
  'acte',
  'livret',
  'photo',
  'temoignage',
  'autre',
]);
export const mediaKindEnum = pgEnum('media_kind', ['photo', 'document', 'audio', 'video']);
export const geocoderEnum = pgEnum('geocoder', ['ban', 'nominatim', 'manuel']);

/** Une date est absente ou complète ; la fin n'existe que pour `entre` et suit le début. */
function fuzzyDateChecks(name: string, precision: PgColumn, value: PgColumn, valueEnd: PgColumn) {
  const rules: [string, SQL][] = [
    ['complete', sql`(${precision} is null) = (${value} is null)`],
    ['range', sql`(${valueEnd} is not null) = (${precision} is not distinct from 'entre')`],
    ['order', sql`${valueEnd} is null or ${valueEnd} >= ${value}`],
  ];
  return rules.map(([rule, expr]) => check(`${name}_${rule}`, expr));
}

export const places = pgTable('places', {
  id: id(),
  label: text('label').notNull(),
  /** Libellé normalisé : clé de déduplication et de cache du géocodage. */
  normalizedLabel: text('normalized_label').notNull().unique(),
  city: text('city'),
  postcode: text('postcode'),
  region: text('region'),
  country: text('country'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  geocoder: geocoderEnum('geocoder'),
  geocodeScore: real('geocode_score'),
  createdAt: createdAt(),
});

export const media = pgTable('media', {
  id: id(),
  kind: mediaKindEnum('kind').notNull(),
  /** Chemin dans le store Blob privé : `persons/<person_id>/<sha256>.<ext>`. */
  pathname: text('pathname').notNull(),
  sha256: text('sha256').notNull().unique(),
  mime: text('mime').notNull(),
  bytes: integer('bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  blurDataUrl: text('blur_data_url'),
  caption: text('caption'),
  /** URL d'origine (Notion, lien externe), pour l'audit de la migration. */
  originUrl: text('origin_url'),
  legacyNotionId: text('legacy_notion_id'),
  createdAt: createdAt(),
});

export const persons = pgTable('persons', {
  id: id(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  birthName: text('birth_name'),
  nickname: text('nickname'),
  gender: genderEnum('gender').notNull().default('inconnu'),
  visibility: visibilityEnum('visibility').notNull().default('famille'),
  /** Forcé à la main ; absent : déduit des événements (décès, âge). */
  isLivingOverride: boolean('is_living_override'),
  notes: text('notes'),
  photoMediaId: text('photo_media_id').references(() => media.id, { onDelete: 'set null' }),
  legacyNotionId: text('legacy_notion_id').unique(),
  /** Verrou optimiste de l'éditeur (phase 6). */
  version: integer('version').notNull().default(1),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const unions = pgTable(
  'unions',
  {
    id: id(),
    partnerAId: text('partner_a_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Absent : partenaire inconnu. */
    partnerBId: text('partner_b_id').references(() => persons.id, { onDelete: 'cascade' }),
    kind: unionKindEnum('kind').notNull().default('inconnu'),
    startPrecision: datePrecisionEnum('start_precision'),
    startValue: date('start_value', { mode: 'string' }),
    startValueEnd: date('start_value_end', { mode: 'string' }),
    /** Absent : union en cours. */
    endReason: unionEndReasonEnum('end_reason'),
    endPrecision: datePrecisionEnum('end_precision'),
    endValue: date('end_value', { mode: 'string' }),
    endValueEnd: date('end_value_end', { mode: 'string' }),
    createdAt: createdAt(),
  },
  (t) => [
    index('unions_partner_a_idx').on(t.partnerAId),
    index('unions_partner_b_idx').on(t.partnerBId),
    check('unions_distinct_partners', sql`${t.partnerAId} <> ${t.partnerBId}`),
    check('unions_end_needs_reason', sql`${t.endPrecision} is null or ${t.endReason} is not null`),
    ...fuzzyDateChecks('unions_start', t.startPrecision, t.startValue, t.startValueEnd),
    ...fuzzyDateChecks('unions_end', t.endPrecision, t.endValue, t.endValueEnd),
  ],
);

export const parentChild = pgTable(
  'parent_child',
  {
    parentId: text('parent_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    childId: text('child_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    kind: filiationKindEnum('kind').notNull().default('biologique'),
    unionId: text('union_id').references(() => unions.id, { onDelete: 'set null' }),
  },
  (t) => [
    primaryKey({ columns: [t.parentId, t.childId] }),
    index('parent_child_child_idx').on(t.childId),
    check('parent_child_distinct', sql`${t.parentId} <> ${t.childId}`),
  ],
);

export const events = pgTable(
  'events',
  {
    id: id(),
    personId: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    kind: eventKindEnum('kind').notNull(),
    datePrecision: datePrecisionEnum('date_precision'),
    dateValue: date('date_value', { mode: 'string' }),
    dateValueEnd: date('date_value_end', { mode: 'string' }),
    placeId: text('place_id').references(() => places.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: createdAt(),
  },
  (t) => [
    index('events_person_idx').on(t.personId),
    // Une seule naissance et un seul décès par personne.
    uniqueIndex('events_one_birth').on(t.personId).where(sql`${t.kind} = 'naissance'`),
    uniqueIndex('events_one_death').on(t.personId).where(sql`${t.kind} = 'deces'`),
    ...fuzzyDateChecks('events_date', t.datePrecision, t.dateValue, t.dateValueEnd),
  ],
);

export const residences = pgTable(
  'residences',
  {
    id: id(),
    personId: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    placeId: text('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'restrict' }),
    startPrecision: datePrecisionEnum('start_precision'),
    startValue: date('start_value', { mode: 'string' }),
    startValueEnd: date('start_value_end', { mode: 'string' }),
    /** Absente : résidence en cours. */
    endPrecision: datePrecisionEnum('end_precision'),
    endValue: date('end_value', { mode: 'string' }),
    endValueEnd: date('end_value_end', { mode: 'string' }),
  },
  (t) => [
    index('residences_person_idx').on(t.personId),
    ...fuzzyDateChecks('residences_start', t.startPrecision, t.startValue, t.startValueEnd),
    ...fuzzyDateChecks('residences_end', t.endPrecision, t.endValue, t.endValueEnd),
  ],
);

export const sources = pgTable('sources', {
  id: id(),
  kind: sourceKindEnum('kind').notNull(),
  description: text('description'),
  mediaId: text('media_id').references(() => media.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
});

/** Champ d'une fiche rattaché à une source : badge « Sourcé » (spec section 6.3). */
export const sourcedFacts = pgTable(
  'sourced_facts',
  {
    personId: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Chemin pointé du champ (`birth.date`, `death.place`...), comme `Person.sourcedFields`. */
    field: text('field').notNull(),
    sourceId: text('source_id').references(() => sources.id, { onDelete: 'set null' }),
  },
  (t) => [primaryKey({ columns: [t.personId, t.field] })],
);

export const mediaPersons = pgTable(
  'media_persons',
  {
    mediaId: text('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    personId: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.mediaId, t.personId] }),
    index('media_persons_person_idx').on(t.personId),
  ],
);
