import React from 'react'
import { Person } from '../public/data/familyData'

type SynthesisCardProps = {
  people: Person[]
}

const SynthesisCard: React.FC<SynthesisCardProps> = ({ people }) => {
  const totalWoman = people.filter((item) => item.gender === 'female').length
  const totalMan = people.filter((item) => item.gender === 'male').length
  const totalPeople = totalWoman + totalMan
  const percentWoman = ((totalWoman * 100) / totalPeople).toFixed(2)
  const percentMan = ((totalMan * 100) / totalPeople).toFixed(2)

  return (
    <div>
      <div>
        Woman: {percentWoman}% ({totalWoman})
      </div>
      <div>
        Man: {percentMan}% ({totalMan})
      </div>
    </div>
  )
}

export default SynthesisCard
