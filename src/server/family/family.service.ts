// tdd-cover: e2e src/server/family/family.service.integration.test.ts
import { AppError } from '../_shared/errors';
import { buildAccessContext } from '../access/access.policy';
import { showsProfilePhoto } from '../access/access.redact';
import { type TreeView, viewTreeAs } from '../access/access.view';
import { adminRecordViews } from '../db/schema';
import type { Db } from '../db/types';
import { loadProfilePhotos } from '../media/media.service';
import { type PersonPhoto, signedPhoto } from '../media/media.url';
import { loadAccessMembers } from '../members/members.repository';
import { type DisplayedGraph, selectDisplayedGraph } from './family.display';
import { buildFamilyIndex, generationLevels } from './family.helper';
import { loadFamilyGraph } from './family.repository';
import { selectSubgraph } from './family.subgraph';
import { todayIn } from './fuzzy-date.helper';

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
};

/** Ce que l'arbre dessine (plan phase 4, lot 6), lu dans l'URL de `/tree`. */
export type TreeDisplay = {
  view: 'all' | 'descendants' | 'hourglass';
  /** Personne au centre des vues descendants et sablier ; par défaut, le lecteur. */
  p?: string;
  /** Unions passées montrées (spec section 8.1 : masquées par défaut). */
  past: boolean;
  /** Générations au plus de chaque côté ; sans limite par défaut. */
  depth?: number;
};

const WHOLE_FAMILY: TreeDisplay = { view: 'all', past: false };

export async function getTreeForViewer(
  deps: FamilyDeps,
  viewerUserId: string,
  display: TreeDisplay = WHOLE_FAMILY,
): Promise<TreeForViewer> {
  const members = await loadAccessMembers(deps.db);
  const viewer = members.find((m) => m.userId === viewerUserId);
  if (!viewer) {
    throw new AppError({ message: 'Accès réservé', code: 'FAMILY_FORBIDDEN', status: 403 });
  }
  const [graph, profilePhotos] = await Promise.all([
    loadFamilyGraph(deps.db),
    loadProfilePhotos(deps.db),
  ]);
  const index = buildFamilyIndex(graph);
  const now = deps.now();
  const today = todayIn(now, FAMILY_TIME_ZONE);
  const { audited, ...view } = viewTreeAs(buildAccessContext(index, members), viewer, today);

  if (audited.length > 0 && today.precision === 'exacte') {
    const viewedOn = [today.year, today.month, today.day]
      .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, '0'))
      .join('-');
    await deps.db
      .insert(adminRecordViews)
      .values(audited.map((personId) => ({ userId: viewerUserId, personId, viewedOn })))
      .onConflictDoNothing();
  }

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
  // sous-graphe ne fait que retirer des fiches de la vue déjà filtrée par la policy.
  const centerId = display.p && index.persons.has(display.p) ? display.p : focusId;
  const shown =
    display.view === 'all'
      ? graph
      : selectSubgraph(graph, {
          view: display.view,
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
  };
}
