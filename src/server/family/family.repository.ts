// tdd-cover: e2e src/server/family/family.repository.integration.test.ts
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
import { graphToRows, rowsToGraph } from './family.mapper';
import type { FamilyGraph } from './family.types';

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
