import React, { useRef, useEffect } from 'react'
import { select } from 'd3'
import { FamilyTreeNode, Person } from '../FamilyTree.types'
import { useImagePreloader } from '../../../utils/useImagePreloader'

interface PersonNodeD3Props {
  node: FamilyTreeNode
  width: number
  height: number
  onToggleCollapse?: (id: string) => void
}

export const PersonNodeD3: React.FC<PersonNodeD3Props> = ({
  node,
  width = 70,
  height = 70,
  onToggleCollapse,
}) => {
  const { person, isCollapsed } = node
  const nodeRef = useRef<SVGGElement>(null)
  const { isLoaded } = useImagePreloader(person.photo)

  // Fonction pour récupérer le style en fonction du genre
  const getNodeStyle = (p: Person) => {
    switch (p.gender) {
      case 'male':
        return {
          fill: `${p.deathDate ? 'black' : 'var(--color-blue-400)'}`,
          stroke: '#4682B4',
          strokeWidth: 4,
          gradient: p.deathDate
            ? ['var(--color-gray-600)', 'var(--color-gray-800)']
            : ['var(--color-blue-400)', 'var(--color-blue-600)'],
        }
      case 'female':
        return {
          fill: `${p.deathDate ? 'black' : 'var(--color-pink-400)'}`,
          stroke: '#DB7093',
          strokeWidth: 4,
          gradient: p.deathDate
            ? ['var(--color-gray-600)', 'var(--color-gray-800)']
            : ['var(--color-pink-400)', 'var(--color-pink-600)'],
        }
      default:
        return {
          fill: '#E8E8E8',
          stroke: '#888',
          strokeWidth: 4,
          gradient: ['#E8E8E8', '#D0D0D0'],
        }
    }
  }

  // Effet pour ajouter les interactions D3
  useEffect(() => {
    if (!nodeRef.current) return

    const nodeSelection = select(nodeRef.current)

    // Ajouter effet de survol
    nodeSelection
      .on('mouseenter', function () {
        select(this)
          .transition()
          .duration(200)
          .attr('filter', 'url(#glow)')
          .select('rect')
          .attr('stroke-width', 3)
      })
      .on('mouseleave', function () {
        select(this)
          .transition()
          .duration(200)
          .attr('filter', null)
          .select('rect')
          .attr('stroke-width', nodeStyle.strokeWidth)
      })

    // Ajouter les événements de clic pour le repli/dépliage
    if (node.children && node.children.length > 0 && onToggleCollapse) {
      nodeSelection
        .select('.collapse-button')
        .style('cursor', 'pointer')
        .on('click', function (event) {
          event.stopPropagation()
          onToggleCollapse(person.id)
        })
    }
  }, [node, person.id, onToggleCollapse])

  const nodeStyle = getNodeStyle(person)
  const gradientId = `gradient-${person.id}`
  const hasPhoto = !!person.photo

  return (
    <g ref={nodeRef} className="person-node">
      {/* Définition du gradient */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={nodeStyle.gradient[0]} />
          <stop offset="100%" stopColor={nodeStyle.gradient[1]} />
        </linearGradient>

        {/* Filtre de lueur pour l'effet de survol */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Circle principal avec ombre */}
      <circle
        cx={width / 2}
        cy={width / 2}
        r={width / 2}
        // height={height}
        fill={`url(#${gradientId})`}
        stroke={nodeStyle.stroke}
        strokeWidth={nodeStyle.strokeWidth}
        filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.2))"
      />

      {/* Photo de la personne (si disponible) */}
      {hasPhoto && (
        <clipPath id={`clip-${person.id}`}>
          <circle cx={width / 2} cy={height / 2} r={28} />
        </clipPath>
      )}

      <text
        x={width / 2}
        y={height / 2 + 5}
        textAnchor={'middle'}
        fontWeight="bold"
        fontSize="18px"
        fill="#fff"
      >
        {person.firstName.charAt(0) + person.lastName.charAt(0)}
      </text>

      {hasPhoto && (
        <image
          href={person.photo}
          x={0}
          y={0}
          width={60}
          height={60}
          clipPath={`url(#clip-${person.id})`}
          opacity={isLoaded ? 1 : 0}
        >
          {isLoaded && (
            <animate
              attributeName="opacity"
              from="0"
              to="1"
              dur="2s"
              fill="freeze"
            />
          )}
        </image>
      )}

      {/* Nom */}
      <text
        x={width / 2}
        y={-20}
        textAnchor={'middle'}
        fontWeight="bold"
        fontSize="13px"
        fill="#fff"
      >
        {person.lastName}
      </text>

      {/* Prénom */}
      <text
        x={width / 2}
        y={-8}
        textAnchor={'middle'}
        fontSize="10px"
        fontStyle="italic"
        fill="#fff"
      >
        {person.firstName}
      </text>

      {/* Bouton de repli/dépliage si le nœud a des enfants */}
      {node.children && node.children.length > 0 && (
        <g className="collapse-button">
          <circle
            cx={width / 2}
            cy={height + 8}
            r={10}
            fill="white"
            stroke={nodeStyle.stroke}
            strokeWidth={1}
          />
          <text
            x={width / 2}
            y={height + 12}
            textAnchor="middle"
            fontSize="14px"
            fontWeight="bold"
            fill="#333"
          >
            {isCollapsed ? '+' : '-'}
          </text>
        </g>
      )}
    </g>
  )
}
