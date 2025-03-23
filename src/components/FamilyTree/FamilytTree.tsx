import React, { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { FamilyTreeProps, FamilyTreeNode, Person } from './FamilyTree.types'
import { buildPeopleMap, findRoot, buildTree } from './FamilyTree.utils'
import { PersonNodeD3 } from './elements/PersonNodeD3'
import { PersonCard } from '../PersonCard'

export const FamilyTree: React.FC<FamilyTreeProps> = ({
  data,
  rootId,
  nodeWidth = 60,
  nodeHeight = 60,
  horizontalGap = 30,
  verticalGap = 120,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 })
  const [treeData, setTreeData] =
    useState<d3.HierarchyNode<FamilyTreeNode> | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [showPersonCard, setShowPersonCard] = useState<boolean>(false)

  // Construire l'arbre initial
  useEffect(() => {
    if (!data.length) return

    // Créer la carte des personnes
    const peopleMap = buildPeopleMap(data)

    // Trouver la racine
    let rootPerson: Person | undefined
    if (rootId && peopleMap[rootId]) {
      rootPerson = peopleMap[rootId]
    } else {
      rootPerson = findRoot(data)
    }

    if (!rootPerson) return

    // Construire l'arbre
    const rootNode = buildTree(rootPerson, peopleMap)

    // Créer la hiérarchie D3
    const hierarchy = d3.hierarchy<FamilyTreeNode>(rootNode, (node) =>
      node.isCollapsed ? [] : node.children
    )

    // Configurer le layout
    const treeLayout = d3
      .tree<FamilyTreeNode>()
      .nodeSize([nodeWidth * 1.5, nodeHeight * 2.5])
      .separation((a, b) => {
        // Ajouter un espace supplémentaire pour les nœuds avec des partenaires
        return (a.data.partner ? 2 : 1) + (b.data.partner ? 2 : 1)
      })

    // Appliquer le layout
    const layoutedTree = treeLayout(hierarchy)

    setTreeData(layoutedTree)

    // Calculer les dimensions nécessaires pour le SVG
    calculateTreeDimensions(layoutedTree)

    // Initialiser le zoom
    initializeZoom()
  }, [data, rootId])

  // Gestionnaire de mise à jour du zoom
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity)

  // Initialisation du zoom
  const initializeZoom = () => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        setTransform(event.transform)
      })

    svg.call(zoom)

    // Centrer l'arbre initialement
    const initialTransform = d3.zoomIdentity
      .translate(dimensions.width / 3, 100)
      .scale(0.8)

    svg.call(zoom.transform, initialTransform)
  }

  // Calcul des dimensions de l'arbre
  const calculateTreeDimensions = (tree: d3.HierarchyNode<FamilyTreeNode>) => {
    if (!tree) return

    let minX = Infinity,
      minY = Infinity
    let maxX = -Infinity,
      maxY = -Infinity

    tree.each((node) => {
      // Pour chaque nœud, calculer ses limites
      minX = Math.min(minX, node.x! - nodeWidth)
      minY = Math.min(minY, node.y! - nodeHeight)
      maxX = Math.max(maxX, node.x! + nodeWidth)
      maxY = Math.max(maxY, node.y! + nodeHeight)

      // Si le nœud a un partenaire, ajouter de l'espace
      if (node.data.partner) {
        maxX = Math.max(maxX, node.x! + 2 * nodeWidth + horizontalGap)
      }
    })

    // Ajouter une marge
    const margin = 200
    setDimensions({
      width: Math.max(1000, maxX - minX + margin * 2),
      height: Math.max(800, maxY - minY + margin * 2),
    })
  }

  // Gestion du repliage/dépliage d'un nœud
  const handleToggleCollapse = (id: string) => {
    if (!treeData) return

    // Fonction pour mettre à jour de manière récursive
    const updateNodeCollapse = (node: FamilyTreeNode): FamilyTreeNode => {
      if (node.person.id === id) {
        return { ...node, isCollapsed: !node.isCollapsed }
      }

      return {
        ...node,
        children: node.children.map((child) => updateNodeCollapse(child)),
      }
    }

    // Mettre à jour la racine
    const updatedRoot = updateNodeCollapse(treeData.data)

    // Créer une nouvelle hiérarchie
    const hierarchy = d3.hierarchy<FamilyTreeNode>(updatedRoot, (node) =>
      node.isCollapsed ? [] : node.children
    )

    // Configurer le layout
    const treeLayout = d3
      .tree<FamilyTreeNode>()
      .nodeSize([nodeWidth * 1.5, nodeHeight * 2.5])
      .separation((a, b) => {
        return (a.data.partner ? 2 : 1) + (b.data.partner ? 2 : 1)
      })

    // Appliquer le layout avec une animation
    const layoutedTree = treeLayout(hierarchy)

    setTreeData(layoutedTree)
    calculateTreeDimensions(layoutedTree)
  }

  // Générer les liens entre parents et enfants
  const generateParentChildLinks = () => {
    if (!treeData) return null

    // Générateur de liens
    const linkGenerator = d3
      .linkVertical<any, any>()
      .x((d: any) => d.x)
      .y((d: any) => d.y)

    // Créer les liens
    return treeData.links().map((link) => {
      const source = {
        x: link.source.x,
        y: link.source.y! + nodeHeight / 2,
      }

      const target = {
        x: link.target.x,
        y: link.target.y! - nodeHeight / 2,
      }

      const path = linkGenerator({ source, target })

      return (
        <path
          key={`link-${link.source.data.person.id}-${link.target.data.person.id}`}
          d={path || ''}
          fill="none"
          stroke="#666"
          strokeWidth={1.5}
          strokeOpacity={0.7}
          markerEnd="url(#arrowhead)"
        />
      )
    })
  }

  // Générer les liens entre partenaires
  const generatePartnerLinks = () => {
    if (!treeData) return null

    // Filtrer les nœuds avec des partenaires
    const nodesWithPartners = treeData
      .descendants()
      .filter((node) => node.data.partner)

    return nodesWithPartners.map((node) => {
      const startX = node.x! + nodeWidth / 2
      const startY = node.y
      const endX = node.x! + nodeWidth + horizontalGap + nodeWidth / 2
      const endY = node.y

      return (
        <g key={`partner-link-${node.data.person.id}`}>
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#D8315B"
            strokeWidth={2}
            strokeDasharray="5,3"
            strokeOpacity={0.7}
          />
          {/* Symbole de mariage au milieu */}
          <circle
            cx={(startX + endX) / 2}
            cy={(startY! + endY!) / 2}
            r={5}
            fill="#D8315B"
            fillOpacity={0.7}
          />
        </g>
      )
    })
  }

  // Gérer le clic sur une personne
  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person)
    setShowPersonCard(true)
  }

  // Générer les nœuds de personnes
  const generatePersonNodes = () => {
    if (!treeData) return null

    const allNodes = treeData.descendants().flatMap((node) => {
      // Créer un tableau avec le nœud principal
      const nodes = [
        <g
          key={`node-${node.data.person.id}`}
          transform={`translate(${node.x! - nodeWidth / 2}, ${node.y! - nodeHeight / 2})`}
          onClick={() => handlePersonClick(node.data.person)}
        >
          <PersonNodeD3
            node={node.data}
            width={nodeWidth}
            height={nodeHeight}
            onToggleCollapse={handleToggleCollapse}
          />
        </g>,
      ]

      // Ajouter le nœud du partenaire s'il existe
      if (node.data.partner) {
        nodes.push(
          <g
            key={`node-partner-${node.data.partner.id}`}
            transform={`translate(${node.x! + nodeWidth / 2 + horizontalGap}, ${node.y! - nodeHeight / 2})`}
            onClick={() => handlePersonClick(node.data.partner!)}
          >
            <PersonNodeD3
              node={{
                person: node.data.partner,
                children: [],
                width: nodeWidth,
                height: nodeHeight,
              }}
              width={nodeWidth}
              height={nodeHeight}
            />
          </g>
        )
      }

      return nodes
    })

    return allNodes
  }

  // Fermer la modal PersonCard
  const handleClosePersonCard = () => {
    setShowPersonCard(false)
  }

  // Rendu du composant
  return (
    <div style={{ position: 'relative', width: '100%', height: '700px' }}>
      <svg ref={svgRef} width="100%" height="100%">
        {/* <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs> */}
        <g transform={transform.toString()}>
          {/* Liens et nœuds */}
          <g className="links">
            {generateParentChildLinks()}
            {generatePartnerLinks()}
          </g>
          <g className="nodes">{generatePersonNodes()}</g>
        </g>
      </svg>

      {/* Contrôles de zoom */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          onClick={() => {
            if (!svgRef.current) return
            const svg = d3.select(svgRef.current)
            const zoom = d3
              .zoom<SVGSVGElement, unknown>()
              .on('zoom', (event) => {
                setTransform(event.transform)
              })
            svg
              .transition()
              .duration(750)
              .call(
                zoom.transform,
                d3.zoomIdentity
                  .scale(transform.k * 1.2)
                  .translate(transform.x / 1.2, transform.y / 1.2)
              )
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#333',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            if (!svgRef.current) return
            const svg = d3.select(svgRef.current)
            const zoom = d3
              .zoom<SVGSVGElement, unknown>()
              .on('zoom', (event) => {
                setTransform(event.transform)
              })
            svg
              .transition()
              .duration(750)
              .call(
                zoom.transform,
                d3.zoomIdentity
                  .scale(transform.k / 1.2)
                  .translate(transform.x * 1.2, transform.y * 1.2)
              )
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#333',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          -
        </button>
        <button
          onClick={() => {
            if (!svgRef.current) return
            const svg = d3.select(svgRef.current)
            const zoom = d3
              .zoom<SVGSVGElement, unknown>()
              .on('zoom', (event) => {
                setTransform(event.transform)
              })
            svg
              .transition()
              .duration(750)
              .call(
                zoom.transform,
                d3.zoomIdentity.translate(dimensions.width / 3, 100).scale(0.8)
              )
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#333',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          R
        </button>
      </div>

      {/* PersonCard */}
      {showPersonCard && selectedPerson && (
        <PersonCard
          people={data}
          selectedPerson={selectedPerson}
          closeCardFunc={handleClosePersonCard}
          selectPersonFunc={handlePersonClick}
        />
      )}
    </div>
  )
}
