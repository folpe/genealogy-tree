import React, { useState } from 'react'
import { Person } from '../FamilyTree/FamilyTree.types'
import {
  calculateAge,
  getPersonGenderById,
  getPersonNameById,
  handleSelectPersonById,
} from './PersonCard.utils'
import {
  CakeIcon,
  VenetianMaskIcon,
  MapPin,
  Users,
  HeartHandshake,
  X,
  Trees,
  Cross,
  House,
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
  // État pour suivre le chargement de l'image
  const [imageLoaded, setImageLoaded] = useState(false)

  const getBackgroundColor = (gender: 'male' | 'female' | undefined) => {
    if (!gender) return 'bg-gray-600'
    const normalizedGender = gender.trim().toLowerCase()
    if (normalizedGender === 'female') return 'bg-pink-500'
    if (normalizedGender === 'male') return 'bg-blue-500'
    return 'bg-gray-600'
  }

  const getButtonColorByGender = (id: string) => {
    const gender = getPersonGenderById(people, id)

    if (gender === 'male') {
      return 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200'
    }
    if (gender === 'female') {
      return 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-200'
    }

    return 'bg-gray-600/20 hover:bg-gray-600/30 text-gray-200'
  }

  // Gérer l'événement de chargement de l'image
  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={closeCardFunc}
    >
      <div
        className="relative bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg text-gray-100 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec bouton de fermeture */}
        <div className="p-6 pb-0">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-full p-1 transition-colors hover:cursor-pointer"
            onClick={closeCardFunc}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-center ">
            {selectedPerson.firstName} {selectedPerson.lastName}
          </h2>

          <div className="text-xl text-center mb-6">
            {selectedPerson.birthDate &&
              calculateAge(
                selectedPerson.birthDate ?? undefined,
                selectedPerson.deathDate ?? undefined
              )}
            {selectedPerson.deathDate ? ' ans à son décès' : ' ans'}
          </div>

          {/* Photo ou initiales - fixe, ne scroll pas */}
          <div className="flex justify-center mb-6">
            {selectedPerson.photo ? (
              <div className="relative w-48 h-48 rounded-full border-4 border-gray-700 overflow-hidden">
                {/* Placeholder flou (initiales) pendant le chargement */}
                {!imageLoaded && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-white text-3xl font-semibold ${getBackgroundColor(
                      selectedPerson.gender as 'male' | 'female'
                    )}`}
                  >
                    {selectedPerson.firstName[0]}
                    {selectedPerson.lastName[0]}
                  </div>
                )}

                {/* Image avec effet de transition */}
                <img
                  src={selectedPerson.photo}
                  alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0 blur-lg'
                  }`}
                  onLoad={handleImageLoad}
                />
              </div>
            ) : (
              <div
                className={`flex items-center justify-center rounded-full border-4 border-gray-700 w-36 h-36 text-white text-3xl font-semibold ${getBackgroundColor(
                  selectedPerson.gender as 'male' | 'female'
                )}`}
              >
                {selectedPerson.firstName[0]}
                {selectedPerson.lastName[0]}
              </div>
            )}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto px-6 pb-6 flex-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="space-y-4 text-base mb-6">
            {/* <div className="flex items-center gap-3 text-lg">
              <UserIcon className="w-6 h-6 min-w-6 text-blue-400" />
              <span className="font-medium">
                {selectedPerson.gender === 'male' ? 'Homme' : 'Femme'}
              </span>
            </div> */}

            {selectedPerson.maidenName && (
              <div className="flex items-center gap-3 text-lg">
                <VenetianMaskIcon className="w-6 h-6 min-w-6 text-purple-400" />
                <span className="font-medium">{selectedPerson.maidenName}</span>
              </div>
            )}

            {/* <div className="flex items-center gap-3 text-lg">
              <HeartIcon
                className={`w-6 h-6 min-w-6 ${
                  selectedPerson.deathDate ? 'text-gray-400' : 'text-red-400'
                }`}
              />
              <span className="font-medium">
                {selectedPerson.deathDate
                  ? `Décédé(e) le ${new Date(
                      selectedPerson.deathDate
                    ).toLocaleDateString('fr-FR')}`
                  : 'Vivant(e)'}
              </span>
            </div> */}
            <div className="flex items-center gap-3 text-lg">
              <MapPin className="w-6 h-6 min-w-6 text-orange-400" />
              <span className="font-medium">
                Né{selectedPerson.gender === 'female' && 'e'} -{' '}
                {selectedPerson.birthLocation ?? '-'}
              </span>
            </div>

            <div className="flex items-center  justify-between">
              <div className="flex items-center gap-3 text-lg w-1/2">
                <CakeIcon className="w-6 h-6 min-w-6 text-orange-400" />
                <span className="font-medium">
                  {selectedPerson.birthDate
                    ? new Date(selectedPerson.birthDate).toLocaleDateString(
                        'fr-FR'
                      )
                    : '-'}
                </span>
              </div>
              {selectedPerson.deathDate && (
                <div className="flex items-center gap-3 text-lg  w-1/2">
                  <Cross className="w-6 h-6 min-w-6 text-gray-600" />
                  <span className="font-medium">
                    {new Date(selectedPerson.deathDate).toLocaleDateString(
                      'fr-FR'
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-lg">
              <House className="w-6 h-6 min-w-6 text-green-400" />
              <span className="font-medium">
                {`${selectedPerson.city ?? '-'} - ${selectedPerson.zipCode ?? ''} ${selectedPerson.country ? '(' + selectedPerson.country + ')' : ''}`}
              </span>
            </div>
          </div>

          <div className="space-y-6 mt-8">
            {selectedPerson.parentsIds.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <Trees className="w-4 h-4 text-yellow-400" /> Parents
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPerson.parentsIds.map((parentId) => (
                    <button
                      key={parentId}
                      className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-3 py-1 rounded-full text-sm font-medium transition hover:cursor-pointer"
                      onClick={() =>
                        handleSelectPersonById(
                          people,
                          parentId,
                          selectPersonFunc
                        )
                      }
                    >
                      {getPersonNameById(people, parentId)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedPerson.partnerId.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <HeartHandshake className="w-4 h-4 text-pink-400" />{' '}
                  Partenaire(s)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPerson.partnerId.map((partnerId) => (
                    <button
                      key={partnerId}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-1 rounded-full text-sm font-medium transition hover:cursor-pointer"
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
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4 text-blue-400" /> Enfants
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPerson.childrenIds.map((childId) => (
                    <button
                      key={childId}
                      className={`${getButtonColorByGender(
                        childId
                      )} px-3 py-1 rounded-full text-sm font-medium transition hover:cursor-pointer`}
                      onClick={() =>
                        handleSelectPersonById(
                          people,
                          childId,
                          selectPersonFunc
                        )
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
    </div>
  )
}
