import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { exact } from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import {
  aNotionPage,
  marchandNotionPages,
  NOTION_IDS as N,
} from '../../../tests/fixtures/notion-pages';
import { testDb } from '../../../tests/integration/test-db';
import { events, media, parentChild, persons, places, residences, unions } from '../db/schema';
import { insertFamilyGraph, loadFamilyGraph } from '../family/family.repository';
import type { FamilyGraph } from '../family/family.types';
import { loadNotionGraph } from './notion.repository';
import { transformNotionExport } from './notion.transform';

const db = testDb();
const graphOf = (pages: unknown[] = marchandNotionPages()) =>
  transformNotionExport(pages, { today: exact(2026, 10, 12), photos: [] }).graph;

const sorted = (graph: FamilyGraph): FamilyGraph => ({
  persons: [...graph.persons].sort((a, b) => a.id.localeCompare(b.id)),
  unions: [...graph.unions].sort((a, b) => a.id.localeCompare(b.id)),
  parentChildren: [...graph.parentChildren].sort((a, b) =>
    `${a.parentId}>${a.childId}`.localeCompare(`${b.parentId}>${b.childId}`),
  ),
});

describe.skipIf(!db)('notion.repository (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;
  const snapshot = async () => ({
    persons: await client.select().from(persons).orderBy(persons.id),
    unions: await client.select().from(unions).orderBy(unions.id),
    links: await client
      .select()
      .from(parentChild)
      .orderBy(parentChild.parentId, parentChild.childId),
    events: await client.select().from(events).orderBy(events.id),
    places: await client.select().from(places).orderBy(places.id),
    residences: await client.select().from(residences).orderBy(residences.id),
  });

  beforeEach(async () => {
    await reset();
  });
  afterAll(async () => {
    await close();
  });

  it('charge le graphe repris, relisible à l’identique, avec l’identifiant Notion', async () => {
    const graph = graphOf();
    const result = await loadNotionGraph(client, graph);
    expect(sorted(await loadFamilyGraph(client))).toEqual(sorted(graph));
    const [luc] = await client.select().from(persons).where(eq(persons.id, N.luc));
    expect(luc?.legacyNotionId).toBe(N.luc);
    expect(result).toEqual({ persons: 8, unions: 4, parentChildren: 6, orphans: [] });
  });

  it('rejouer la reprise ne change rien', async () => {
    await loadNotionGraph(client, graphOf());
    const first = await snapshot();
    await loadNotionGraph(client, graphOf());
    const second = await snapshot();
    expect({ ...second, persons: second.persons.map(({ updatedAt: _, ...p }) => p) }).toEqual({
      ...first,
      persons: first.persons.map(({ updatedAt: _, ...p }) => p),
    });
  });

  it('suit les corrections faites dans Notion entre deux passages', async () => {
    await loadNotionGraph(client, graphOf());
    // Hugo est renommé, et son lien vers Sophie retiré des deux côtés.
    const corrected = marchandNotionPages().map((page) => {
      if (page.id === N.hugo) {
        return aNotionPage({
          id: N.hugo,
          firstName: 'Hugues',
          lastName: 'Marchand',
          gender: 'male',
          birthDate: '1995-11-26',
          parents: [N.luc],
        });
      }
      if (page.id === N.sophie) {
        return aNotionPage({
          id: N.sophie,
          firstName: 'Sophie',
          lastName: 'Marchand',
          partners: [N.luc],
        });
      }
      return page;
    });
    await loadNotionGraph(client, graphOf(corrected));
    const graph = await loadFamilyGraph(client);
    expect(graph.persons.find((p) => p.id === N.hugo)?.firstName).toBe('Hugues');
    expect(graph.parentChildren.filter((l) => l.childId === N.hugo).map((l) => l.parentId)).toEqual(
      [N.luc],
    );
    // Les dates de Sophie, retirées dans Notion, disparaissent aussi.
    expect(graph.persons.find((p) => p.id === N.sophie)?.birth).toBeUndefined();
  });

  it('rejouer la reprise garde la photo de profil posée depuis', async () => {
    await loadNotionGraph(client, graphOf());
    const [photo] = await client
      .insert(media)
      .values({
        kind: 'photo',
        pathname: 'persons/luc/x.jpg',
        sha256: 'x',
        mime: 'image/jpeg',
        bytes: 1,
      })
      .returning({ id: media.id });
    await client.update(persons).set({ photoMediaId: photo?.id }).where(eq(persons.id, N.luc));

    await loadNotionGraph(client, graphOf());
    const [luc] = await client.select().from(persons).where(eq(persons.id, N.luc));
    expect(luc?.photoMediaId).toBe(photo?.id);
  });

  it('signale sans la supprimer une fiche disparue de Notion', async () => {
    await loadNotionGraph(client, graphOf());
    const withoutClaire = marchandNotionPages().filter((p) => p.id !== N.claire);
    const result = await loadNotionGraph(client, graphOf(withoutClaire));
    expect(result.orphans).toEqual([N.claire]);
    expect(await client.select().from(persons).where(eq(persons.id, N.claire))).toHaveLength(1);
  });

  it('refuse une base qui contient des fiches étrangères à la reprise', async () => {
    await insertFamilyGraph(client, marchandFamily);
    await expect(loadNotionGraph(client, graphOf())).rejects.toThrow(/sans identifiant Notion/);
  });

  it('refuse d’écraser une fiche modifiée dans l’app depuis la reprise', async () => {
    await loadNotionGraph(client, graphOf());
    await client.update(persons).set({ version: 2 }).where(eq(persons.id, N.luc));
    await expect(loadNotionGraph(client, graphOf())).rejects.toThrow(/modifiée dans l’app/);
  });
});
