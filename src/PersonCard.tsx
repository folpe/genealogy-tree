import React from 'react'
import { Person } from '../public/data/familyData'
import {
  calculateAge,
  getPersonGenderById,
  getPersonNameById,
  handleSelectPersonById,
} from './FamilyTree.helpers'
import {
  UserIcon,
  CakeIcon,
  HeartIcon,
  VenetianMaskIcon,
  MapPin,
  Users,
  HeartHandshake,
} from 'lucide-react'

type PersonCardProps = {
  people: Person[]
  selectedPerson: Person
  closeCardFunc: () => void
  selectPersonFunc: (person: Person) => void
}

export const PersonCard: React.FC<PersonCardProps> = ({
  selectedPerson,
  closeCardFunc,
  people,
  selectPersonFunc,
}) => {
  const getBackgroundColor = (gender: 'male' | 'female' | undefined) => {
    if (!gender) return 'bg-gray-400'
    const normalizedGender = gender.trim().toLowerCase()
    if (normalizedGender === 'female') return 'bg-pink-400'
    if (normalizedGender === 'male') return 'bg-blue-400'
    return 'bg-gray-400'
  }

  const getButtonColorByGender = (id: string) => {
    const gender = getPersonGenderById(people, id)

    if (gender === 'male') {
      return 'bg-blue-100 hover:bg-blue-200 text-blue-800'
    }
    if (gender === 'female') {
      return 'bg-pink-100 hover:bg-pink-200 text-pink-800'
    }

    return 'bg-gray-400 text-gray-200 hover:bg-gray-600'
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={closeCardFunc}
    >
      <div
        className="relative p-6 bg-white rounded-2xl shadow-2xl w-full max-w-lg text-gray-800 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={closeCardFunc}
          aria-label="Fermer"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-center">
          {selectedPerson.firstName} {selectedPerson.lastName}
        </h2>

        <div className="flex justify-center">
          {selectedPerson.photo ? (
            <img
              src={selectedPerson.photo}
              alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
              className="rounded-full border-4 border-gray-200 w-48 h-48 object-cover"
            />
          ) : (
            <div
              className={`flex items-center justify-center rounded-full border-4 border-gray-200 w-48 h-48 text-white text-3xl font-semibold ${getBackgroundColor(
                selectedPerson.gender
              )}`}
            >
              {selectedPerson.firstName[0]}
              {selectedPerson.lastName[0]}
            </div>
          )}
        </div>

        <div className="space-y-4 text-base px-4">
          <div className="flex items-center gap-3 text-lg">
            <UserIcon className="w-6 h-6 text-blue-500" />
            <span className="font-medium">
              {selectedPerson.gender === 'male' ? 'Homme' : 'Femme'}
            </span>
          </div>

          {selectedPerson.maidenName && (
            <div className="flex items-center gap-3 text-lg">
              <VenetianMaskIcon className="w-6 h-6 text-purple-500" />
              <span className="font-medium">{selectedPerson.maidenName}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-lg">
            <HeartIcon
              className={`w-6 h-6 ${
                selectedPerson.deathDate ? 'text-gray-500' : 'text-red-500'
              }`}
            />
            <span className="font-medium">
              {selectedPerson.deathDate
                ? `Décédé(e) le ${new Date(
                    selectedPerson.deathDate
                  ).toLocaleDateString('fr-FR')}`
                : 'Vivant(e)'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-lg">
            <CakeIcon className="w-6 h-6 text-orange-400" />
            <span className="font-medium">
              {selectedPerson.birthDate
                ? new Date(selectedPerson.birthDate).toLocaleDateString('fr-FR')
                : '-'}{' '}
              (
              {selectedPerson.birthDate &&
                calculateAge(
                  selectedPerson.birthDate,
                  selectedPerson.deathDate
                )}
              {selectedPerson.deathDate ? ' ans à son décès' : ' ans'})
            </span>
          </div>

          <div className="flex items-center gap-3 text-lg">
            <MapPin className="w-6 h-6 text-green-600" />
            <span className="font-medium">
              {selectedPerson.birthLocation ?? '-'}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {selectedPerson.partnerId.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-pink-600" />{' '}
                Partenaire(s)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedPerson.partnerId.map((partnerId) => (
                  <button
                    key={partnerId}
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium transition hover:cursor-pointer"
                    onClick={() =>
                      handleSelectPersonById(
                        people,
                        partnerId,
                        selectPersonFunc
                      )
                    }
                  >
                    {getPersonNameById(people, partnerId)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedPerson.childrenIds.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Enfants
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedPerson.childrenIds.map((childId) => (
                  <button
                    key={childId}
                    className={`${getButtonColorByGender(
                      childId
                    )} px-3 py-1 rounded-full text-sm font-medium transition hover:cursor-pointer`}
                    onClick={() =>
                      handleSelectPersonById(people, childId, selectPersonFunc)
                    }
                  >
                    {getPersonNameById(people, childId)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PersonCard
