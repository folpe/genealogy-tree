import React from 'react'
import { Person } from '../public/data/familyData'

type SynthesisCardProps = {
  people: Person[]
}

const SynthesisCard: React.FC<SynthesisCardProps> = ({ people }) => {
  const totalWoman = people.filter((item) => item.gender === 'female').length
  const totalMan = people.filter((item) => item.gender === 'male').length
  const totalPeople = totalWoman + totalMan
  const percentWoman = Math.round((totalWoman * 100) / totalPeople)
  const percentMan = Math.round((totalMan * 100) / totalPeople)
  const totalDecease = people.filter((item) => item.deathDate).length

  return (
    <div className="bg-white rounded-xl px-2 w-full  max-w-md text-gray-700 flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <span className="font-medium text-pink-600 mr-2 ">👩 Femmes</span>
          <span>{`${percentWoman}% (${totalWoman})`}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium text-blue-600 mr-2">👨 Hommes</span>
          <span>
            {percentMan}% ({totalMan})
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center border-l border-gray-200 pl-4 ml-4">
        <span className="font-medium">👥 Total {totalPeople}</span>
        <span className="text-sm text-gray-500 ml-2">
          dont {totalDecease} décédés
        </span>
      </div>
    </div>
  )
}

export default SynthesisCard
