import type {
  events,
  parentChild,
  persons,
  places,
  residences,
  sourcedFacts,
  unions,
} from '../db/schema';
import type { FamilyGraph, FuzzyDate, Person, Union } from './family.types';

// Passage entre les lignes Drizzle et le graphe du domaine (phase 2), dans les deux
// sens. Pur : le repository fait les requêtes, le mapper ne fait que traduire.
// Frontière du `null` : Postgres en renvoie, le domaine n'en connaît pas (sauf le
// partenaire inconnu d'une union) ; tout passe par `?? undefined` ici.

/** Une ligne lue (colonnes nullables à `null`) ou à écrire (à `undefined`, donc NULL). */
type Row<T> = { [K in keyof T]: null extends T[K] ? T[K] | undefined : T[K] }; // allow-null: type de frontière

type PersonRow = Row<
  Pick<
    typeof persons.$inferSelect,
    'id' | 'firstName' | 'lastName' | 'birthName' | 'nickname' | 'gender' | 'visibility'
  >
>;
type EventRow = Row<
  Pick<
    typeof events.$inferSelect,
    'id' | 'personId' | 'kind' | 'datePrecision' | 'dateValue' | 'dateValueEnd' | 'placeId'
  >
>;
type PlaceRow = Row<Pick<typeof places.$inferSelect, 'id' | 'label' | 'normalizedLabel'>>;
type ResidenceRow = Row<typeof residences.$inferSelect>;
type UnionRow = Row<Omit<typeof unions.$inferSelect, 'createdAt'>>;
type ParentChildRow = Row<typeof parentChild.$inferSelect>;
type SourcedFactRow = Row<typeof sourcedFacts.$inferSelect>;

export type FamilyRows = {
  persons: PersonRow[];
  events: EventRow[];
  places: PlaceRow[];
  residences: ResidenceRow[];
  unions: UnionRow[];
  parentChildren: ParentChildRow[];
  sourcedFacts: SourcedFactRow[];
};

export type FuzzyDateColumns = {
  precision?: EventRow['datePrecision'];
  value?: EventRow['dateValue'];
  valueEnd?: EventRow['dateValueEnd'];
};

const iso = (year: number, month = 1, day = 1) =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export function fuzzyDateToColumns(date: FuzzyDate | undefined): FuzzyDateColumns {
  if (!date) return {};
  switch (date.precision) {
    case 'exacte':
      return { precision: date.precision, value: iso(date.year, date.month, date.day) };
    case 'mois':
      return { precision: date.precision, value: iso(date.year, date.month) };
    case 'entre':
      return { precision: date.precision, value: iso(date.from), valueEnd: iso(date.to) };
    default:
      return { precision: date.precision, value: iso(date.year) };
  }
}

function invalid(columns: FuzzyDateColumns): never {
  throw new Error(`Date en base invalide : ${JSON.stringify(columns)}`);
}

export function columnsToFuzzyDate(columns: FuzzyDateColumns): FuzzyDate | undefined {
  const precision = columns.precision ?? undefined;
  const value = columns.value ?? undefined;
  const valueEnd = columns.valueEnd ?? undefined;
  if (precision === undefined && value === undefined) return undefined;
  if (precision === undefined || value === undefined) return invalid(columns);
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  switch (precision) {
    case 'exacte':
      return { precision, year, month, day };
    case 'mois':
      return { precision, year, month };
    case 'entre':
      if (valueEnd === undefined) return invalid(columns);
      return { precision, from: year, to: Number(valueEnd.slice(0, 4)) };
    default:
      return { precision, year };
  }
}

export function normalizePlaceLabel(label: string): string {
  return label.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Fabrique des identifiants des lignes dérivées (lieux, événements, résidences). */
export type RowIds = {
  place: (normalizedLabel: string) => string;
  event: (personId: string, kind: EventRow['kind']) => string;
  residence: (personId: string) => string;
};

const randomIds: RowIds = {
  place: () => crypto.randomUUID(),
  event: () => crypto.randomUUID(),
  residence: () => crypto.randomUUID(),
};

export function graphToRows(graph: FamilyGraph, ids: RowIds = randomIds): FamilyRows {
  const rows: FamilyRows = {
    persons: [],
    events: [],
    places: [],
    residences: [],
    unions: [],
    parentChildren: [],
    sourcedFacts: [],
  };
  const placeIds = new Map<string, string>();
  const placeId = (label: string | undefined): string | undefined => {
    if (label === undefined) return undefined;
    const key = normalizePlaceLabel(label);
    const known = placeIds.get(key);
    if (known) return known;
    const created = ids.place(key);
    placeIds.set(key, created);
    rows.places.push({ id: created, label, normalizedLabel: key });
    return created;
  };

  for (const p of graph.persons) {
    rows.persons.push({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      birthName: p.birthName,
      nickname: p.nickname,
      gender: p.gender,
      visibility: p.visibility,
    });
    const lifeEvents = [
      { kind: 'naissance', event: p.birth },
      { kind: 'deces', event: p.death },
    ] satisfies { kind: EventRow['kind']; event: Person['birth'] }[];
    for (const { kind, event } of lifeEvents) {
      if (!event) continue;
      const d = fuzzyDateToColumns(event.date);
      rows.events.push({
        id: ids.event(p.id, kind),
        personId: p.id,
        kind,
        datePrecision: d.precision,
        dateValue: d.value,
        dateValueEnd: d.valueEnd,
        placeId: placeId(event.place),
      });
    }
    const residencePlace = placeId(p.residence);
    if (residencePlace) {
      rows.residences.push({
        id: ids.residence(p.id),
        personId: p.id,
        placeId: residencePlace,
        startPrecision: undefined,
        startValue: undefined,
        startValueEnd: undefined,
        endPrecision: undefined,
        endValue: undefined,
        endValueEnd: undefined,
      });
    }
    for (const field of p.sourcedFields) {
      rows.sourcedFacts.push({ personId: p.id, field, sourceId: undefined });
    }
  }

  for (const u of graph.unions) {
    const start = fuzzyDateToColumns(u.start);
    const end = fuzzyDateToColumns(u.end?.date);
    rows.unions.push({
      id: u.id,
      partnerAId: u.partnerIds[0],
      partnerBId: u.partnerIds[1],
      kind: u.kind,
      startPrecision: start.precision,
      startValue: start.value,
      startValueEnd: start.valueEnd,
      endReason: u.end?.reason,
      endPrecision: end.precision,
      endValue: end.value,
      endValueEnd: end.valueEnd,
    });
  }

  for (const pc of graph.parentChildren) {
    rows.parentChildren.push({
      parentId: pc.parentId,
      childId: pc.childId,
      kind: pc.kind,
      unionId: pc.unionId,
    });
  }
  return rows;
}

function lifeEvent(row: EventRow | undefined, placeLabels: Map<string, string>) {
  if (!row) return undefined;
  const date = columnsToFuzzyDate({
    precision: row.datePrecision,
    value: row.dateValue,
    valueEnd: row.dateValueEnd,
  });
  const place = row.placeId ? placeLabels.get(row.placeId) : undefined;
  return { ...(date ? { date } : {}), ...(place ? { place } : {}) };
}

/** Résidence en cours : sans fin, la plus récemment commencée. */
function currentResidence(rows: ResidenceRow[]): ResidenceRow | undefined {
  return rows
    .filter((r) => !r.endPrecision)
    .sort((a, b) => (b.startValue ?? '').localeCompare(a.startValue ?? ''))[0];
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return groups;
}

export function rowsToGraph(rows: FamilyRows): FamilyGraph {
  const placeLabels = new Map(rows.places.map((p) => [p.id, p.label]));
  const eventsByPerson = groupBy(rows.events, (e) => e.personId);
  const residencesByPerson = groupBy(rows.residences, (r) => r.personId);
  const factsByPerson = groupBy(rows.sourcedFacts, (f) => f.personId);

  const graphPersons = rows.persons.map((row): Person => {
    const personEvents = eventsByPerson.get(row.id) ?? [];
    const birth = lifeEvent(
      personEvents.find((e) => e.kind === 'naissance'),
      placeLabels,
    );
    const death = lifeEvent(
      personEvents.find((e) => e.kind === 'deces'),
      placeLabels,
    );
    const residence = currentResidence(residencesByPerson.get(row.id) ?? []);
    const residenceLabel = residence ? placeLabels.get(residence.placeId) : undefined;
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      ...(row.birthName ? { birthName: row.birthName } : {}),
      ...(row.nickname ? { nickname: row.nickname } : {}),
      gender: row.gender,
      ...(birth ? { birth } : {}),
      ...(death ? { death } : {}),
      ...(residenceLabel ? { residence: residenceLabel } : {}),
      visibility: row.visibility,
      sourcedFields: (factsByPerson.get(row.id) ?? []).map((f) => f.field).sort(),
    };
  });

  const graphUnions = rows.unions.map((row): Union => {
    const start = columnsToFuzzyDate({
      precision: row.startPrecision,
      value: row.startValue,
      valueEnd: row.startValueEnd,
    });
    const endDate = columnsToFuzzyDate({
      precision: row.endPrecision,
      value: row.endValue,
      valueEnd: row.endValueEnd,
    });
    return {
      id: row.id,
      partnerIds: [row.partnerAId, row.partnerBId ?? null], // allow-null: partenaire inconnu du domaine
      kind: row.kind,
      ...(start ? { start } : {}),
      ...(row.endReason
        ? { end: { reason: row.endReason, ...(endDate ? { date: endDate } : {}) } }
        : {}),
    };
  });

  return {
    persons: graphPersons,
    unions: graphUnions,
    parentChildren: rows.parentChildren.map((row) => ({
      parentId: row.parentId,
      childId: row.childId,
      kind: row.kind,
      ...(row.unionId ? { unionId: row.unionId } : {}),
    })),
  };
}
