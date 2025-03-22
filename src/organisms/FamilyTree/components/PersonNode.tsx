import React from 'react'
import { FamilyTreeNode, Person } from '../FamilyTree.types'

interface PersonNodeProps {
  node: FamilyTreeNode
  onToggleCollapse: (id: string) => void
}

export const PersonNode: React.FC<PersonNodeProps> = ({
  node,
  onToggleCollapse,
}) => {
  const { person, isCollapsed } = node

  const getDisplayName = (p: Person) => {
    return `${p.firstName} ${p.lastName}`
  }

  const getLifespan = (p: Person) => {
    const birth = p.birthDate ? p.birthDate.substring(0, 4) : '?'
    const death = p.deathDate ? p.deathDate.substring(0, 4) : ''
    return death ? `${birth}-${death}` : birth
  }

  const handleClick = () => {
    if (node.children.length > 0) {
      onToggleCollapse(person.id)
    }
  }

  // Styles de base pour le nœud
  const nodeStyle: React.CSSProperties = {
    cursor: node.children.length > 0 ? 'pointer' : 'default',
    fill: person.gender === 'male' ? '#D1E5F7' : '#FFE0E6',
    stroke: '#333',
    strokeWidth: 1,
  }

  return (
    <g transform={`translate(${node.x},${node.y})`} onClick={handleClick}>
      {/* Rectangle du nœud */}
      <rect
        x={0}
        y={0}
        width={node.width}
        height={60}
        rx={5}
        ry={5}
        style={nodeStyle}
      />

      {/* Nom */}
      <text
        x={node.width! / 2}
        y={20}
        textAnchor="middle"
        style={{ fontWeight: 'bold' }}
      >
        {getDisplayName(person)}
      </text>

      {/* Dates */}
      <text x={node.width! / 2} y={40} textAnchor="middle" fontSize="12">
        {getLifespan(person)}
      </text>

      {/* Indicateur de repli/dépli si le nœud a des enfants */}
      {node.children.length > 0 && (
        <text
          x={node.width! - 10}
          y={15}
          textAnchor="middle"
          fontSize="16"
          fontWeight="bold"
        >
          {isCollapsed ? '+' : '-'}
        </text>
      )}
    </g>
  )
}
