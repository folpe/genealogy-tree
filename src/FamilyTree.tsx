import React, { useEffect, useRef, useState } from 'react'
import { tree, select, hierarchy, zoom, zoomIdentity } from 'd3'
import { familyTree, Person } from '../public/data/familyData'
import {
  TreeNode,
  calculateAge,
  createHierarchy,
  deepCopy,
  findNodeById,
} from './FamilyTree.helpers'
import PersonCard from './PersonCard'
import SynthesisCard from './SynthesisCard'

// Composant pour les contrôles de zoom
const ZoomControls = ({ svgRef }) => {
  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = select(svgRef.current)
      const zoomBehavior = zoom().on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform)
      })

      svg.transition().duration(750).call(zoomBehavior.scaleBy, 1.2)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = select(svgRef.current)
      const zoomBehavior = zoom().on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform)
      })

      svg.transition().duration(750).call(zoomBehavior.scaleBy, 0.8)
    }
  }

  const handleReset = () => {
    if (svgRef.current) {
      const svg = select(svgRef.current)
      const zoomBehavior = zoom().on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform)
      })

      svg
        .transition()
        .duration(750)
        .call(zoomBehavior.transform, zoomIdentity.translate(100, 50))
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
        onClick={handleZoomIn}
        title="Zoom in"
      >
        +
      </button>
      <button
        className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
        onClick={handleZoomOut}
        title="Zoom out"
      >
        -
      </button>
      <button
        className="px-2 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
        onClick={handleReset}
        title="Reset view"
      >
        Reset
      </button>
    </div>
  )
}

// Composant principal FamilyTree
export const FamilyTree = () => {
  const svgRef = useRef(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [treeRoot, setTreeRoot] = useState<TreeNode | null>(null)

  // Constantes pour la taille et l'espacement
  const NODE_RADIUS = 20
  const PARTNER_DISTANCE = 60
  const NODE_SPACING_H = 50
  const NODE_SPACING_V = 130

  // Fonction pour basculer les enfants d'un nœud spécifique (plier/déplier)
  const toggleChildren = (nodeId: string) => {
    // Créer une copie profonde de l'arbre
    const newRoot = deepCopy(treeRoot)

    // Fonction récursive pour trouver et modifier uniquement le nœud spécifique
    const toggleNode = (node: TreeNode): boolean => {
      if (node.id === nodeId) {
        if (node.children && node.children.length > 0) {
          node._children = [...node.children]
          node.children = []
        } else if (node._children && node._children.length > 0) {
          node.children = [...node._children]
          node._children = []
        }
        return true
      }

      // Chercher récursivement dans les enfants visibles
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          if (toggleNode(node.children[i])) {
            return true
          }
        }
      }

      // Chercher récursivement dans les enfants cachés
      if (node._children) {
        for (let i = 0; i < node._children.length; i++) {
          if (toggleNode(node._children[i])) {
            return true
          }
        }
      }

      return false
    }

    // Appliquer le toggle sur le nœud spécifique
    toggleNode(newRoot)

    // Mettre à jour l'état et redessiner
    setTreeRoot(newRoot)
    renderTree(newRoot)
  }

  // Rendu de l'arbre
  const renderTree = (rootData: TreeNode) => {
    if (!svgRef.current) return

    // Nettoyer le SVG existant
    select(svgRef.current).selectAll('*').remove()

    // Dimensions et marges
    const margin = { top: 50, right: 120, bottom: 50, left: 120 }
    const width = 1200 - margin.left - margin.right
    const height = 800 - margin.top - margin.bottom

    // Créer le conteneur SVG principal
    const svg = select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // Ajouter un groupe qui sera zoomable
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Ajouter le comportement de zoom
    const zoomBehavior = zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
      .filter((event) => {
        // Désactiver le zoom par double-clic
        if (event.type === 'dblclick') {
          event.stopImmediatePropagation()
          return false
        }
        // Autoriser le zoom avec autres interactions (molette, drag)
        return !event.ctrlKey && !event.button
      })

    // Appliquer le zoom au SVG
    svg.call(zoomBehavior)

    // Créer la hiérarchie à partir des données
    const root = hierarchy(rootData)

    // Ajuster le layout d'arbre - orientation verticale
    const treeLayout = tree()
      .nodeSize([NODE_SPACING_H, NODE_SPACING_V])
      .separation((a, b) => {
        return a.parent === b.parent ? 1.2 : 1.4
      })

    // Calculer les positions
    const treeData = treeLayout(root)

    // Fonction simplifiée pour générer des chemins pour les liens
    const generatePath = (d) => {
      const sourceX = d.source.x
      const sourceY = d.source.y
      const targetX = d.target.x
      const targetY = d.target.y

      // Position de départ du lien
      let startX = sourceX

      // Si c'est un enfant d'une autre union, le lien part d'un parent spécifique
      if (d.target.data.isFromOtherUnion && d.target.data.parentId) {
        const partnerId = d.source.data.partner?.id
        if (d.target.data.parentId === partnerId) {
          startX = sourceX + PARTNER_DISTANCE
        }
      } else if (d.source.data.partner) {
        // Pour les enfants communs, partir du milieu entre les partenaires
        startX = sourceX + PARTNER_DISTANCE / 2
      }

      // Chemin simple en forme de Γ inversé
      return `M${startX},${sourceY} V${
        (sourceY + targetY) / 2
      } H${targetX} V${targetY}`
    }

    // Ajouter les liens
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', (d) =>
        d.target.data.isFromOtherUnion ? '5,5' : null
      )
      .attr('d', generatePath)

    // Créer les nœuds
    const nodes = g
      .selectAll('.node')
      .data(treeData.descendants().filter((d) => d.data.id !== 'root'))
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)

    // Ajouter cercles pour les nœuds
    nodes
      .append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', (d) => (d.data.gender === 'male' ? '#6495ED' : '#FF69B4'))
      .attr('stroke', (d) => (d.data.isAlive ? 'green' : 'black'))
      .attr('stroke-width', 2)
      .attr('opacity', (d) => (d.data.isAlive ? 1 : 0.2))
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedPerson(d.data.data)
      })
      .on('dblclick', (event, d) => {
        event.preventDefault()
        event.stopPropagation()
        toggleChildren(d.data.id)
      })

    // Ajouter des initiales dans les cercles
    nodes
      .append('text')
      .attr('dy', '.3em')
      .attr('text-anchor', 'middle')
      .text((d) => {
        if (d.data.data) {
          const firstName = d.data.data.firstName || ''
          const lastName = d.data.data.lastName || ''
          return `${firstName.charAt(0)}${lastName.charAt(0)}`
        }
        return ''
      })
      .attr('fill', 'white')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')

    // Ajouter des étiquettes pour les noms (nom et prénom séparés)
    // Nom de famille
    nodes
      .append('text')
      .attr('dy', NODE_RADIUS + 15)
      .attr('text-anchor', 'middle')
      .text((d) => (d.data.data ? d.data.data.lastName : ''))
      .attr('fill', 'black')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')

    // Prénom
    nodes
      .append('text')
      .attr('dy', NODE_RADIUS + 25)
      .attr('text-anchor', 'middle')
      .text((d) => (d.data.data ? d.data.data.firstName : ''))
      .attr('fill', 'black')
      .style('font-size', '9px')
      .style('pointer-events', 'none')

    // Ajouter les couples côte à côte
    treeData
      .descendants()
      .filter((node) => node.data.partner && node.data.id !== 'root')
      .forEach((node) => {
        // Créer un groupe pour le partenaire et ses éléments
        const partnerGroup = g
          .append('g')
          .attr('class', 'partner-group')
          .attr(
            'transform',
            `translate(${node.x + PARTNER_DISTANCE},${node.y})`
          )

        // Ligne de connexion horizontale entre partenaires
        g.append('line')
          .attr('x1', node.x + NODE_RADIUS)
          .attr('y1', node.y)
          .attr('x2', node.x + PARTNER_DISTANCE / 1.5)
          .attr('y2', node.y)
          .attr('stroke', 'green')
          .attr('stroke-width', 2)

        // Cercle pour le partenaire
        partnerGroup
          .append('circle')
          .attr('r', NODE_RADIUS)
          .attr(
            'fill',
            node.data.partner.gender === 'male' ? '#6495ED' : '#FF69B4'
          )
          .attr('stroke', node.data.partner.deathDate ? 'black' : 'green')
          .attr('stroke-width', 2)
          .attr('opacity', node.data.partner.deathDate ? 0.2 : 1)
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.stopPropagation()
            setSelectedPerson(node.data.partner)
          })
          .on('dblclick', (event) => {
            event.preventDefault()
            event.stopPropagation()
          })

        // Initiales pour le partenaire
        partnerGroup
          .append('text')
          .attr('dy', '.3em')
          .attr('text-anchor', 'middle')
          .text(() => {
            if (node.data.partner) {
              const firstName = node.data.partner.firstName || ''
              const lastName = node.data.partner.lastName || ''
              return `${firstName.charAt(0)}${lastName.charAt(0)}`
            }
            return ''
          })
          .attr('fill', 'white')
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')

        // Nom de famille du partenaire
        partnerGroup
          .append('text')
          .attr('dy', NODE_RADIUS + 15)
          .attr('text-anchor', 'middle')
          .text(node.data.partner ? node.data.partner.lastName : '')
          .attr('fill', 'black')
          .style('font-size', '9px')
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')

        // Prénom du partenaire
        partnerGroup
          .append('text')
          .attr('dy', NODE_RADIUS + 25)
          .attr('text-anchor', 'middle')
          .text(node.data.partner ? node.data.partner.firstName : '')
          .attr('fill', 'black')
          .style('font-size', '9px')
          .style('pointer-events', 'none')
      })

    // Centrer initialement l'arbre dans la vue
    const initialTransform = zoomIdentity.translate(width / 2, 50)
    svg.call(zoomBehavior.transform, initialTransform)
  }

  // Initialisation de l'arbre
  useEffect(() => {
    const hierarchyData = createHierarchy(
      familyTree,
      'Arbre Généalogique Familial'
    )
    setTreeRoot(hierarchyData)
    renderTree(hierarchyData)
  }, [])

  return (
    <div className="flex flex-col w-full p-4">
      <div className="w-full p-4">
        <h1 className="text-2xl font-bold mb-6">Arbre Généalogique Familial</h1>

        <div className="relative w-full h-[600px] border border-gray-300 rounded-lg overflow-hidden">
          <p className="absolute bottom-2 right-2 text-sm text-gray-500">
            Utilisez la souris pour déplacer et zoomer (molette)
          </p>
          <svg ref={svgRef} className="w-full h-full" />
        </div>
      </div>

      <div className="flex align-center justify-center p-4 w-full">
        {!selectedPerson && <SynthesisCard people={familyTree} />}
        {selectedPerson && (
          <PersonCard
            closeCardFunc={() => setSelectedPerson(null)}
            selectedPerson={selectedPerson}
          />
        )}
      </div>
    </div>
  )
}
