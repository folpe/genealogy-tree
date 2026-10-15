import type { Member } from '../../src/server/access/access.types';
import type { FamilyGraph } from '../../src/server/family/family.types';
import { aChildOf, anUnion, aPerson, exact, yearOnly } from './builders';

/**
 * Famille fictive des maquettes (docs/design/maquettes). Source unique de la
 * famille dans les tests, puis dans les seeds (phase 3) et les tests e2e.
 *
 * Ajouts par rapport aux maquettes, pour couvrir des règles : `claire` (mère de
 * Maxime, union passée de Luc), `jade` (mineure, fille de Léa) et `tom` (adopté
 * par Anne).
 */
const person = aPerson;

export const marchandFamily: FamilyGraph = {
  persons: [
    person('henri', {
      firstName: 'Henri',
      lastName: 'Marchand',
      gender: 'homme',
      birth: { date: yearOnly(1902), place: 'Rodez' },
      death: { date: yearOnly(1979), place: 'Rodez' },
      sourcedFields: ['death.date'],
    }),
    person('louise', {
      firstName: 'Louise',
      lastName: 'Marchand',
      birthName: 'Garnier',
      gender: 'femme',
      birth: { date: yearOnly(1905), place: 'Millau' },
      death: { date: yearOnly(1991), place: 'Rodez' },
    }),
    person('emile', {
      firstName: 'Émile',
      lastName: 'Roux',
      gender: 'homme',
      birth: { date: yearOnly(1905), place: 'Albi' },
      death: { date: yearOnly(1980), place: 'Albi' },
    }),
    person('marthe', {
      firstName: 'Marthe',
      lastName: 'Roux',
      birthName: 'Vidal',
      gender: 'femme',
      birth: { date: yearOnly(1908), place: 'Albi' },
      death: { date: yearOnly(1996), place: 'Albi' },
    }),
    person('paul', {
      firstName: 'Paul',
      lastName: 'Marchand',
      gender: 'homme',
      birth: { date: yearOnly(1931), place: 'Rodez' },
      death: { date: yearOnly(2008), place: 'Toulouse' },
    }),
    person('jeanne', {
      firstName: 'Jeanne',
      lastName: 'Marchand',
      birthName: 'Roux',
      gender: 'femme',
      birth: { date: yearOnly(1934), place: 'Albi' },
      death: { date: yearOnly(2019), place: 'Toulouse' },
    }),
    person('marie', {
      firstName: 'Marie',
      lastName: 'Lefèvre',
      birthName: 'Marchand',
      gender: 'femme',
      birth: { date: exact(1936, 6, 4), place: 'Rodez' },
      residence: 'Rodez',
    }),
    person('jacques', {
      firstName: 'Jacques',
      lastName: 'Lefèvre',
      gender: 'homme',
      birth: { date: yearOnly(1933), place: 'Lyon' },
      death: { date: yearOnly(2015), place: 'Lyon' },
    }),
    person('claude', {
      firstName: 'Claude',
      lastName: 'Marchand',
      gender: 'homme',
      birth: { date: exact(1940, 2, 17), place: 'Rodez' },
      residence: 'Montpellier',
    }),
    person('bernard', {
      firstName: 'Bernard',
      lastName: 'Blanc',
      gender: 'homme',
      birth: { date: yearOnly(1938), place: 'Nantes' },
      death: { date: yearOnly(2012), place: 'Nantes' },
    }),
    person('odette', {
      firstName: 'Odette',
      lastName: 'Blanc',
      birthName: 'Pichon',
      gender: 'femme',
      birth: { date: exact(1941, 9, 12), place: 'Nantes' },
      residence: 'Nantes',
    }),
    person('anne', {
      firstName: 'Anne',
      lastName: 'Marchand',
      gender: 'femme',
      birth: { date: exact(1960, 5, 2), place: 'Toulouse' },
      residence: 'Bordeaux',
    }),
    person('luc', {
      firstName: 'Luc',
      lastName: 'Marchand',
      nickname: 'Lulu',
      gender: 'homme',
      birth: { date: exact(1963, 8, 21), place: 'Toulouse' },
      residence: 'Toulouse',
    }),
    person('claire', {
      firstName: 'Claire',
      lastName: 'Dumont',
      gender: 'femme',
      birth: { date: yearOnly(1964), place: 'Nantes' },
      residence: 'Nantes',
    }),
    person('sophie', {
      firstName: 'Sophie',
      lastName: 'Marchand',
      birthName: 'Blanc',
      gender: 'femme',
      birth: { date: exact(1965, 1, 9), place: 'Nantes' },
      residence: 'Toulouse',
    }),
    person('isabelle', {
      firstName: 'Isabelle',
      lastName: 'Lefèvre',
      gender: 'femme',
      birth: { date: exact(1962, 10, 30), place: 'Lyon' },
      residence: 'Lyon',
    }),
    person('tom', {
      firstName: 'Tom',
      lastName: 'Marchand',
      gender: 'homme',
      birth: { date: exact(2005, 4, 18), place: 'Bogota' },
      residence: 'Bordeaux',
    }),
    person('maxime', {
      firstName: 'Maxime',
      lastName: 'Marchand',
      gender: 'homme',
      birth: { date: exact(1987, 3, 14), place: 'Nantes' },
      residence: 'Lille',
      notes: 'Né d’une précédente union de Luc. Il a grandi entre Nantes et Toulouse.',
    }),
    person('lea', {
      firstName: 'Léa',
      lastName: 'Marchand',
      gender: 'femme',
      birth: { date: exact(1992, 7, 3), place: 'Toulouse' },
      residence: 'Paris',
    }),
    person('hugo', {
      firstName: 'Hugo',
      lastName: 'Marchand',
      gender: 'homme',
      birth: { date: exact(1995, 11, 26), place: 'Toulouse' },
      residence: 'Toulouse',
    }),
    person('jade', {
      firstName: 'Jade',
      lastName: 'Marchand',
      gender: 'femme',
      birth: { date: exact(2018, 2, 6), place: 'Paris' },
      residence: 'Paris',
    }),
  ],
  unions: [
    anUnion('u-henri-louise', 'henri', 'louise', { start: yearOnly(1928) }),
    anUnion('u-emile-marthe', 'emile', 'marthe', {
      start: yearOnly(1930),
      end: { date: yearOnly(1980), reason: 'deces' },
    }),
    anUnion('u-paul-jeanne', 'paul', 'jeanne', { start: yearOnly(1957) }),
    anUnion('u-marie-jacques', 'marie', 'jacques', {
      start: yearOnly(1959),
      end: { date: yearOnly(2015), reason: 'deces' },
    }),
    anUnion('u-bernard-odette', 'bernard', 'odette', {
      start: yearOnly(1962),
      end: { date: yearOnly(2012), reason: 'deces' },
    }),
    anUnion('u-luc-claire', 'luc', 'claire', {
      kind: 'union_libre',
      start: yearOnly(1985),
      end: { date: yearOnly(1989), reason: 'separation' },
    }),
    anUnion('u-luc-sophie', 'luc', 'sophie', { start: yearOnly(1990) }),
  ],
  parentChildren: [
    aChildOf('henri', 'paul', { unionId: 'u-henri-louise' }),
    aChildOf('louise', 'paul', { unionId: 'u-henri-louise' }),
    aChildOf('henri', 'marie', { unionId: 'u-henri-louise' }),
    aChildOf('louise', 'marie', { unionId: 'u-henri-louise' }),
    aChildOf('henri', 'claude', { unionId: 'u-henri-louise' }),
    aChildOf('louise', 'claude', { unionId: 'u-henri-louise' }),
    aChildOf('emile', 'jeanne', { unionId: 'u-emile-marthe' }),
    aChildOf('marthe', 'jeanne', { unionId: 'u-emile-marthe' }),
    aChildOf('paul', 'anne', { unionId: 'u-paul-jeanne' }),
    aChildOf('jeanne', 'anne', { unionId: 'u-paul-jeanne' }),
    aChildOf('paul', 'luc', { unionId: 'u-paul-jeanne' }),
    aChildOf('jeanne', 'luc', { unionId: 'u-paul-jeanne' }),
    aChildOf('marie', 'isabelle', { unionId: 'u-marie-jacques' }),
    aChildOf('jacques', 'isabelle', { unionId: 'u-marie-jacques' }),
    aChildOf('bernard', 'sophie', { unionId: 'u-bernard-odette' }),
    aChildOf('odette', 'sophie', { unionId: 'u-bernard-odette' }),
    aChildOf('anne', 'tom', { kind: 'adoptive' }),
    aChildOf('luc', 'maxime', { unionId: 'u-luc-claire' }),
    aChildOf('claire', 'maxime', { unionId: 'u-luc-claire' }),
    aChildOf('sophie', 'maxime', { kind: 'a_eleve' }),
    aChildOf('luc', 'lea', { unionId: 'u-luc-sophie' }),
    aChildOf('sophie', 'lea', { unionId: 'u-luc-sophie' }),
    aChildOf('luc', 'hugo', { unionId: 'u-luc-sophie' }),
    aChildOf('sophie', 'hugo', { unionId: 'u-luc-sophie' }),
    aChildOf('lea', 'jade'),
  ],
};

/** Comptes inscrits des maquettes ; `joinedAt` fixe l'ancienneté (départage des gardiens). */
export const marchandMembers = [
  { id: 'm-folpe', personId: null, isAdmin: true, joinedAt: 1 },
  { id: 'm-luc', personId: 'luc', isAdmin: false, joinedAt: 2 },
  { id: 'm-hugo', personId: 'hugo', isAdmin: false, joinedAt: 3 },
  { id: 'm-anne', personId: 'anne', isAdmin: false, joinedAt: 4 },
  { id: 'm-isabelle', personId: 'isabelle', isAdmin: false, joinedAt: 5 },
] as const satisfies readonly Member[];
