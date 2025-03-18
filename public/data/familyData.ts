import { tante01Family } from './tante01Data'
import { oncle01Family } from './oncle01Data'
import { oncle02Family } from './oncle02Data'

// Définition des types
export interface Person {
  id: string // 3 first letters of lastName + 4 first letters of firstName + increment
  firstName: string
  lastName: string
  maidenName?: string
  birthDate: string
  deathDate?: string
  gender: string
  photo: string
  partnersIds: string[]
  childrenIds: string[]
}

export const familyTree: Person[] = [
  {
    id: 'KHALONG1',
    firstName: 'Long-Heng',
    lastName: 'KHAU',
    birthDate: '1932-10-09',
    deathDate: '2025-03-10',
    gender: 'male',
    photo: '',
    partnersIds: ['TREHONG1'],
    childrenIds: ['TANTE01', 'ONCLE01', 'ONCLE02', 'LAYSIVN1'],
  },
  {
    id: 'TREHONG1',
    firstName: 'Hong',
    lastName: 'KHAU',
    maidenName: 'TRET',
    birthDate: '1932-10-09',
    deathDate: '2025-03-10',
    gender: 'female',
    photo: '',
    partnersIds: ['KHALONG1'],
    childrenIds: ['TANTE01', 'ONCLE01', 'ONCLE02', 'LAYSIVN1'],
  },
  {
    id: 'LAYSIVN1',
    firstName: 'Siv Nay',
    lastName: 'LAY',
    maidenName: 'KHAU',
    birthDate: '1955-10-18',
    gender: 'female',
    photo: '',
    partnersIds: ['LAYKEAN1'],
    childrenIds: ['LAYCHHO1', 'LAYHEAN1', 'CALPOUY1', 'LAYSAND1'],
  },
  {
    id: 'LAYKEAN1', // 3 first letters of lastName + 4 first letters of firstName + increment
    firstName: 'Keang Huor',
    lastName: 'LAY',
    birthDate: '1941-02-15',
    deathDate: '2021-10-05',
    gender: 'male',
    photo: '',
    partnersIds: ['LAYSIVN1'],
    childrenIds: ['LAYCHHO1', 'LAYHEAN1', 'CALPOUY1', 'LAYSAND1'],
  },

  {
    id: 'LAYCHHO1',
    firstName: 'Chhor',
    lastName: 'LAY',
    birthDate: '1972-05-14',
    gender: 'male',
    photo: '',
    partnersIds: ['KIECHRI1'],
    childrenIds: ['LAYALEX1'],
  },
  {
    id: 'KIECHRI1',
    firstName: 'Christine',
    lastName: 'KIEU',
    maidenName: '',
    birthDate: '1970-12-17',
    gender: 'female',
    photo: '',
    partnersIds: ['LAYCHHO1'],
    childrenIds: ['XXXELIS1', 'LAYALEX1'],
  },
  {
    id: 'LAYHEAN1',
    firstName: 'Heang',
    lastName: 'LAY',
    birthDate: '1975-10-16',
    gender: 'male',
    photo: '',
    partnersIds: ['LAYMARI1'],
    childrenIds: ['LAYDIAN1', 'LAYELIS1', 'LAYAYDE1'],
  },
  {
    id: 'LAYMARI1',
    firstName: 'Marie',
    lastName: 'LAY',
    maidenName: 'DAVID',
    birthDate: '1976-02-14',
    gender: 'female',
    photo: '',
    partnersIds: ['LAYHEAN1'],
    childrenIds: ['XXXCONS1'],
  },
  {
    id: 'CALPOUY1',
    firstName: 'Pouy-San',
    lastName: 'CALANVILLE',
    maidenName: 'LAY',
    birthDate: '1977-06-08',
    gender: 'female',
    photo: '',
    partnersIds: ['CALOLIV1'],
    childrenIds: ['CALNATH1', 'CALMAEL1'],
  },
  {
    id: 'CALOLIV1',
    firstName: 'Olivier',
    lastName: 'CALANVILLE',
    birthDate: '1974-10-16',
    gender: 'male',
    photo: '',
    partnersIds: ['CALPOUY1'],
    childrenIds: ['CALNATH1', 'CALMAEL1'],
  },
  {
    id: 'LAYSAND1',
    firstName: 'Sandrine',
    lastName: 'LAY',
    maidenName: 'LAY',
    birthDate: '1987-08-01',
    gender: 'female',
    photo: '',
    partnersIds: ['PELFLOR1'],
    childrenIds: ['PELLENA1', 'PELMILO1'],
  },
  {
    id: 'PELFLOR1',
    firstName: 'Florent',
    lastName: 'PELLEGRIN',
    birthDate: '1984-06-30',
    gender: 'male',
    photo: '',
    partnersIds: ['LAYSAND1'],
    childrenIds: ['PELLENA1', 'PELMILO1', 'GRADIAN1'],
  },
  {
    id: 'PELLENA1',
    firstName: 'Lena',
    lastName: 'PELLEGRIN',
    birthDate: '2019-11-09',
    gender: 'female',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },
  {
    id: 'PELMILO1',
    firstName: 'Milo',
    lastName: 'PELLEGRIN',
    birthDate: '2022-06-13',
    gender: 'male',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },
  {
    id: 'GRADIAN1',
    firstName: 'Diane',
    lastName: 'GRATIEN',
    birthDate: '2013-11-21',
    gender: 'female',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },
  {
    id: 'CALNATH1',
    firstName: 'Nathan',
    lastName: 'CALANVILLE',
    birthDate: '2009-01-04',
    gender: 'male',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },
  {
    id: 'CALMAEL1',
    firstName: 'Maelys',
    lastName: 'CALANVILLE',
    birthDate: '2011-06-06',
    gender: 'female',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },

  {
    id: 'LAYDIAN1',
    firstName: 'Diane',
    lastName: 'LAY',
    birthDate: '2006-10-21',
    gender: 'female',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },
  {
    id: 'LAYELIS1',
    firstName: 'ELISA',
    lastName: 'LAY',
    birthDate: '2009-02-27',
    gender: 'female',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },
  {
    id: 'XXXCONS1',
    firstName: 'Constance',
    lastName: 'XXX',
    birthDate: '2009-02-14',
    gender: 'female',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },
  {
    id: 'LAYAYDE1',
    firstName: 'Ayden',
    lastName: 'LAY',
    birthDate: '2013-10-14',
    gender: 'male',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },

  {
    id: 'XXXELIS1',
    firstName: 'Elisabeth',
    lastName: 'XXX',
    birthDate: '2006-02-14',
    gender: 'female',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },
  {
    id: 'LAYALEX1',
    firstName: 'Alexandre',
    lastName: 'LAY',
    birthDate: '2013-06-06',
    gender: 'male',
    photo: '',
    partnersIds: [],
    childrenIds: [],
  },
  //reste
  ...tante01Family,
  ...oncle01Family,
  ...oncle02Family,
]
