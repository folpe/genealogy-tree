import { createHash } from 'node:crypto';
import { buildFamilyIndex } from '../family/family.helper';
import { assertCanAddParentChild, assertCanAddUnion } from '../family/family.invariants';
import type { FamilyGraph, FuzzyDate, ParentChild, Person, Union } from '../family/family.types';
import { fuzzyDateSchema } from '../family/family.types';
import { compareFuzzyDates } from '../family/fuzzy-date.helper';
import { type NotionPage, notionPageSchema, plainText } from './notion.schema';

// Reprise de l'ancienne base Notion (spec section 15.1, plan phase 3 lot 8).
// Fonction pure : elle lit l'export brut et produit le graphe du domaine. Un
// défaut de saisie n'arrête jamais la reprise : il devient une anomalie du
// rapport, relu avec Folpe, et la donnée fautive est écartée.

type AnomalyKind =
  | 'fiche-incomplete'
  | 'date-impossible'
  | 'nom-inconnu'
  | 'deces-presume'
  | 'vivant-sans-date'
  | 'genre-inconnu'
  | 'doublon-probable'
  | 'relation-introuvable'
  | 'lien-refuse'
  | 'unions-multiples'
  | 'photo-en-echec';

export type MigrationAnomaly = {
  kind: AnomalyKind;
  /** `a-corriger` : donnée écartée ; `a-verifier` : reprise, mais douteuse. */
  severity: 'a-corriger' | 'a-verifier';
  personId?: string;
  notionUrl?: string;
  message: string;
};

export type PhotoOutcome = { pageId: string; name: string; ok: boolean; error?: string };

export type NotionTransform = {
  graph: FamilyGraph;
  anomalies: MigrationAnomaly[];
  nicknames: { personId: string; nickname: string }[];
  stats: {
    pages: number;
    persons: number;
    unions: number;
    parentChildren: number;
    /** Liens déclarés d'un seul côté dans Notion (repris quand même). */
    oneSidedRelations: number;
    /** Dates au 1er janvier, lues comme l'année seule. */
    yearOnlyDates: number;
    photos: number;
    photoFailures: number;
  };
};

/** Au-delà, une personne sans date de décès est présumée décédée. */
const PRESUMED_DEAD_AFTER_YEARS = 110;

const GENDERS: Record<string, Person['gender']> = { male: 'homme', female: 'femme' };

/** Identifiant déterministe (forme UUID) : une reprise rejouée retrouve les mêmes lignes. */
export function stableId(...parts: string[]): string {
  const h = createHash('sha256').update(parts.join('|')).digest('hex');
  return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20, 32)].join(
    '-',
  );
}

const normalized = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const yearOf = (date: FuzzyDate) => (date.precision === 'entre' ? date.from : date.year);
const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

type Context = { anomalies: MigrationAnomaly[]; urls: Map<string, string>; yearOnlyDates: number };

function report(
  ctx: Context,
  kind: AnomalyKind,
  severity: MigrationAnomaly['severity'],
  personId: string | undefined,
  message: string,
) {
  const notionUrl = personId === undefined ? undefined : ctx.urls.get(personId);
  ctx.anomalies.push({
    kind,
    severity,
    message,
    ...(personId === undefined ? {} : { personId }),
    ...(notionUrl === undefined ? {} : { notionUrl }),
  });
}

function parseDate(
  ctx: Context,
  page: NotionPage,
  label: string,
  start: string | undefined,
): FuzzyDate | undefined {
  if (!start) return undefined;
  const [year, month, day] = start.slice(0, 10).split('-').map(Number);
  const parsed = fuzzyDateSchema.safeParse({ precision: 'exacte', year, month, day });
  if (!parsed.success) {
    report(ctx, 'date-impossible', 'a-corriger', page.id, `${label} illisible : « ${start} »`);
    return undefined;
  }
  // Notion impose un jour : un 1er janvier y est saisi quand seule l'année est
  // connue (règle donnée par Folpe le 2026-10-12).
  if (parsed.data.precision === 'exacte' && parsed.data.month === 1 && parsed.data.day === 1) {
    ctx.yearOnlyDates += 1;
    return { precision: 'annee', year: parsed.data.year };
  }
  return parsed.data;
}

function residenceOf(page: NotionPage): string | undefined {
  const city = plainText(page.properties.city);
  if (!city) return undefined;
  const country = plainText(page.properties.country);
  return country && normalized(country) !== 'france' ? `${city}, ${country}` : city;
}

function lifeEvent(date: FuzzyDate | undefined, place: string) {
  if (!date && !place) return undefined;
  return { ...(date ? { date } : {}), ...(place ? { place } : {}) };
}

/** Nom inconnu : convention des logiciels de généalogie, plutôt qu'une fiche perdue. */
const UNKNOWN_NAME = '?';
const PLACEHOLDERS = new Set(['', 'non renseigne', 'inconnu', 'inconnue', '?']);
const knownName = (value: string) => (PLACEHOLDERS.has(normalized(value)) ? UNKNOWN_NAME : value);

function toPerson(ctx: Context, page: NotionPage, today: FuzzyDate): Person | undefined {
  const p = page.properties;
  const firstName = knownName(plainText(p.firstName));
  const lastName = knownName(plainText(p.lastName));
  const label = `${firstName} ${lastName}`;
  if (firstName === UNKNOWN_NAME || lastName === UNKNOWN_NAME) {
    report(
      ctx,
      'nom-inconnu',
      'a-verifier',
      page.id,
      `${label} : prénom ou nom inconnu, gardé avec « ? »`,
    );
  }
  const gender = GENDERS[p.gender?.select?.name ?? ''];
  if (!gender)
    report(ctx, 'genre-inconnu', 'a-verifier', page.id, `Genre non renseigné : ${label}`);

  const birthDate = parseDate(ctx, page, `Naissance de ${label}`, p.birthDate?.date?.start);
  const deathDate = parseDate(ctx, page, `Décès de ${label}`, p.deathDate?.date?.start);
  const presumedDead =
    deathDate === undefined &&
    birthDate !== undefined &&
    yearOf(today) - yearOf(birthDate) > PRESUMED_DEAD_AFTER_YEARS;
  if (presumedDead) {
    report(
      ctx,
      'deces-presume',
      'a-verifier',
      page.id,
      `${label}, né(e) en ${yearOf(birthDate)}, sans date de décès : présumé(e) décédé(e)`,
    );
  }
  if (birthDate === undefined && deathDate === undefined) {
    report(
      ctx,
      'vivant-sans-date',
      'a-verifier',
      page.id,
      `${label} n’a ni date de naissance ni décès : considéré(e) comme vivant(e), donc protégé(e)`,
    );
  }
  const birth = lifeEvent(birthDate, plainText(p.birthLocation));
  const birthName = plainText(p.maidenName);
  const residence = residenceOf(page);

  return {
    id: page.id,
    firstName,
    lastName,
    ...(birthName ? { birthName } : {}),
    gender: gender ?? 'inconnu',
    ...(birth ? { birth } : {}),
    ...(deathDate ? { death: { date: deathDate } } : presumedDead ? { death: {} } : {}),
    ...(residence ? { residence } : {}),
    visibility: 'famille',
    sourcedFields: [],
  };
}

function flagDuplicates(ctx: Context, persons: Person[]) {
  const seen = new Map<string, Person>();
  for (const person of persons) {
    const year = person.birth?.date ? yearOf(person.birth.date) : '?';
    const key = `${normalized(person.firstName)}|${normalized(person.lastName)}|${year}`;
    const first = seen.get(key);
    if (first) {
      report(
        ctx,
        'doublon-probable',
        'a-verifier',
        person.id,
        `${person.firstName} ${person.lastName} ressemble à une autre fiche (${first.firstName} ` +
          `${first.lastName}, même année de naissance)`,
      );
    } else {
      seen.set(key, person);
    }
  }
}

/** Lien déclaré dans Notion, et de combien de côtés (1 ou 2). */
type Declared = { from: string; to: string; sides: number };
type Pairs = { filiations: Map<string, Declared>; couples: Map<string, Declared> };

function addDeclared(map: Map<string, Declared>, key: string, from: string, to: string) {
  const known = map.get(key);
  if (known) known.sides += 1;
  else map.set(key, { from, to, sides: 1 });
}

/** Filiations (`from` parent, `to` enfant) et couples, d'un côté ou des deux. */
function collectPairs(ctx: Context, pages: NotionPage[], known: Set<string>): Pairs {
  const pairs: Pairs = { filiations: new Map(), couples: new Map() };
  for (const page of pages) {
    if (!known.has(page.id)) continue;
    const p = page.properties;
    const declared = [
      ...(p.parentsIds?.relation ?? []).map((r) => ({ other: r.id, role: 'parent' as const })),
      ...(p.childrenIds?.relation ?? []).map((r) => ({ other: r.id, role: 'child' as const })),
      ...(p.partnerId?.relation ?? []).map((r) => ({ other: r.id, role: 'partner' as const })),
    ];
    for (const { other, role } of declared) {
      if (!known.has(other) || other === page.id) {
        report(
          ctx,
          'relation-introuvable',
          'a-corriger',
          page.id,
          other === page.id
            ? 'Fiche liée à elle-même : lien ignoré'
            : `Lien vers une fiche absente ou écartée (${other}) : lien ignoré`,
        );
        continue;
      }
      if (role === 'parent') addDeclared(pairs.filiations, `${other}>${page.id}`, other, page.id);
      else if (role === 'child')
        addDeclared(pairs.filiations, `${page.id}>${other}`, page.id, other);
      else {
        const [a, b] = page.id < other ? [page.id, other] : [other, page.id];
        addDeclared(pairs.couples, `${a}~${b}`, a, b);
      }
    }
  }
  return pairs;
}

/** Une union dont un partenaire est mort a pris fin à son premier décès connu. */
function unionEnd(persons: Map<string, Person>, a: string, b: string): Union['end'] {
  const deaths = [persons.get(a)?.death, persons.get(b)?.death].filter((d) => d !== undefined);
  if (deaths.length === 0) return undefined;
  const [first] = deaths.flatMap((d) => (d.date ? [d.date] : [])).sort(compareFuzzyDates);
  return { reason: 'deces', ...(first ? { date: first } : {}) };
}

const sortedByKey = (map: Map<string, Declared>) =>
  [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);

function buildUnions(ctx: Context, graph: FamilyGraph, couples: Map<string, Declared>) {
  const persons = new Map(graph.persons.map((p) => [p.id, p]));
  for (const { from: a, to: b } of sortedByKey(couples)) {
    const end = unionEnd(persons, a, b);
    const union: Union = {
      id: stableId('union', a, b),
      partnerIds: [a, b],
      kind: 'inconnu',
      ...(end ? { end } : {}),
    };
    try {
      assertCanAddUnion(buildFamilyIndex(graph), union);
      graph.unions.push(union);
    } catch (error) {
      report(ctx, 'lien-refuse', 'a-corriger', a, messageOf(error));
    }
  }
  for (const person of graph.persons) {
    const ongoing = graph.unions.filter((u) => u.partnerIds.includes(person.id) && !u.end);
    if (ongoing.length > 1) {
      report(
        ctx,
        'unions-multiples',
        'a-verifier',
        person.id,
        `${person.firstName} ${person.lastName} a ${ongoing.length} unions sans fin connue : ` +
          'préciser les divorces ou séparations',
      );
    }
  }
}

function buildFiliations(ctx: Context, graph: FamilyGraph, filiations: Map<string, Declared>) {
  const parentsByChild = new Map<string, string[]>();
  for (const { from, to } of filiations.values()) {
    parentsByChild.set(to, [...(parentsByChild.get(to) ?? []), from]);
  }
  for (const { from: parentId, to: childId } of sortedByKey(filiations)) {
    const parents = parentsByChild.get(childId) ?? [];
    const union =
      parents.length === 2
        ? graph.unions.find((u) => parents.every((id) => u.partnerIds.includes(id)))
        : undefined;
    const link: ParentChild = {
      parentId,
      childId,
      kind: 'biologique',
      ...(union ? { unionId: union.id } : {}),
    };
    try {
      assertCanAddParentChild(buildFamilyIndex(graph), link);
      graph.parentChildren.push(link);
    } catch (error) {
      report(ctx, 'lien-refuse', 'a-corriger', childId, messageOf(error));
    }
  }
}

function readPages(ctx: Context, rawPages: unknown[]): NotionPage[] {
  return rawPages.flatMap((raw) => {
    const parsed = notionPageSchema.safeParse(raw);
    if (!parsed.success) {
      report(ctx, 'fiche-incomplete', 'a-corriger', undefined, 'Page Notion illisible : écartée');
      return [];
    }
    ctx.urls.set(parsed.data.id, parsed.data.url);
    return [parsed.data];
  });
}

export function transformNotionExport(
  rawPages: unknown[],
  options: { today: FuzzyDate; photos: PhotoOutcome[] },
): NotionTransform {
  const ctx: Context = { anomalies: [], urls: new Map(), yearOnlyDates: 0 };
  const pages = readPages(ctx, rawPages);

  const graph: FamilyGraph = { persons: [], unions: [], parentChildren: [] };
  const nicknames: NotionTransform['nicknames'] = [];
  for (const page of pages) {
    const person = toPerson(ctx, page, options.today);
    if (!person) continue;
    graph.persons.push(person);
    const nickname = plainText(page.properties.nickName);
    if (nickname) nicknames.push({ personId: page.id, nickname });
  }
  flagDuplicates(ctx, graph.persons);

  const { filiations, couples } = collectPairs(ctx, pages, new Set(graph.persons.map((p) => p.id)));
  buildUnions(ctx, graph, couples);
  buildFiliations(ctx, graph, filiations);

  const failed = options.photos.filter((p) => !p.ok);
  for (const photo of failed) {
    report(
      ctx,
      'photo-en-echec',
      'a-corriger',
      photo.pageId,
      `Photo « ${photo.name} » non récupérée${photo.error ? ` (${photo.error})` : ''}`,
    );
  }

  const pairs = [...filiations.values(), ...couples.values()];
  return {
    graph,
    anomalies: ctx.anomalies,
    nicknames,
    stats: {
      pages: rawPages.length,
      persons: graph.persons.length,
      unions: graph.unions.length,
      parentChildren: graph.parentChildren.length,
      oneSidedRelations: pairs.filter((pair) => pair.sides === 1).length,
      yearOnlyDates: ctx.yearOnlyDates,
      photos: options.photos.length - failed.length,
      photoFailures: failed.length,
    },
  };
}
