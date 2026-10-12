// tdd-cover: e2e src/server/migration/notion.repository.integration.test.ts
import {
  and,
  getTableColumns,
  gt,
  inArray,
  isNotNull,
  isNull,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { events, parentChild, persons, places, residences, unions } from '../db/schema';
import type { Db } from '../db/types';
import { graphToRows } from '../family/family.mapper';
import type { FamilyGraph } from '../family/family.types';
import { stableId } from './notion.transform';

// Chargement de la reprise Notion, rejouable : chaque ligne a un identifiant
// déterministe, on met à jour ce qui existe et on retire ce que Notion ne déclare
// plus, mais seulement autour des fiches issues de Notion. Une fiche disparue de
// Notion n'est jamais supprimée : elle est signalée.

export type NotionLoadResult = {
  persons: number;
  unions: number;
  parentChildren: number;
  /** Fiches issues de Notion qui n'y figurent plus. */
  orphans: string[];
};

/** `SET col = excluded.col` pour toutes les colonnes sauf la clé et les horodatages. */
function excludedSet(table: PgTable, keep: string[]) {
  const columns: Record<string, PgColumn> = getTableColumns(table);
  return Object.fromEntries(
    Object.entries(columns)
      .filter(([key]) => !keep.includes(key))
      .map(([key, column]) => [key, sql.raw(`excluded.${column.name}`)]),
  );
}

async function assertMigrationTarget(db: Db) {
  const [foreign] = await db
    .select({ id: persons.id })
    .from(persons)
    .where(isNull(persons.legacyNotionId))
    .limit(1);
  if (foreign) {
    throw new Error(
      'La base contient des fiches sans identifiant Notion (données de test ou saisies dans ' +
        'l’app) : la reprise refuse de s’y mêler.',
    );
  }
  const [edited] = await db
    .select({ id: persons.id })
    .from(persons)
    .where(and(isNotNull(persons.legacyNotionId), gt(persons.version, 1)))
    .limit(1);
  if (edited) {
    throw new Error(`La fiche ${edited.id} a été modifiée dans l’app depuis la reprise : arrêt.`);
  }
}

export async function loadNotionGraph(db: Db, graph: FamilyGraph): Promise<NotionLoadResult> {
  const rows = graphToRows(graph, {
    place: (key) => stableId('place', key),
    event: (personId, kind) => stableId('event', personId, kind),
    residence: (personId) => stableId('residence', personId),
  });
  const personIds = rows.persons.map((p) => p.id);

  return db.transaction(async (tx) => {
    await assertMigrationTarget(tx);
    const migrated = (
      await tx.select({ id: persons.id }).from(persons).where(isNotNull(persons.legacyNotionId))
    ).map((p) => p.id);
    const scope = [...new Set([...migrated, ...personIds])];

    if (rows.places.length) {
      await tx
        .insert(places)
        .values(rows.places)
        .onConflictDoUpdate({
          target: places.id,
          set: { label: sql.raw('excluded.label') },
        });
    }
    await tx
      .insert(persons)
      .values(rows.persons.map((p) => ({ ...p, legacyNotionId: p.id })))
      .onConflictDoUpdate({
        target: persons.id,
        set: excludedSet(persons, ['id', 'createdAt', 'updatedAt', 'version']),
      });
    if (rows.unions.length) {
      await tx
        .insert(unions)
        .values(rows.unions)
        .onConflictDoUpdate({ target: unions.id, set: excludedSet(unions, ['id', 'createdAt']) });
    }
    if (rows.parentChildren.length) {
      await tx
        .insert(parentChild)
        .values(rows.parentChildren)
        .onConflictDoUpdate({
          target: [parentChild.parentId, parentChild.childId],
          set: excludedSet(parentChild, ['parentId', 'childId']),
        });
    }
    if (rows.events.length) {
      await tx
        .insert(events)
        .values(rows.events)
        .onConflictDoUpdate({ target: events.id, set: excludedSet(events, ['id', 'createdAt']) });
    }
    if (rows.residences.length) {
      await tx
        .insert(residences)
        .values(rows.residences)
        .onConflictDoUpdate({ target: residences.id, set: excludedSet(residences, ['id']) });
    }

    // Ce que Notion ne déclare plus, autour des fiches qu'il a fournies.
    const keptLinks = rows.parentChildren.map((l) => `${l.parentId}>${l.childId}`);
    await tx
      .delete(parentChild)
      .where(
        and(
          or(inArray(parentChild.parentId, scope), inArray(parentChild.childId, scope)),
          keptLinks.length
            ? notInArray(sql`${parentChild.parentId} || '>' || ${parentChild.childId}`, keptLinks)
            : undefined,
        ),
      );
    const keptUnions = rows.unions.map((u) => u.id);
    await tx
      .delete(unions)
      .where(
        and(
          or(inArray(unions.partnerAId, scope), inArray(unions.partnerBId, scope)),
          keptUnions.length ? notInArray(unions.id, keptUnions) : undefined,
        ),
      );
    const keptEvents = rows.events.map((e) => e.id);
    await tx
      .delete(events)
      .where(
        and(
          inArray(events.personId, scope),
          keptEvents.length ? notInArray(events.id, keptEvents) : undefined,
        ),
      );
    const keptResidences = rows.residences.map((r) => r.id);
    await tx
      .delete(residences)
      .where(
        and(
          inArray(residences.personId, scope),
          keptResidences.length ? notInArray(residences.id, keptResidences) : undefined,
        ),
      );

    const current = new Set(personIds);
    return {
      persons: rows.persons.length,
      unions: rows.unions.length,
      parentChildren: rows.parentChildren.length,
      orphans: migrated.filter((id) => !current.has(id)).sort(),
    };
  });
}
