// Tous les libellés de parenté en français, centralisés pour être relus en un seul endroit.
// Perspective : tutoiement (« ton père », « la cousine germaine de ton père »).

import type { FamilyIndex } from './family.helper';
import type { Gender, Union } from './family.types';
import type { BloodRelationship, Relationship } from './kinship.helper';

type Forms = { m: string; f: string; n?: string };

const ARRIERE = (times: number) => 'arrière-'.repeat(times);

/** Au-delà, une formule générique plutôt qu'un libellé risqué. */
const MAX_NAMED_GENERATIONS = 4;

function ordinal(n: number): string {
  return n === 1 ? '1er' : `${n}e`;
}

/** Nom du lien de sang, ou `null` hors de la profondeur maîtrisée. */
function bloodForms({
  up,
  down,
  half,
}: Pick<BloodRelationship, 'up' | 'down' | 'half'>): Forms | null {
  const demi = half ? 'demi-' : '';
  if (down === 0) {
    if (up === 1) return { m: 'père', f: 'mère', n: 'parent' };
    if (up <= MAX_NAMED_GENERATIONS) {
      const prefix = `${ARRIERE(up - 2)}grand-`;
      return { m: `${prefix}père`, f: `${prefix}mère`, n: `${prefix}parent` };
    }
    return null;
  }
  if (up === 0) {
    if (down === 1) return { m: 'fils', f: 'fille', n: 'enfant' };
    if (down <= MAX_NAMED_GENERATIONS) {
      const a = ARRIERE(down - 2);
      return { m: `${a}petit-fils`, f: `${a}petite-fille`, n: `${a}petit-enfant` };
    }
    return null;
  }
  if (up === 1 && down === 1) return { m: `${demi}frère`, f: `${demi}sœur` };
  if (down === 1 && up <= MAX_NAMED_GENERATIONS) {
    const prefix = up === 2 ? '' : `${ARRIERE(up - 3)}grand-`;
    return { m: `${prefix}${demi}oncle`, f: `${prefix}${demi}tante` };
  }
  if (up === 1 && down <= MAX_NAMED_GENERATIONS) {
    const a = down === 2 ? '' : `${ARRIERE(down - 3)}petit-`;
    const af = down === 2 ? '' : `${ARRIERE(down - 3)}petite-`;
    return { m: `${a}${demi}neveu`, f: `${af}${demi}nièce` };
  }
  if (up === 2 && down === 2) return { m: `${demi}cousin germain`, f: `${demi}cousine germaine` };
  if (up === 3 && down === 3) {
    return { m: `${demi}cousin issu de germain`, f: `${demi}cousine issue de germain` };
  }
  if (up === 2 && down === 3) return { m: `petit-${demi}cousin`, f: `petite-${demi}cousine` };
  return null;
}

const startsWithVowel = (word: string) => /^[aeiouyhâàéèêëîïôöûüœ]/i.test(word);

function possessive(noun: string, feminine: boolean): string {
  return `${feminine && !startsWithVowel(noun) ? 'ta' : 'ton'} ${noun}`;
}

function definite(noun: string, feminine: boolean): string {
  if (startsWithVowel(noun)) return `l’${noun}`;
  return `${feminine ? 'la' : 'le'} ${noun}`;
}

/** « ton père », « ta mère », « ton parent », « ton frère ou ta sœur ». */
function possessiveFor(forms: Forms, gender: Gender): string {
  if (gender === 'homme') return possessive(forms.m, false);
  if (gender === 'femme') return possessive(forms.f, true);
  if (forms.n) return possessive(forms.n, false);
  return `${possessive(forms.m, false)} ou ${possessive(forms.f, true)}`;
}

function definiteFor(forms: Forms, gender: Gender): string {
  if (gender === 'femme') return definite(forms.f, true);
  if (gender === 'homme') return definite(forms.m, false);
  if (forms.n) return definite(forms.n, false);
  return `${definite(forms.m, false)} ou ${definite(forms.f, true)}`;
}

/** Forme courte d'un lien pour les descriptions (« ton cousin Luc »). */
const shortForms = (forms: Forms): Forms => ({
  m: forms.m.replace(/ (germain|issu de germain)$/, ''),
  f: forms.f.replace(/ (germaine|issue de germain)$/, ''),
  ...(forms.n ? { n: forms.n } : {}),
});

const spouseForms = (union: Union, ongoing: boolean, thirdPerson: boolean): Forms => {
  const married = union.kind === 'mariage';
  if (!ongoing) {
    return married
      ? { m: 'ex-mari', f: 'ex-femme', n: 'ex-conjoint' }
      : { m: 'ancien compagnon', f: 'ancienne compagne', n: 'ancien conjoint' };
  }
  if (married) {
    return thirdPerson
      ? { m: 'époux', f: 'épouse', n: 'conjoint' }
      : { m: 'mari', f: 'femme', n: 'conjoint' };
  }
  return { m: 'compagnon', f: 'compagne', n: 'conjoint' };
};

const IN_LAW_PARENT: Forms = { m: 'beau-père', f: 'belle-mère', n: 'beau-parent' };
const IN_LAW_SIBLING: Forms = { m: 'beau-frère', f: 'belle-sœur' };
const IN_LAW_CHILD: Forms = { m: 'beau-fils', f: 'belle-fille', n: 'bel-enfant' };
const CHILD_SPOUSE: Forms = { m: 'gendre', f: 'belle-fille', n: 'bel-enfant' };

const is = (r: BloodRelationship, up: number, down: number) => r.up === up && r.down === down;

function genericLabel(index: FamilyIndex, r: BloodRelationship): string {
  const names = r.common.map((id) => index.persons.get(id)?.firstName ?? id);
  const by = names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names.at(-1)}` : names[0];
  return `parent au ${ordinal(r.up + r.down)} degré, par ${by}`;
}

function bloodLabel(index: FamilyIndex, r: BloodRelationship, gender: Gender): string {
  const forms = bloodForms(r);
  if (forms) return possessiveFor(forms, gender);
  if (r.down === 0) return `ton ancêtre à la ${ordinal(r.up)} génération`;
  if (r.up === 0) {
    return `${gender === 'femme' ? 'ta descendante' : 'ton descendant'} à la ${ordinal(r.down)} génération`;
  }
  // Un cran plus haut que nommable : le lien du parent par lequel il passe
  // (« la cousine germaine de ton père »).
  const parentId = r.parentOnPath;
  const throughParent = parentId ? bloodForms({ ...r, up: r.up - 1 }) : null;
  if (parentId && throughParent) {
    const parent = index.persons.get(parentId);
    const parentLabel = possessiveFor(
      { m: 'père', f: 'mère', n: 'parent' },
      parent?.gender ?? 'inconnu',
    );
    return `${definiteFor(throughParent, gender)} de ${parentLabel}`;
  }
  return genericLabel(index, r);
}

function genderOf(index: FamilyIndex, id: string): Gender {
  return index.persons.get(id)?.gender ?? 'inconnu';
}

/** Libellé du lien vu par `from`, pour la personne `toId` : « ton demi-frère ». */
export function describeRelationship(index: FamilyIndex, r: Relationship, toId: string): string {
  const gender = genderOf(index, toId);
  switch (r.type) {
    case 'self':
      return 'toi';
    case 'none':
      return r.connected ? 'un parent par alliance' : 'aucun lien connu';
    case 'blood':
      return bloodLabel(index, r, gender);
    case 'spouse':
      return possessiveFor(spouseForms(r.union, r.ongoing, false), gender);
    case 'raised':
      return possessiveFor(r.raisedMe ? IN_LAW_PARENT : IN_LAW_CHILD, gender);
    case 'spouseOfRelative': {
      const rel = r.relative;
      if (r.ongoing) {
        if (is(rel, 1, 0)) return possessiveFor(IN_LAW_PARENT, gender);
        if (is(rel, 1, 1)) return possessiveFor(IN_LAW_SIBLING, gender);
        if (is(rel, 0, 1)) return possessiveFor(CHILD_SPOUSE, gender);
        const uncle = rel.down === 1 && rel.up >= 2 ? bloodForms({ ...rel, half: false }) : null;
        if (uncle) return `${possessiveFor(uncle, gender)} par alliance`;
      }
      const relativeForms = bloodForms(rel);
      if (!relativeForms) return 'parent par alliance';
      const relativeGender = genderOf(index, r.relativeId);
      const collateral = rel.up > 0 && rel.down > 0;
      const name = collateral ? ` ${index.persons.get(r.relativeId)?.firstName ?? ''}` : '';
      const spouse = definiteFor(spouseForms(r.union, r.ongoing, true), gender);
      return `${spouse} de ${possessiveFor(shortForms(relativeForms), relativeGender)}${name}`;
    }
    case 'relativeOfSpouse': {
      const rel = r.relative;
      if (is(rel, 1, 0)) return possessiveFor(IN_LAW_PARENT, gender);
      if (is(rel, 1, 1)) return possessiveFor(IN_LAW_SIBLING, gender);
      if (is(rel, 0, 1)) return possessiveFor(IN_LAW_CHILD, gender);
      const relativeForms = bloodForms(rel);
      if (!relativeForms) return 'parent par alliance';
      const spouse = possessiveFor(spouseForms(r.union, true, false), genderOf(index, r.spouseId));
      return `${definiteFor(relativeForms, gender)} de ${spouse}`;
    }
  }
}

/** « de Luc », « d’Émile ». */
function of(name: string): string {
  return startsWithVowel(name) ? `d’${name}` : `de ${name}`;
}

/**
 * Ancêtre à `up` générations (éventail) : « ta grand-mère », ou, vu depuis une autre
 * personne, « la grand-mère de Luc ».
 */
export function describeAncestor(up: number, gender: Gender, ofName?: string): string {
  const forms = bloodForms({ up, down: 0, half: false });
  if (!forms) {
    const generation = `à la ${ordinal(up)} génération`;
    return ofName ? `l’ancêtre ${of(ofName)} ${generation}` : `ton ancêtre ${generation}`;
  }
  return ofName ? `${definiteFor(forms, gender)} ${of(ofName)}` : possessiveFor(forms, gender);
}

/** « Parenté au 5e degré » (degré civil), « Parenté par alliance ». */
export function describeDegree(r: Relationship): string {
  if (r.type === 'blood') return `Parenté au ${ordinal(r.up + r.down)} degré`;
  if (r.type === 'self' || (r.type === 'none' && !r.connected)) return '';
  return 'Parenté par alliance';
}
