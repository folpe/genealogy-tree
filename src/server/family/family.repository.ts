// tdd-cover: e2e src/server/family/family.repository.integration.test.ts

import { and, eq, inArray, isNull, ne } from 'drizzle-orm';
import {
  events,
  parentChild,
  persons,
  places,
  residences,
  sourcedFacts,
  unions,
} from '../db/schema';
import type { Db } from '../db/types';
import { ParentsFullError } from './family.errors';
import { graphToRows, rowsToGraph } from './family.mapper';
import type { FamilyGraph } from './family.types';
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
  return rowsToGraph({
    persons: p,
    events: e,
    places: pl,
    residences: r,
    unions: u,
    parentChildren: pc,
    sourcedFacts: sf,
  });
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
    await tx
      .select({ id: persons.id })
      .from(persons)
      .where(eq(persons.id, guard.anchorId))
      .for('update');
    if (guard.maxParents !== undefined) {
      const parents = await tx
        .select({ id: parentChild.parentId })
        .from(parentChild)
        .where(and(eq(parentChild.childId, guard.anchorId), ne(parentChild.kind, 'a_eleve')));
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
      await tx
        .update(parentChild)
        .set({ unionId: link.unionId })
        .where(
          and(
            eq(parentChild.parentId, link.parentId),
            eq(parentChild.childId, link.childId),
            isNull(parentChild.unionId),
          ),
        );
    }
  });
}
