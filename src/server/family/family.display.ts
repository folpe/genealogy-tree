import {
  ancestorsOf,
  buildFamilyIndex,
  type FamilyIndex,
  FILIATION_KINDS,
  isOngoing,
} from './family.helper';
import type { FamilyGraph, ParentChild, ParentChildKind, Union } from './family.types';
import { compareFuzzyDates } from './fuzzy-date.helper';

export type DisplayedUnion = {
  id: string;
  partnerIds: [string, string | null];
  past: boolean;
  unknownPartner: boolean;
};

/**
 * - `partner` : partenaire -> union dessinée ;
 * - `child` : union dessinée -> enfant ;
 * - `parent` : parent -> enfant, quand l'union d'origine n'est pas dessinée (union passée)
 *   ou inconnue (branche qui part du parent lui-même) ;
 * - `raised` : beau-parent -> enfant élevé (filiation `a_eleve`, trait pointillé).
 */
export type DisplayedEdge = {
  kind: 'partner' | 'child' | 'parent' | 'raised';
  from: string;
  to: string;
  filiation?: ParentChildKind;
};

export type DisplayedGraph = {
  personIds: string[];
  unions: DisplayedUnion[];
  edges: DisplayedEdge[];
};

export type DisplayOptions = {
  /** Personne au centre de la vue : ses propres unions d'origine restent visibles. */
  focusId: string;
  showPastUnions?: boolean;
};

/**
 * Une union est passée si elle a pris fin par séparation ou divorce, ou par un
 * décès suivi d'une nouvelle union en cours. Un veuvage sans remariage reste
 * l'union de référence (spec section 8.1).
 */
function isPast(index: FamilyIndex, union: Union): boolean {
  if (isOngoing(union)) return false;
  if (union.end?.reason !== 'deces') return true;
  return union.partnerIds.some((pid) =>
    (pid === null ? [] : (index.unionsByPerson.get(pid) ?? [])).some(
      (other) => other.id !== union.id && isOngoing(other),
    ),
  );
}

/** Sélection logique de ce que le moteur de rendu dessine (spec section 8.1). */
export function selectDisplayedGraph(
  graph: FamilyGraph,
  { focusId, showPastUnions = false }: DisplayOptions,
): DisplayedGraph {
  const index = buildFamilyIndex(graph);
  const lineage = new Set([focusId, ...ancestorsOf(index, focusId).keys()]);

  const shown = new Map<string, DisplayedUnion>();
  for (const union of graph.unions) {
    const past = isPast(index, union);
    // Une union passée reste visible du côté de l'enfant : dans la vue centrée sur
    // lui ou sur l'un de ses descendants.
    const childOfFocusLineage = graph.parentChildren.some(
      (l) => l.unionId === union.id && lineage.has(l.childId),
    );
    if (!past || showPastUnions || childOfFocusLineage) {
      shown.set(union.id, {
        id: union.id,
        partnerIds: union.partnerIds,
        past,
        unknownPartner: union.partnerIds[1] === null,
      });
    }
  }

  // Un ancien conjoint n'est dessiné que s'il tient à l'arbre autrement que par
  // une union masquée : une union dessinée, ou ses propres parents.
  const hiddenPartners = new Set<string>();
  for (const union of graph.unions) {
    if (shown.has(union.id)) continue;
    for (const pid of union.partnerIds) {
      if (pid === null) continue;
      const hasShownUnion = (index.unionsByPerson.get(pid) ?? []).some((u) => shown.has(u.id));
      const hasParents = (index.linksByChild.get(pid) ?? []).some((l) =>
        FILIATION_KINDS.includes(l.kind),
      );
      if (!hasShownUnion && !hasParents) hiddenPartners.add(pid);
    }
  }

  const personIds = graph.persons.map((p) => p.id).filter((id) => !hiddenPartners.has(id));
  const edges: DisplayedEdge[] = [];

  for (const union of shown.values()) {
    for (const pid of union.partnerIds) {
      if (pid !== null) edges.push({ kind: 'partner', from: pid, to: union.id });
    }
  }

  const childEdges = new Set<string>();
  for (const link of byBirth(index, graph.parentChildren)) {
    if (hiddenPartners.has(link.parentId)) continue;
    if (link.kind === 'a_eleve') {
      edges.push({ kind: 'raised', from: link.parentId, to: link.childId });
      continue;
    }
    const filiation = link.kind === 'biologique' ? {} : { filiation: link.kind };
    if (link.unionId !== undefined && shown.has(link.unionId)) {
      const key = `${link.unionId}>${link.childId}`;
      if (!childEdges.has(key)) {
        childEdges.add(key);
        edges.push({ kind: 'child', from: link.unionId, to: link.childId, ...filiation });
      }
    } else {
      edges.push({ kind: 'parent', from: link.parentId, to: link.childId, ...filiation });
    }
  }

  return { personIds, unions: [...shown.values()], edges };
}

/**
 * Les liens de filiation par ordre de naissance de l'enfant, l'aîné d'abord (retour de
 * Folpe, 2026-10-16) ; les dates inconnues après, dans leur ordre. Le placement range
 * chaque fratrie dans l'ordre de ces arêtes.
 */
function byBirth(index: FamilyIndex, links: ParentChild[]): ParentChild[] {
  const birthOf = (id: string) => index.persons.get(id)?.birth?.date;
  return [...links].sort((a, b) => {
    const da = birthOf(a.childId);
    const db = birthOf(b.childId);
    if (!da || !db) return (da ? 0 : 1) - (db ? 0 : 1);
    return compareFuzzyDates(da, db);
  });
}
