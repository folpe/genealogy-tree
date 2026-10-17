import type { DisplayedGraph } from '../../server/family/family.display';
import { foldGraph, hideKey, originKey } from './tree.fold';

// Lignées directes dépliées, collatéraux repliés (retour de Folpe, 2026-10-17). La
// lignée : la personne au centre, son ou ses conjoints, et tous leurs ascendants. Par
// défaut, chaque fratrie de la lignée se replie (frères et sœurs, oncles et tantes, à
// chaque génération, avec leurs familles), comme la famille d'origine d'un conjoint
// venu d'ailleurs. Chaque fratrie repliée laisse un repère ; chaque collatéral se
// replie et se redéplie un par un.

export type Kin = {
  /** Départs de branche (union ou parent seul) d'où descend chaque personne. */
  sourcesOf: Map<string, string[]>;
  /** Enfants de chaque départ de branche, dans l'ordre de naissance. */
  childrenOf: Map<string, string[]>;
  parentsOf: Map<string, string[]>;
  /** Enfants de chaque personne, toutes unions confondues. */
  kidsOf: Map<string, string[]>;
  partnersOf: Map<string, string[]>;
};

export function kinOf(drawn: DisplayedGraph): Kin {
  const kin: Kin = {
    sourcesOf: new Map(),
    childrenOf: new Map(),
    parentsOf: new Map(),
    kidsOf: new Map(),
    partnersOf: new Map(),
  };
  const push = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key) ?? [];
    if (!list.includes(value)) map.set(key, [...list, value]);
  };
  const owners = new Map(
    drawn.unions.map((u) => [u.id, u.partnerIds.filter((p) => typeof p === 'string')]),
  );
  for (const [, partners] of owners) {
    for (const a of partners) for (const b of partners) if (a !== b) push(kin.partnersOf, a, b);
  }
  for (const edge of drawn.edges) {
    if (edge.kind !== 'child' && edge.kind !== 'parent') continue;
    push(kin.sourcesOf, edge.to, edge.from);
    push(kin.childrenOf, edge.from, edge.to);
    for (const parent of edge.kind === 'child' ? (owners.get(edge.from) ?? []) : [edge.from]) {
      push(kin.parentsOf, edge.to, parent);
      push(kin.kidsOf, parent, edge.to);
    }
  }
  return kin;
}

const climb = (kin: Kin, starts: string[]): Set<string> => {
  const seen = new Set(starts);
  for (const pending = [...starts]; pending.length > 0; ) {
    for (const parent of kin.parentsOf.get(pending.pop() ?? '') ?? []) {
      if (!seen.has(parent)) {
        seen.add(parent);
        pending.push(parent);
      }
    }
  }
  return seen;
};

export const descend = (kin: Kin, starts: Iterable<string>): Set<string> => {
  const seen = new Set(starts);
  for (const pending = [...seen]; pending.length > 0; ) {
    for (const child of kin.kidsOf.get(pending.pop() ?? '') ?? []) {
      if (!seen.has(child)) {
        seen.add(child);
        pending.push(child);
      }
    }
  }
  return seen;
};

/** La personne au centre, ses conjoints dessinés et tous leurs ascendants. */
export function lineageOf(drawn: DisplayedGraph, focusId: string): Set<string> {
  if (!drawn.personIds.includes(focusId)) return new Set();
  const kin = kinOf(drawn);
  return climb(kin, [focusId, ...(kin.partnersOf.get(focusId) ?? [])]);
}

/** Frères et sœurs, demi-frères et demi-sœurs compris : les autres enfants de ses parents. */
export function siblingsOf(kin: Kin, person: string): string[] {
  const kids = (kin.parentsOf.get(person) ?? []).flatMap((p) => kin.kidsOf.get(p) ?? []);
  return [...new Set(kids)].filter((child) => child !== person);
}

/** Plis de départ : chaque fratrie de la lignée, et la famille de chaque conjoint venu d'ailleurs. */
export function defaultFolds(drawn: DisplayedGraph, focusId: string): string[] {
  const lineage = lineageOf(drawn, focusId);
  if (lineage.size === 0) return [];
  const kin = kinOf(drawn);
  const blood = descend(kin, lineage);
  const siblings = [...lineage].flatMap((person) =>
    siblingsOf(kin, person).filter((s) => !lineage.has(s)),
  );
  const inLaws = [...blood].flatMap((person) =>
    (kin.partnersOf.get(person) ?? []).filter(
      (partner) => !blood.has(partner) && (kin.parentsOf.get(partner) ?? []).length > 0,
    ),
  );
  return [...new Set([...siblings.map(hideKey), ...inLaws.map(originKey)])];
}

/** Repères des fratries repliées : par départ de branche affiché, les enfants masqués. */
export function hiddenSiblings(
  drawn: DisplayedGraph,
  folded: ReadonlySet<string>,
  focusId: string | undefined,
): Map<string, string[]> {
  const shown = foldGraph(drawn, folded, focusId);
  const persons = new Set(shown.personIds);
  const unions = new Set(shown.unions.map((u) => u.id));
  const result = new Map<string, string[]>();
  for (const [source, children] of kinOf(drawn).childrenOf) {
    if (!unions.has(source) && !persons.has(source)) continue;
    const hidden = children.filter((child) => folded.has(hideKey(child)) && !persons.has(child));
    if (hidden.length > 0) result.set(source, hidden);
  }
  return result;
}

export type FoldAction = {
  label: string;
  keys: string[];
  fold: boolean;
  /** Bulle qui reste en place à l'écran, quand ce n'est pas celle du menu (qui part). */
  anchorId?: string;
};

/** Ce que le menu d'une bulle propose de replier ou d'afficher autour d'elle. */
export function foldActions(
  drawn: DisplayedGraph,
  folded: ReadonlySet<string>,
  focusId: string,
  person: string,
): FoldAction[] {
  const kin = kinOf(drawn);
  const lineage = lineageOf(drawn, focusId);
  const hasParents = (kin.parentsOf.get(person) ?? []).length > 0;
  const family = (): FoldAction[] => {
    if (!hasParents) return [];
    const key = originKey(person);
    return folded.has(key)
      ? [{ label: 'Afficher sa famille', keys: [key], fold: false }]
      : [{ label: 'Masquer sa famille', keys: [key], fold: true }];
  };
  if (!lineage.has(person)) {
    if (!descend(kin, lineage).has(person)) return family();
    const [parent] = kin.parentsOf.get(person) ?? [];
    return parent
      ? [{ label: 'Masquer cette branche', keys: [hideKey(person)], fold: true, anchorId: parent }]
      : [];
  }
  const siblings = folded.has(originKey(person))
    ? []
    : siblingsOf(kin, person).filter((s) => !lineage.has(s));
  const hidden = siblings.filter((s) => folded.has(hideKey(s)));
  const shown = siblings.filter((s) => !folded.has(hideKey(s)));
  return [
    ...family(),
    ...(hidden.length > 0
      ? [{ label: 'Afficher ses frères et sœurs', keys: hidden.map(hideKey), fold: false }]
      : []),
    ...(shown.length > 0
      ? [{ label: 'Masquer ses frères et sœurs', keys: shown.map(hideKey), fold: true }]
      : []),
  ];
}

/**
 * Les plis à lever pour que ces personnes s'affichent : le chemin de « Notre lien », une
 * personne cherchée. Chaque pli qui en cache une, à lui seul, est levé.
 */
export function revealing(
  drawn: DisplayedGraph,
  folded: ReadonlySet<string>,
  focusId: string | undefined,
  persons: string[],
): string[] {
  const wanted = persons.filter((id) => drawn.personIds.includes(id));
  const shown = new Set(foldGraph(drawn, folded, focusId).personIds);
  if (wanted.every((id) => shown.has(id))) return [];
  return [...folded].filter((key) => {
    const alone = new Set(foldGraph(drawn, new Set([key]), focusId).personIds);
    return wanted.some((id) => !alone.has(id));
  });
}
