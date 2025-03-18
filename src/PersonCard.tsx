import React from 'react'
import { Person } from '../public/data/familyData'
import { calculateAge } from './FamilyTree.helpers'

type PersonCardProps = {
  selectedPerson: Person
  closeCardFunc: () => void
}

export const PersonCard: React.FC<PersonCardProps> = ({
  selectedPerson,
  closeCardFunc,
}) => {
  const images = {
    woman: 'https://pub-6bf412fb662a4a30862ad50d3544b0c6.r2.dev/fg-3260.jpg',
    man: 'https://pub-6bf412fb662a4a30862ad50d3544b0c6.r2.dev/imagen-3420.jpg',
  }
  return (
    <div className="w-full ">
      <div className="p-6 bg-gray-100 rounded-lg shadow-md sticky top-4">
        <h2 className="text-xl text-center font-bold mb-4">
          {selectedPerson.firstName} {selectedPerson.lastName}
        </h2>
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src={
                selectedPerson.photo || selectedPerson.gender === 'male'
                  ? images.man
                  : images.woman
              }
              alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
              className="rounded-full border-4 border-gray-200 w-32 h-32 object-cover"
            />
          </div>
          <div className="space-y-2">
            <p>
              <span className="font-bold">Genre:</span>{' '}
              {selectedPerson.gender === 'male' ? 'Homme' : 'Femme'}
            </p>
            {selectedPerson.maidenName && (
              <p>
                <span className="font-bold">Nom de jeune fille:</span>{' '}
                {selectedPerson.maidenName}
              </p>
            )}
            <p>
              <span className="font-bold">Statut:</span>{' '}
              {selectedPerson.deathDate ? 'Décédé' : 'Vivant'}
            </p>
            <p>
              <span className="font-bold">Date de naissance:</span>{' '}
              {new Date(selectedPerson.birthDate).toLocaleDateString('fr-FR')}
            </p>
            {selectedPerson.deathDate && (
              <p>
                <span className="font-bold">Date de décès:</span>{' '}
                {new Date(selectedPerson.deathDate).toLocaleDateString('fr-FR')}
              </p>
            )}
            <p>
              <span className="font-bold">Âge:</span>{' '}
              {calculateAge(selectedPerson.birthDate, selectedPerson.deathDate)}
              {selectedPerson.deathDate ? ' (à son décès)' : ' ans'}
            </p>
          </div>
          <button
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={closeCardFunc}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default PersonCard
