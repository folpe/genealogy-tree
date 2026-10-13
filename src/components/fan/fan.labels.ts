import type { Gender } from '@/server/family/family.types';
import { describeAncestor } from '@/server/family/kinship.labels';
import { personLabel } from '../family/person.helper';
import type { FanSlot } from './fan.helper';

// Ce que l'éventail dit de chaque case : le lien (« ton grand-père »), puis la
// personne, ou ce que la case attend. Les mots de la parenté restent dans
// `kinship.labels`.

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const slotKey = ({ generation, index }: FanSlot) => `${generation}:${index}`;

/** Genre pour l'accord : celui de la fiche, sinon celui que la case suppose. */
function genderOf(slot: FanSlot): Gender {
  const gender = slot.person?.gender;
  if (gender === 'homme' || gender === 'femme') return gender;
  return slot.role === 'father' ? 'homme' : 'femme';
}

/** « Ton grand-père » ; vu depuis une autre personne, « Le grand-père de Luc ». */
export function slotTitle(slot: FanSlot, rootName?: string): string {
  return capitalize(describeAncestor(slot.generation, genderOf(slot), rootName));
}

/** Ce que la case attend : « le père de Bernard Blanc ». */
export function slotAwaits(slot: FanSlot): string {
  const gender = slot.role === 'father' ? 'homme' : 'femme';
  return describeAncestor(1, gender, slot.child ? personLabel(slot.child) : undefined);
}

/** Nom accessible de la case. */
export function slotName(slot: FanSlot, rootName?: string): string {
  const title = slotTitle(slot, rootName);
  return slot.person
    ? `${title}, ${personLabel(slot.person)}`
    : `${title}, à découvrir : ${slotAwaits(slot)}`;
}

export const generationLabel = (generation: number) =>
  `${generation}${generation === 1 ? 're' : 'e'} génération`;
