import React from 'react'
import { Person } from '../FamilyTree/FamilyTree.types'

type SynthesisSectionProps = {
  people: Person[]
}

export const SynthesisSection: React.FC<SynthesisSectionProps> = ({
  people,
}) => {
  const totalWoman = people.filter((item) => item.gender === 'female').length
  const totalMan = people.filter((item) => item.gender === 'male').length
  const totalPeople = totalWoman + totalMan
  const percentWoman = Math.round((totalWoman * 100) / totalPeople)
  const percentMan = Math.round((totalMan * 100) / totalPeople)
  const totalDecease = people.filter((item) => item.deathDate).length

  return (
    <div className="flex flex-col sm:flex-row items-center justify-end text-sm w-full">
      {/* Section statistiques pour mobile (flex-col) et desktop (flex-row) */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto mb-2 sm:mb-0">
        {/* Total */}
        <div className="flex flex-col items-center">
          <span className="font-medium text-white">👥 {totalPeople}</span>
          <span className="text-gray-200 text-[10px] ml-1 text-center">
            ({totalDecease} décédés)
          </span>
        </div>

        {/* Séparateur - caché sur mobile */}
        <div className="hidden sm:block h-6 w-px bg-gray-600/30"></div>

        {/* Femmes et Hommes */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center">
            <span className="text-pink-300 text-md">{totalWoman}</span>
            <span className="text-pink-200 text-[0.7em] ml-1">
              ({percentWoman}%)
            </span>
          </div>

          {/* Barre de progression - visible uniquement sur tablette et desktop */}
          <div className="hidden md:block w-16 lg:w-24 h-2 bg-blue-300/80 rounded-full overflow-hidden">
            <div
              className="bg-pink-400 h-full"
              style={{ width: `${percentWoman}%` }}
            ></div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-blue-300 font-medium">{totalMan}</span>
            <span className="text-blue-200  text-[0.7em] mr-1">
              ({percentMan}%)
            </span>
          </div>
        </div>
      </div>

      {/* Barre de progression pour mobile uniquement */}
      <div className="w-full sm:hidden h-1 bg-gray-600/30 rounded-full overflow-hidden mt-1">
        <div
          className="bg-pink-400 h-full"
          style={{ width: `${percentWoman}%` }}
        ></div>
      </div>
    </div>
  )
}
