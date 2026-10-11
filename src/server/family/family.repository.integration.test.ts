import { sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { events, parentChild, persons, unions } from '../db/schema';
import { insertFamilyGraph, loadFamilyGraph } from './family.repository';
import type { FamilyGraph } from './family.types';

// Contre une vraie base : Postgres de service en CI, Postgres local ou branche Neon `dev`.
// Ignoré sans DATABASE_URL.
const db = testDb();

const byId = <T extends { id: string }>(items: T[]) =>
  [...items].sort((a, b) => a.id.localeCompare(b.id));
const sorted = (graph: FamilyGraph): FamilyGraph => ({
  persons: byId(graph.persons),
  unions: byId(graph.unions),
  parentChildren: [...graph.parentChildren].sort((a, b) =>
    `${a.parentId}>${a.childId}`.localeCompare(`${b.parentId}>${b.childId}`),
  ),
});

/** Le message de l'erreur Postgres, sous l'enveloppe de Drizzle. */
async function pgError(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
    return cause instanceof Error ? cause.message : String(cause);
  }
  throw new Error('La base a accepté une écriture qu’elle devait refuser');
}

describe.skipIf(!db)('family.repository (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;

  beforeEach(async () => {
    await reset();
  });
  afterAll(async () => {
    await close();
  });

  it('relit la famille Marchand à l’identique', async () => {
    await insertFamilyGraph(client, marchandFamily);
    expect(sorted(await loadFamilyGraph(client))).toEqual(sorted(marchandFamily));
  });

  it('une insertion de graphe est atomique', async () => {
    const broken: FamilyGraph = {
      ...marchandFamily,
      parentChildren: [
        ...marchandFamily.parentChildren,
        { parentId: 'hugo', childId: 'personne', kind: 'biologique' },
      ],
    };
    await expect(insertFamilyGraph(client, broken)).rejects.toThrow();
    expect((await loadFamilyGraph(client)).persons).toHaveLength(0);
  });

  describe('contraintes en base, même si le service est contourné', () => {
    beforeEach(async () => {
      await insertFamilyGraph(client, marchandFamily);
    });

    it('pas de filiation de soi à soi', async () => {
      const message = await pgError(
        client.insert(parentChild).values({ parentId: 'hugo', childId: 'hugo' }),
      );
      expect(message).toContain('parent_child_distinct');
    });

    it('pas d’union avec soi-même', async () => {
      const message = await pgError(
        client.insert(unions).values({ partnerAId: 'hugo', partnerBId: 'hugo' }),
      );
      expect(message).toContain('unions_distinct_partners');
    });

    it('pas de seconde naissance pour une même personne', async () => {
      const message = await pgError(
        client.insert(events).values({ personId: 'hugo', kind: 'naissance' }),
      );
      expect(message).toContain('events_one_birth');
    });

    it('pas d’intervalle dont la fin précède le début', async () => {
      const message = await pgError(
        client.insert(events).values({
          personId: 'hugo',
          kind: 'bapteme',
          datePrecision: 'entre',
          dateValue: '1990-01-01',
          dateValueEnd: '1980-01-01',
        }),
      );
      expect(message).toContain('events_date_order');
    });

    it('pas de date à moitié renseignée', async () => {
      const message = await pgError(
        client.insert(events).values({
          personId: 'hugo',
          kind: 'bapteme',
          datePrecision: 'annee',
        }),
      );
      expect(message).toContain('events_date_complete');
    });

    it('pas de fin d’union sans motif', async () => {
      const message = await pgError(
        client.insert(unions).values({
          partnerAId: 'hugo',
          partnerBId: 'lea',
          endPrecision: 'annee',
          endValue: '2000-01-01',
        }),
      );
      expect(message).toContain('unions_end_needs_reason');
    });

    it('pas de filiation vers une personne inconnue', async () => {
      const message = await pgError(
        client.insert(parentChild).values({ parentId: 'hugo', childId: 'inconnu' }),
      );
      expect(message).toContain('parent_child_child_id_persons_id_fk');
    });

    it('supprimer une personne retire ses liens, pas les autres fiches', async () => {
      await client.delete(persons).where(sql`${persons.id} = 'claude'`);
      const graph = await loadFamilyGraph(client);
      expect(graph.persons).toHaveLength(marchandFamily.persons.length - 1);
      expect(graph.parentChildren.some((pc) => pc.childId === 'claude')).toBe(false);
    });
  });
});
