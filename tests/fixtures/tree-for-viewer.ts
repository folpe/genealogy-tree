import { buildAccessContext } from '../../src/server/access/access.policy';
import { viewTreeAs } from '../../src/server/access/access.view';
import { selectDisplayedGraph } from '../../src/server/family/family.display';
import { buildFamilyIndex, generationLevels } from '../../src/server/family/family.helper';
import type { TreeForViewer } from '../../src/server/family/family.service';
import { exact } from './builders';
import { marchandFamily, marchandMembers } from './marchand-family';

/** L'arbre de la famille Marchand tel que le service le renvoie à ce membre. */
export function treeForViewer(memberId: string): TreeForViewer {
  const index = buildFamilyIndex(marchandFamily);
  const viewer = marchandMembers.find((m) => m.id === memberId);
  if (!viewer) throw new Error(memberId);
  const { audited: _, ...view } = viewTreeAs(
    buildAccessContext(index, [...marchandMembers]),
    viewer,
    exact(2026, 10, 12),
  );
  return {
    ...view,
    generations: Object.fromEntries(generationLevels(index)),
    viewerPersonId: viewer.personId ?? undefined,
    photos: {},
    drawn: selectDisplayedGraph(marchandFamily, { focusId: viewer.personId ?? 'henri' }),
    centerId: viewer.personId ?? 'henri',
  };
}
