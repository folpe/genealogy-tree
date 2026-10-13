// tdd-cover: e2e src/server/family/family.repository.integration.test.ts

import { and, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { AppError } from '../_shared/errors';
import {
  events,
  parentChild,
  persons,
  places,
  residences,
  sourcedFacts,
  unions,
  users,
} from '../db/schema';
import type { Db } from '../db/types';

/** Transaction Drizzle, telle que `db.transaction` la passe. */
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

import { ParentsFullError } from './family.errors';
import { FILIATION_KINDS } from './family.helper';
import { fuzzyDateToColumns, graphToRows, normalizePlaceLabel, rowsToGraph } from './family.mapper';
import type { FamilyGraph, Person } from './family.types';
import type { PersonEdit } from './person-edit.helper';
import type { RelativePlan } from './relatives.helper';

// Seul point de contact du domaine famille avec la base. L'arbre tient en mémoire :
// on charge tout, une requête par table, et la policy s'applique ensuite côté service.

export async function loadFamilyGraph(db: Db): Promise<FamilyGraph> {
  const [p, e, pl, r, u, pc, sf] = await Promise.all([
    db.select().from(persons),
    db.select().from(events),
    db.select().from(places),
    db.select().from(residences),
    db.select().from(unions),
    db.select().from(parentChild),
    db.select().from(sourcedFacts),
  ]);
  // Corbeille : une fiche supprimée disparaît, avec ce qui ne tient qu'à elle. Rien
  // n'est effacé en base ; une restauration ramène tout.
  const trashed = new Set(p.filter((row) => row.deletedAt !== null).map((row) => row.id)); // allow-null: colonne Postgres
  const kept = (id: string | null) => id === null || !trashed.has(id); // allow-null: partenaire inconnu
  return rowsToGraph({
    persons: p.filter((row) => kept(row.id)),
    events: e.filter((row) => kept(row.personId)),
    places: pl,
    residences: r.filter((row) => kept(row.personId)),
    unions: u.filter((row) => kept(row.partnerAId) && kept(row.partnerBId)),
    parentChildren: pc.filter((row) => kept(row.parentId) && kept(row.childId)),
    sourcedFacts: sf.filter((row) => kept(row.personId)),
  });
}

/** Met une fiche à la corbeille (`at` défini) ou l'en sort (`at` absent). */
export async function setPersonTrashed(
  db: Db,
  personId: string,
  trash: { at: Date; by: string } | undefined,
): Promise<boolean> {
  const rows = await db
    .update(persons)
    .set(
      trash ? { deletedAt: trash.at, deletedBy: trash.by } : { deletedAt: null, deletedBy: null },
    ) // allow-null: colonnes vidées
    .where(eq(persons.id, personId))
    .returning({ id: persons.id });
  return rows.length === 1;
}

/** Les fiches à la corbeille, les plus récentes d'abord, avec qui les y a mises. */
export async function loadTrash(db: Db) {
  return db
    .select({
      id: persons.id,
      firstName: persons.firstName,
      lastName: persons.lastName,
      deletedAt: persons.deletedAt,
      deletedByName: users.name,
    })
    .from(persons)
    .leftJoin(users, eq(users.id, persons.deletedBy))
    .where(isNotNull(persons.deletedAt))
    .orderBy(desc(persons.deletedAt));
}

/** Insère un graphe complet en une transaction : tout ou rien (seed, migration Notion). */
export async function insertFamilyGraph(db: Db, graph: FamilyGraph): Promise<void> {
  const rows = graphToRows(graph);
  await db.transaction(async (tx) => {
    // Ordre imposé par les clés étrangères.
    if (rows.places.length) await tx.insert(places).values(rows.places);
    if (rows.persons.length) await tx.insert(persons).values(rows.persons);
    if (rows.unions.length) await tx.insert(unions).values(rows.unions);
    if (rows.parentChildren.length) await tx.insert(parentChild).values(rows.parentChildren);
    if (rows.events.length) await tx.insert(events).values(rows.events);
    if (rows.residences.length) await tx.insert(residences).values(rows.residences);
    if (rows.sourcedFacts.length) await tx.insert(sourcedFacts).values(rows.sourcedFacts);
  });
}

/**
 * Écrit une nouvelle fiche et ses liens d'un bloc. La fiche de départ est verrouillée
 * le temps de l'écriture, et ses parents recomptés : deux ajouts simultanés d'un
 * parent ne peuvent pas lui en donner trois.
 */
export async function insertRelative(
  db: Db,
  plan: RelativePlan,
  guard: { anchorId: string; maxParents?: number },
): Promise<void> {
  const rows = graphToRows({
    persons: [plan.person],
    unions: plan.unions,
    parentChildren: plan.parentChildren,
  });
  await db.transaction(async (tx) => {
    const [anchor] = await tx
      .select({ id: persons.id })
      .from(persons)
      .where(eq(persons.id, guard.anchorId))
      .for('update');
    // Supprimée entre la lecture et l'écriture : rien ne s'écrit.
    if (!anchor) {
      throw new AppError({ message: 'Fiche introuvable', code: 'FAMILY_NOT_FOUND', status: 404 });
    }
    if (guard.maxParents !== undefined) {
      const parents = await tx
        .select({ id: parentChild.parentId })
        .from(parentChild)
        .where(
          and(
            eq(parentChild.childId, guard.anchorId),
            inArray(parentChild.kind, [...FILIATION_KINDS]),
          ),
        );
      if (parents.length >= guard.maxParents) throw new ParentsFullError();
    }
    // Un lieu déjà connu garde son identifiant : la clé est le libellé normalisé.
    const placeIds = new Map<string, string>();
    if (rows.places.length) {
      await tx
        .insert(places)
        .values(rows.places)
        .onConflictDoNothing({ target: places.normalizedLabel });
      const stored = await tx
        .select({ id: places.id, normalizedLabel: places.normalizedLabel })
        .from(places)
        .where(
          inArray(
            places.normalizedLabel,
            rows.places.map((p) => p.normalizedLabel),
          ),
        );
      const byLabel = new Map(stored.map((p) => [p.normalizedLabel, p.id]));
      for (const place of rows.places) {
        const id = byLabel.get(place.normalizedLabel);
        if (id) placeIds.set(place.id, id);
      }
    }
    const placeOf = (id: string | undefined) => (id ? placeIds.get(id) : undefined);
    await tx.insert(persons).values(rows.persons);
    if (rows.unions.length) await tx.insert(unions).values(rows.unions);
    if (rows.parentChildren.length) await tx.insert(parentChild).values(rows.parentChildren);
    if (rows.events.length) {
      await tx
        .insert(events)
        .values(rows.events.map((e) => ({ ...e, placeId: placeOf(e.placeId ?? undefined) })));
    }
    for (const link of plan.linkUnions) {
      const updated = await tx
        .update(parentChild)
        .set({ unionId: link.unionId })
        .where(
          and(
            eq(parentChild.parentId, link.parentId),
            eq(parentChild.childId, link.childId),
            isNull(parentChild.unionId),
          ),
        )
        .returning({ childId: parentChild.childId });
      // Le lien a changé depuis la lecture : on annule tout plutôt qu'un graphe bancal.
      if (updated.length !== 1) {
        throw new AppError({
          message: 'La fiche a changé entre-temps : recharge la page et recommence.',
          code: 'FAMILY_CONFLICT',
          status: 409,
        });
      }
    }
  });
}

/** Identifiant d'un lieu, créé au besoin ; la clé est le libellé normalisé. */
async function ensurePlace(tx: Tx, label: string): Promise<string> {
  const normalizedLabel = normalizePlaceLabel(label);
  await tx
    .insert(places)
    .values({ id: crypto.randomUUID(), label, normalizedLabel })
    .onConflictDoNothing({ target: places.normalizedLabel });
  const [place] = await tx
    .select({ id: places.id })
    .from(places)
    .where(eq(places.normalizedLabel, normalizedLabel));
  if (!place) throw new Error(`Lieu introuvable après création : ${normalizedLabel}`);
  return place.id;
}

/**
 * Écrit un seul champ d'une fiche (modification sur place), dans une transaction qui
 * verrouille la fiche : deux modifications simultanées ne s'entremêlent pas.
 */
export async function updatePersonField(
  db: Db,
  person: Person,
  field: PersonEdit['field'],
): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: persons.id })
      .from(persons)
      .where(eq(persons.id, person.id))
      .for('update');
    if (!row) {
      throw new AppError({ message: 'Fiche introuvable', code: 'FAMILY_NOT_FOUND', status: 404 });
    }
    if (field === 'birth' || field === 'death') {
      const kind = field === 'birth' ? 'naissance' : 'deces';
      await tx.delete(events).where(and(eq(events.personId, person.id), eq(events.kind, kind)));
      const event = person[field];
      if (event) {
        const d = fuzzyDateToColumns(event.date);
        await tx.insert(events).values({
          personId: person.id,
          kind,
          datePrecision: d.precision,
          dateValue: d.value,
          dateValueEnd: d.valueEnd,
          placeId: event.place ? await ensurePlace(tx, event.place) : undefined,
        });
      }
    } else if (field === 'residence') {
      // La résidence en cours (sans fin) est corrigée ou retirée ; l'historique reste.
      const current = and(eq(residences.personId, person.id), isNull(residences.endPrecision));
      if (person.residence) {
        const placeId = await ensurePlace(tx, person.residence);
        const updated = await tx
          .update(residences)
          .set({ placeId })
          .where(current)
          .returning({ id: residences.id });
        if (updated.length === 0) {
          await tx.insert(residences).values({ personId: person.id, placeId });
        }
      } else {
        await tx.delete(residences).where(current);
      }
    } else {
      await tx
        .update(persons)
        .set({ [field]: person[field] ?? null, version: sql`${persons.version} + 1` }) // allow-null: colonne vidée en base
        .where(eq(persons.id, person.id));
    }
  });
}
