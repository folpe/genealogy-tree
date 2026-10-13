// tdd-cover: e2e src/server/family/family.service.integration.test.ts
import { AppError } from '../_shared/errors';
import { buildAccessContext, editableIds } from '../access/access.policy';
import { showsProfilePhoto } from '../access/access.redact';
import { type TreeView, viewTreeAs } from '../access/access.view';
import { adminRecordViews } from '../db/schema';
import type { Db } from '../db/types';
import { loadProfilePhotos } from '../media/media.service';
import { type PersonPhoto, signedPhoto } from '../media/media.url';
import { loadAccessMembers } from '../members/members.repository';
import { type DisplayedGraph, selectDisplayedGraph } from './family.display';
import { buildFamilyIndex, generationLevels, partnersOf } from './family.helper';
import { loadFamilyGraph } from './family.repository';
import { selectSubgraph } from './family.subgraph';
import { todayIn } from './fuzzy-date.helper';
import { type Relationship, relationship } from './kinship.helper';
import { describeRelationship } from './kinship.labels';

// Lecture de l'arbre à travers la policy (spec section 6.4). Rien ne sort d'ici
// sans être passé par viewTreeAs : c'est la frontière entre la base et le client.

export type FamilyDeps = { db: Db; now: () => Date; mediaKey: Buffer };

/** Fuseau de la famille : fixe le jour qui compte pour l'âge des mineurs et le journal. */
const FAMILY_TIME_ZONE = 'Europe/Paris';

export type TreeForViewer = Omit<TreeView, 'audited'> & {
  /** Génération de chaque fiche (0 = la plus ancienne de sa branche). */
  generations: Record<string, number>;
  /** Fiche « C'est moi » du lecteur, absente pour un admin non relié. */
  viewerPersonId: string | undefined;
  /** Photo de profil des seules fiches dont le niveau la montre, en URLs signées. */
  photos: Record<string, PersonPhoto>;
  /**
   * Ce que le canevas dessine, centré sur le lecteur (ou, pour un admin non relié,
   * sur la première fiche la plus ancienne). Rien que des identifiants et la forme
   * des liens : la vue filtrée les expose déjà tous, unions et filiations comprises.
   */
  drawn: DisplayedGraph;
  /** Personne au centre de la vue dessinée : celle demandée, sinon le lecteur. */
  centerId: string;
  /** Vue dessinée : celle demandée, sinon la vue par défaut du lecteur. */
  shownView: TreeViewKind;
  /** La personne au centre a une union en cours : « notre famille » a un sens. */
  centerInCouple: boolean;
  /** Fiches où le lecteur ajoute directement un proche ; ailleurs, il faudra suggérer. */
  editableIds: string[];
};

export type TreeViewKind = 'all' | 'couple' | 'descendants' | 'hourglass';

/** Ce que l'arbre dessine (plan phase 4, lot 6), lu dans l'URL de `/tree`. */
export type TreeDisplay = {
  /**
   * Absente : la vue du lecteur lui-même, « notre famille » s'il est en couple, sinon
   * son sablier ; un compte sans fiche voit toute la famille.
   */
  view?: TreeViewKind;
  /** Personne au centre des vues descendants et sablier ; par défaut, le lecteur. */
  p?: string;
  /** Unions passées montrées (spec section 8.1 : masquées par défaut). */
  past: boolean;
  /** Générations au plus de chaque côté ; sans limite par défaut. */
  depth?: number;
};

const DEFAULT_DISPLAY: TreeDisplay = { past: false };

/**
 * Ce que le lecteur a le droit de voir, et le graphe complet pour les calculs qui ne
 * sortent que des identifiants. Journalise les lectures d'admin au-delà de son cercle.
 */
async function readAsViewer(deps: FamilyDeps, viewerUserId: string) {
  const members = await loadAccessMembers(deps.db);
  const viewer = members.find((m) => m.userId === viewerUserId);
  if (!viewer) {
    throw new AppError({ message: 'Accès réservé', code: 'FAMILY_FORBIDDEN', status: 403 });
  }
  const graph = await loadFamilyGraph(deps.db);
  const index = buildFamilyIndex(graph);
  const now = deps.now();
  const today = todayIn(now, FAMILY_TIME_ZONE);
  const ctx = buildAccessContext(index, members);
  const { audited, ...view } = viewTreeAs(ctx, viewer, today);

  if (audited.length > 0 && today.precision === 'exacte') {
    const viewedOn = [today.year, today.month, today.day]
      .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, '0'))
      .join('-');
    await deps.db
      .insert(adminRecordViews)
      .values(audited.map((personId) => ({ userId: viewerUserId, personId, viewedOn })))
      .onConflictDoNothing();
  }
  return { graph, index, ctx, viewer, view, now };
}

export async function getTreeForViewer(
  deps: FamilyDeps,
  viewerUserId: string,
  display: TreeDisplay = DEFAULT_DISPLAY,
): Promise<TreeForViewer> {
  const [{ graph, index, ctx, viewer, view, now }, profilePhotos] = await Promise.all([
    readAsViewer(deps, viewerUserId),
    loadProfilePhotos(deps.db),
  ]);

  const photos = Object.fromEntries(
    view.persons.flatMap((person) => {
      const photo = profilePhotos.get(person.id);
      return photo && showsProfilePhoto(person.level)
        ? [[person.id, signedPhoto(photo, now, deps.mediaKey)]]
        : [];
    }),
  );

  const generations = generationLevels(index);
  const focusId =
    viewer.personId ?? graph.persons.find((p) => generations.get(p.id) === 0)?.id ?? '';
  // La personne demandée doit exister ; sinon la vue se centre sur le lecteur. Le
  // sous-graphe se prend sur le graphe complet, comme la vue « toute la famille » :
  // il n'en garde qu'une partie, et `drawn` ne porte que des ids et la forme des
  // liens, que la vue filtrée par la policy expose déjà tous.
  const centerId = display.p && index.persons.has(display.p) ? display.p : focusId;
  const centerInCouple = partnersOf(index, centerId, { ongoingOnly: true }).some(
    (p) => typeof p.partnerId === 'string',
  );
  // Sans union en cours, « notre famille » est le sablier : on le nomme comme tel.
  const asked: TreeViewKind = display.view ?? (viewer.personId ? 'couple' : 'all');
  const shownView = asked === 'couple' && !centerInCouple ? 'hourglass' : asked;
  const shown =
    shownView === 'all'
      ? graph
      : selectSubgraph(graph, {
          view: shownView,
          rootId: centerId,
          ...(display.depth ? { depth: display.depth } : {}),
        });
  return {
    ...view,
    generations: Object.fromEntries(generations),
    viewerPersonId: viewer.personId ?? undefined,
    photos,
    drawn: selectDisplayedGraph(shown, { focusId: centerId, showPastUnions: display.past }),
    centerId,
    shownView,
    centerInCouple,
    editableIds: editableIds(ctx, viewer),
  };
}

/** Générations entre le lecteur et la fiche ; une alliance compte pour un pas. */
function distanceOf(r: Relationship): number {
  switch (r.type) {
    case 'self':
      return 0;
    case 'blood':
      return r.up + r.down;
    case 'spouseOfRelative':
    case 'relativeOfSpouse':
      return r.relative.up + r.relative.down + 1;
    default:
      return 1;
  }
}

/** Annuaire du ⌘K : les fiches visibles, et le lien de chacune avec le lecteur. */
export type SearchDirectory = {
  persons: TreeView['persons'];
  /** « ton grand-père », pour les fiches reliées au lecteur. */
  relations: Record<string, string>;
  /** Distance de parenté (générations montées et descendues) : les proches d'abord. */
  proximity: Record<string, number>;
};

export async function getSearchDirectory(
  deps: FamilyDeps,
  viewerUserId: string,
): Promise<SearchDirectory> {
  const { index, viewer, view } = await readAsViewer(deps, viewerUserId);
  const from = viewer.personId;
  const relations: Record<string, string> = {};
  const proximity: Record<string, number> = {};
  if (from) {
    for (const person of view.persons) {
      const r = relationship(index, from, person.id);
      if (r.type === 'none') continue;
      relations[person.id] = describeRelationship(index, r, person.id);
      proximity[person.id] = distanceOf(r);
    }
  }
  return { persons: view.persons, relations, proximity };
}
