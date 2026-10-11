import {
  CycleError,
  InconsistentDatesError,
  SelfUnionError,
  TooManyBiologicalParentsError,
} from './family.errors';
import { ancestorsOf, childrenOf, type FamilyIndex, parentsOf } from './family.helper';
import type { FuzzyDate, ParentChild, Union } from './family.types';
import { formatFuzzyDate, isCertainlyBefore } from './fuzzy-date.helper';

// Les invariants ne rejettent qu'un conflit certain : avec des dates approximatives,
// on refuse seulement quand les intervalles ne peuvent pas se recouvrir.

const birthOf = (index: FamilyIndex, id: string) => index.persons.get(id)?.birth?.date;
const nameOf = (index: FamilyIndex, id: string) => index.persons.get(id)?.firstName ?? id;

function assertBornBefore(
  index: FamilyIndex,
  parentId: string,
  parentBirth: FuzzyDate | undefined,
  childId: string,
  childBirth: FuzzyDate | undefined,
) {
  if (parentBirth && childBirth && isCertainlyBefore(childBirth, parentBirth)) {
    throw new InconsistentDatesError(
      `${nameOf(index, childId)} (${formatFuzzyDate(childBirth)}) serait né avant son parent ` +
        `${nameOf(index, parentId)} (${formatFuzzyDate(parentBirth)})`,
    );
  }
}

export function assertCanAddParentChild(index: FamilyIndex, link: ParentChild): void {
  const { parentId, childId } = link;
  if (parentId === childId || ancestorsOf(index, parentId).has(childId)) {
    throw new CycleError(parentId, childId);
  }
  assertBornBefore(index, parentId, birthOf(index, parentId), childId, birthOf(index, childId));
  if (link.kind === 'biologique') {
    const biological = parentsOf(index, childId, { kinds: ['biologique'] });
    if (biological.length >= 2 && !biological.some((p) => p.id === parentId)) {
      throw new TooManyBiologicalParentsError(childId);
    }
  }
}

export function assertCanAddUnion(index: FamilyIndex, union: Union): void {
  const [a, b] = union.partnerIds;
  if (a === b) throw new SelfUnionError(a);
  const start = union.start;
  if (start) {
    for (const partnerId of union.partnerIds) {
      const birth = partnerId === null ? undefined : birthOf(index, partnerId);
      if (partnerId !== null && birth && isCertainlyBefore(start, birth)) {
        throw new InconsistentDatesError(
          `L’union commencerait (${formatFuzzyDate(start)}) avant la naissance de ` +
            `${nameOf(index, partnerId)} (${formatFuzzyDate(birth)})`,
        );
      }
    }
  }
  const end = union.end?.date;
  if (start && end && isCertainlyBefore(end, start)) {
    throw new InconsistentDatesError(
      `L’union finirait (${formatFuzzyDate(end)}) avant d’avoir commencé (${formatFuzzyDate(start)})`,
    );
  }
}

export function assertCanUpdateDates(
  index: FamilyIndex,
  personId: string,
  change: { birth?: FuzzyDate; death?: FuzzyDate },
): void {
  const person = index.persons.get(personId);
  const birth = change.birth ?? person?.birth?.date;
  const death = change.death ?? person?.death?.date;
  if (birth && death && isCertainlyBefore(death, birth)) {
    throw new InconsistentDatesError(
      `Le décès (${formatFuzzyDate(death)}) précéderait la naissance (${formatFuzzyDate(birth)})`,
    );
  }
  for (const parent of parentsOf(index, personId)) {
    assertBornBefore(index, parent.id, birthOf(index, parent.id), personId, birth);
  }
  for (const child of childrenOf(index, personId)) {
    assertBornBefore(index, personId, birth, child.id, birthOf(index, child.id));
  }
}
