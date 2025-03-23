import { Person } from '../FamilyTree/FamilyTree.types'

export const calculateAge = (birthDate: string, deathDate?: string): number => {
  const birth = new Date(birthDate)
  const end = deathDate ? new Date(deathDate) : new Date()

  let age = end.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    end.getMonth() > birth.getMonth() ||
    (end.getMonth() === birth.getMonth() && end.getDate() >= birth.getDate())

  if (!hasHadBirthdayThisYear) {
    age--
  }

  return age
}

export const getPersonNameById = (people: Person[], id: string): string => {
  const person = people.find((p) => p.id === id)
  return person ? `${person.firstName} ${person.lastName}` : 'Inconnu'
}

export const getPersonGenderById = (people: Person[], id: string): string => {
  const person = people.find((p) => p.id === id)
  return person ? (person.gender ?? '') : ''
}

export const handleSelectPersonById = (
  people: Person[],
  id: string,
  setSelectedPerson: (person: Person) => void
) => {
  const person = people.find((p) => p.id === id)
  if (person) {
    setSelectedPerson(person) // à adapter selon ton state
  }
}
