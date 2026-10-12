import { describe, expect, it } from 'vitest';
import { exact } from '../../../tests/fixtures/builders';
import {
  aNotionPage,
  marchandNotionPages,
  NOTION_IDS as N,
} from '../../../tests/fixtures/notion-pages';
import { familyGraphSchema } from '../family/family.types';
import { transformNotionExport } from './notion.transform';

const TODAY = exact(2026, 10, 12);
const run = (pages: unknown[] = marchandNotionPages(), photos = []) =>
  transformNotionExport(pages, { today: TODAY, photos });
const person = (id: string, result = run()) => result.graph.persons.find((p) => p.id === id);
const kinds = (result: ReturnType<typeof run>, personId?: string) =>
  result.anomalies
    .filter((a) => personId === undefined || a.personId === personId)
    .map((a) => a.kind);

describe('transformNotionExport : fiches', () => {
  it('reprend identité, nom de naissance, genre, naissance, et garde l’identifiant Notion', () => {
    expect(person(N.louise)).toMatchObject({
      id: N.louise,
      firstName: 'Louise',
      lastName: 'Marchand',
      birthName: 'Vidal',
      gender: 'femme',
      birth: { date: exact(1905, 4, 2), place: 'Millau' },
    });
  });

  it('reprend le décès daté', () => {
    expect(person(N.henri)?.death).toEqual({ date: exact(1979, 11, 12) });
  });

  it('présume décédée une personne née il y a plus de 110 ans, et le signale', () => {
    const result = run();
    expect(person(N.louise, result)?.death).toEqual({});
    expect(kinds(result, N.louise)).toContain('deces-presume');
  });

  it('signale une fiche sans naissance datée ni décès, considérée comme vivante', () => {
    const result = run([
      aNotionPage({ id: 'x', firstName: 'Alex', lastName: 'Roux', gender: 'male' }),
    ]);
    expect(person('x', result)?.death).toBeUndefined();
    expect(kinds(result, 'x')).toEqual(['vivant-sans-date']);
  });

  it('lit un 1er janvier comme l’année seule : Notion oblige à saisir un jour', () => {
    const result = run();
    expect(person(N.henri, result)?.birth?.date).toEqual({ precision: 'annee', year: 1902 });
    expect(result.stats.yearOnlyDates).toBe(1);
  });

  it('compose la résidence : ville, et pays hors de France', () => {
    expect(person(N.luc)?.residence).toBe('Toulouse');
    expect(person(N.claire)?.residence).toBe('Montréal, Canada');
    expect(person(N.hugo)?.residence).toBeUndefined();
  });

  it('reprend le surnom sur la fiche', () => {
    expect(person(N.luc)?.nickname).toBe('Lulu');
    expect(person(N.hugo)).not.toHaveProperty('nickname');
  });

  it('garde une fiche sans prénom, avec « ? », et la signale', () => {
    const pages = [
      ...marchandNotionPages(),
      aNotionPage({ id: 'vide', firstName: '', lastName: 'Khau' }),
    ];
    const result = run(pages);
    expect(person('vide', result)).toMatchObject({ firstName: '?', lastName: 'Khau' });
    expect(kinds(result, 'vide')).toContain('nom-inconnu');
  });

  it('lit « non renseigné » comme un nom inconnu, pas comme un prénom', () => {
    const result = run([
      aNotionPage({
        id: 'x',
        firstName: 'non renseigné',
        lastName: 'Non Renseigné',
        gender: 'male',
      }),
    ]);
    expect(person('x', result)).toMatchObject({ firstName: '?', lastName: '?' });
    expect(kinds(result, 'x')).toContain('nom-inconnu');
  });

  it('genre absent : inconnu, à vérifier', () => {
    const result = run([aNotionPage({ id: 'x', firstName: 'Alex', lastName: 'Roux' })]);
    expect(person('x', result)?.gender).toBe('inconnu');
    expect(kinds(result, 'x')).toContain('genre-inconnu');
  });

  it('repère un doublon probable : même nom et même année de naissance', () => {
    const pages = [
      aNotionPage({ id: 'a', firstName: 'Léa', lastName: 'Marchand', birthDate: '1992-07-03' }),
      aNotionPage({ id: 'b', firstName: 'Lea', lastName: 'MARCHAND', birthDate: '1992-01-01' }),
    ];
    expect(kinds(run(pages), 'b')).toContain('doublon-probable');
  });
});

describe('transformNotionExport : liens', () => {
  it('réunit les filiations déclarées d’un côté ou de l’autre', () => {
    const { graph, stats } = run();
    const parentsOfLuc = graph.parentChildren
      .filter((l) => l.childId === N.luc)
      .map((l) => l.parentId);
    expect(parentsOfLuc.sort()).toEqual([N.paul, N.jeanne].sort());
    // Jeanne ne liste pas Luc dans ses enfants : la relation n'est déclarée qu'une fois.
    expect(stats.oneSidedRelations).toBeGreaterThan(0);
  });

  it('crée une union par couple, et rattache l’enfant à l’union de ses deux parents', () => {
    const { graph } = run();
    const lucSophie = graph.unions.find(
      (u) => u.partnerIds.includes(N.luc) && u.partnerIds.includes(N.sophie),
    );
    expect(lucSophie).toBeDefined();
    expect(graph.unions.filter((u) => u.partnerIds.includes(N.luc))).toHaveLength(2);
    const hugoLinks = graph.parentChildren.filter((l) => l.childId === N.hugo);
    expect(hugoLinks.every((l) => l.unionId === lucSophie?.id)).toBe(true);
  });

  it('termine par un décès l’union dont un partenaire est mort', () => {
    const union = run().graph.unions.find((u) => u.partnerIds.includes(N.henri));
    expect(union?.end).toEqual({ reason: 'deces', date: exact(1979, 11, 12) });
  });

  it('signale plusieurs unions en cours : divorce ou séparation à préciser', () => {
    expect(kinds(run(), N.luc)).toContain('unions-multiples');
  });

  it('donne des identifiants stables, quel que soit l’ordre des pages', () => {
    const ids = (pages: unknown[]) =>
      run(pages)
        .graph.unions.map((u) => u.id)
        .sort();
    expect(ids([...marchandNotionPages()].reverse())).toEqual(ids(marchandNotionPages()));
  });

  it('ignore une relation vers une page absente, à corriger', () => {
    const pages = [
      aNotionPage({ id: 'x', firstName: 'Alex', lastName: 'Roux', parents: ['fantome'] }),
    ];
    const result = run(pages);
    expect(result.graph.parentChildren).toEqual([]);
    expect(result.anomalies).toContainEqual(
      expect.objectContaining({
        kind: 'relation-introuvable',
        personId: 'x',
        severity: 'a-corriger',
      }),
    );
  });

  it('refuse un lien qui ferait un cycle, sans arrêter la reprise', () => {
    const pages = [
      aNotionPage({ id: 'a', firstName: 'Alex', lastName: 'Roux', children: ['b'] }),
      aNotionPage({ id: 'b', firstName: 'Bea', lastName: 'Roux', children: ['a'] }),
    ];
    const result = run(pages);
    expect(result.graph.parentChildren).toHaveLength(1);
    expect(kinds(result)).toContain('lien-refuse');
  });

  it('refuse un enfant né avant son parent', () => {
    const pages = [
      aNotionPage({
        id: 'p',
        firstName: 'Alex',
        lastName: 'Roux',
        birthDate: '1990-01-02',
        children: ['c'],
      }),
      aNotionPage({ id: 'c', firstName: 'Bea', lastName: 'Roux', birthDate: '1950-01-02' }),
    ];
    const result = run(pages);
    expect(result.graph.parentChildren).toEqual([]);
    expect(result.anomalies.find((a) => a.kind === 'lien-refuse')?.message).toMatch(
      /serait né avant son parent/,
    );
  });
});

describe('transformNotionExport : sortie', () => {
  it('produit un graphe valide pour le schéma du domaine', () => {
    expect(() => familyGraphSchema.parse(run().graph)).not.toThrow();
  });

  it('liste les photos en échec avec un lien vers la fiche Notion', () => {
    const result = transformNotionExport(marchandNotionPages(), {
      today: TODAY,
      photos: [{ pageId: N.luc, name: 'luc.jpg', ok: false, error: 'HTTP 403' }],
    });
    expect(result.anomalies).toContainEqual(
      expect.objectContaining({
        kind: 'photo-en-echec',
        personId: N.luc,
        notionUrl: `https://www.notion.so/${N.luc.replaceAll('-', '')}`,
      }),
    );
  });

  it('compte ce qui est repris', () => {
    expect(run().stats).toMatchObject({ pages: 8, persons: 8, unions: 4 });
  });
});
