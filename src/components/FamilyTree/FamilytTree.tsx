import React, { useState, useEffect, useRef } from 'react'
import { FamilyTreeProps, FamilyTreeNode, Person } from './FamilyTree.types'
import { buildPeopleMap, findRoot, buildTree } from './FamilyTree.utils'
import { PersonNode } from './elements'
import { ZoomControls } from '../ZoomControls'
import * as d3 from 'd3'

const INITIAL_WIDTH = 1625
const INITIAL_HEIGHT = 750

export const FamilyTree: React.FC<FamilyTreeProps> = ({
  data,
  rootId,
  nodeWidth = 60,
  nodeHeight = 60,
  horizontalGap = 30,
  selectPersonFunc,
  highlightedNodes = [],
  shouldFocusOnNodes = false,
  shouldResetZoom = false,
  onZoomActionComplete = () => {},
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  // const [dimensions, setDimensions] = useState({
  //   width: INITIAL_WIDTH,
  //   height: INITIAL_HEIGHT,
  // })
  const [treeData, setTreeData] =
    useState<d3.HierarchyNode<FamilyTreeNode> | null>(null)
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity)
  const zoomBehaviorRef = useRef<any>(null)

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
    const d3hierarchy = d3.hierarchy<FamilyTreeNode>(rootNode, (node) =>
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
    const layoutedTree = treeLayout(d3hierarchy)

    setTreeData(layoutedTree)

    // Calculer les dimensions nécessaires pour le SVG
    // calculateTreeDimensions(layoutedTree)

    // Initialiser le zoom
    initializeZoom()
  }, [data, rootId])

  // Initialisation du zoom
  const initializeZoom = () => {
    if (!svgRef.current) return

    const svg = d3
      .select(svgRef.current)
      .style('user-select', 'none')
      .attr('preserveAspectRatio', 'xMidYMid meet')

    const d3zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        setTransform(event.transform)
      })

    // Stocker le comportement de zoom pour y accéder plus tard
    zoomBehaviorRef.current = d3zoom

    svg.call(d3zoom)

    // Centrer l'arbre initialement
    const initialTransform = d3.zoomIdentity
      .translate(INITIAL_WIDTH / 2, INITIAL_HEIGHT / 4)
      .scale(0.8)

    svg.call(d3zoom.transform, initialTransform)
  }

  //
  //---------------------------------------------------------------------------------
  //
  // Effet pour gérer le zoom sur les nœuds en surbrillance
  useEffect(() => {
    if (
      shouldFocusOnNodes &&
      treeData &&
      svgRef.current &&
      highlightedNodes.length > 0
    ) {
      focusOnNodes(highlightedNodes)
      // Indiquer que l'action a été exécutée
      onZoomActionComplete()
    }
  }, [shouldFocusOnNodes, highlightedNodes, treeData])

  //
  //---------------------------------------------------------------------------------
  //
  // Effet pour gérer la réinitialisation du zoom
  useEffect(() => {
    if (shouldResetZoom && svgRef.current) {
      resetZoom()
      // Indiquer que l'action a été exécutée
      onZoomActionComplete()
    }
  }, [shouldResetZoom])

  //
  //---------------------------------------------------------------------------------
  //
  // Fonction pour centrer et zoomer sur les nœuds spécifiques
  const focusOnNodes = (nodeIds: string[]) => {
    if (!treeData || !svgRef.current || nodeIds.length === 0) return

    // Trouver les nœuds correspondants
    const matchingNodes = treeData
      .descendants()
      .filter(
        (node) =>
          nodeIds.includes(node.data.person.id) ||
          (node.data.partner && nodeIds.includes(node.data.partner.id))
      )

    if (matchingNodes.length === 0) return

    // Calculer les limites des nœuds correspondants
    const padding = 50 // Espace supplémentaire autour des nœuds
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    matchingNodes.forEach((node) => {
      // Position du nœud principal
      minX = Math.min(minX, node.x! - nodeWidth / 2)
      minY = Math.min(minY, node.y! - nodeHeight / 2)
      maxX = Math.max(maxX, node.x! + nodeWidth / 2)
      maxY = Math.max(maxY, node.y! + nodeHeight / 2)

      // Si le nœud a un partenaire, inclure sa position aussi
      if (node.data.partner) {
        minX = Math.min(minX, node.x! + nodeWidth / 2 + horizontalGap)
        maxX = Math.max(
          maxX,
          node.x! + nodeWidth / 2 + horizontalGap + nodeWidth
        )
      }
    })

    // Ajouter le padding
    minX -= padding
    minY -= padding
    maxX += padding
    maxY += padding

    // Calculer les dimensions de la boîte englobante
    const width = maxX - minX
    const height = maxY - minY

    // Calculer le centre de la boîte
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    // Calculer le facteur de zoom pour afficher tous les nœuds
    const svgWidth = INITIAL_WIDTH
    const svgHeight = INITIAL_HEIGHT
    const scaleX = svgWidth / width
    const scaleY = svgHeight / height
    const scale = Math.min(Math.min(scaleX, scaleY), 1.5) // Limitation du zoom max

    // Appliquer la transformation
    const svg = d3.select(svgRef.current)
    const zoomInstance = zoomBehaviorRef.current

    if (zoomInstance) {
      // Calculer la transformation pour centrer sur la boîte
      const newTransform = d3.zoomIdentity
        .translate(svgWidth / 2, svgHeight / 2)
        .scale(scale)
        .translate(-centerX, -centerY)

      // Animation fluide du zoom .transition().duration(750)
      svg.call(zoomInstance.transform, newTransform)
    }
  }

  //
  //---------------------------------------------------------------------------------
  //
  const applyResetTransform = () => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const zoomInstance = zoomBehaviorRef.current

    if (zoomInstance) {
      // Création d'une transformation qui centre l'arbre
      const newTransform = d3.zoomIdentity
        .translate(INITIAL_WIDTH / 2, INITIAL_HEIGHT / 4)
        .scale(0.8)
      // .translate(-centerTreeX, -centerTreeY)

      // Application de la transformation
      svg.call(zoomInstance.transform, newTransform)

      // Mise à jour explicite de l'état React
      setTransform(newTransform)
    }
  }

  //
  //---------------------------------------------------------------------------------
  //
  //Fonction pour réinitialiser le zoom
  const resetZoom = () => {
    applyResetTransform()
  }

  //
  //---------------------------------------------------------------------------------
  //
  // Calcul des dimensions de l'arbre
  // const calculateTreeDimensions = (tree: d3.HierarchyNode<FamilyTreeNode>) => {
  //   if (!tree) return

  //   let minX = Infinity,
  //     minY = Infinity
  //   let maxX = -Infinity,
  //     maxY = -Infinity

  //   tree.each((node) => {
  //     // Pour chaque nœud, calculer ses limites
  //     minX = Math.min(minX, node.x! - nodeWidth)
  //     minY = Math.min(minY, node.y! - nodeHeight)
  //     maxX = Math.max(maxX, node.x! + nodeWidth)
  //     maxY = Math.max(maxY, node.y! + nodeHeight)

  //     // Si le nœud a un partenaire, ajouter de l'espace
  //     if (node.data.partner) {
  //       maxX = Math.max(maxX, node.x! + 2 * nodeWidth + horizontalGap)
  //     }
  //   })

  //   const firstGroup = d3.select(svgRef.current).select('g').node()
  //   if (!firstGroup) return { width: 0, height: 0 }
  //   const bbox = (firstGroup as SVGGElement).getBBox()
  //   // Ajouter une marge
  //   const margin = 200
  //   setDimensions({
  //     width: Math.max(INITIAL_WIDTH, bbox.width),
  //     height: Math.max(INITIAL_HEIGHT, bbox.height),
  //   })
  // }

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
    const d3hierarchy = d3.hierarchy<FamilyTreeNode>(updatedRoot, (node) =>
      node.isCollapsed ? [] : node.children
    )

    // Configurer le layout
    const treeLayout = d3
      .tree<FamilyTreeNode>()
      .nodeSize([nodeWidth * 1.5, nodeHeight * 2.5])

    // Appliquer le layout avec une animation
    const layoutedTree = treeLayout(d3hierarchy)

    setTreeData(layoutedTree)
    // calculateTreeDimensions(layoutedTree)
  }

  // Highlights avec la recherche
  useEffect(() => {
    if (!svgRef.current) return

    if (highlightedNodes.length === 0) {
      // Réinitialiser tous les nœuds à une opacité normale (1)
      d3.select(svgRef.current).selectAll('.person-node').attr('opacity', 1)
      return
    }

    // Réduire l'opacité de tous les nœuds
    d3.select(svgRef.current).selectAll('.person-node').attr('opacity', 0.2)

    // Rétablir l'opacité normale pour les nœuds correspondants uniquement
    d3.select(svgRef.current)
      .selectAll('.person-node')
      .each(function (d: any) {
        if (highlightedNodes.includes(d.person.id)) {
          d3.select(this).attr('opacity', 1)
        }
      })
  }, [highlightedNodes])

  // Générer les liens entre parents et enfants
  const generateParentChildLinks = () => {
    if (!treeData) return null

    const orthogonalLink = (d: any) => {
      const sourceX = d.source.x
      const sourceY = d.source.y
      const targetX = d.target.x
      const targetY = d.target.y

      // Calculer le point intermédiaire (à mi-chemin entre source et cible sur l'axe Y)
      const midY = sourceY + (targetY - sourceY) / 2

      return `
        M${sourceX},${sourceY}
        V${midY}
        H${targetX}
        V${targetY}
      `
    }

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

      const path = orthogonalLink({ source, target })

      return (
        <path
          key={`link-${link.source.data.person.id}-${link.target.data.person.id}`}
          d={path || ''}
          fill="none"
          stroke="#666"
          strokeWidth={1.5}
          strokeOpacity={0.7}
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
      const endX = node.x! + nodeWidth / 2 + horizontalGap
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
    selectPersonFunc(person)
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
          <PersonNode
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
            <PersonNode
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

  // Rendu du composant
  return (
    <div style={{ position: 'relative', width: '100%', height: '700px' }}>
      <svg ref={svgRef} width="100%" height="100%">
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
      <ZoomControls
        svgRef={svgRef}
        transform={transform}
        setTransform={setTransform}
        resetZoomFunc={resetZoom}
      />
    </div>
  )
}
