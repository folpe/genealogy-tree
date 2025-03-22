// FamilyTree.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { FamilyTreeProps, FamilyTreeNode } from './FamilyTree.types'
import {
  buildPeopleMap,
  findRoot,
  buildTree,
  layoutTree,
} from './FamilyTree.utils'
import { PersonNode, PartnerLink, ParentChildLink } from './elements'

export const FamilyTree: React.FC<FamilyTreeProps> = ({
  data,
  rootId,
  nodeWidth = 120,
  nodeHeight = 80,
  horizontalGap = 40,
  verticalGap = 100,
}) => {
  const [treeData, setTreeData] = useState<FamilyTreeNode | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Mémoiser la carte des personnes
  const peopleMap = useMemo(() => buildPeopleMap(data), [data])

  // Construire l'arbre initial
  useEffect(() => {
    let rootPerson

    if (rootId && peopleMap[rootId]) {
      rootPerson = peopleMap[rootId]
    } else {
      rootPerson = findRoot(data)
    }

    if (!rootPerson) return

    const tree = buildTree(rootPerson, peopleMap)
    layoutTree(
      tree,
      dimensions.width / 2,
      50,
      nodeWidth,
      nodeHeight,
      horizontalGap,
      verticalGap
    )
    setTreeData(tree)
  }, [
    data,
    rootId,
    peopleMap,
    dimensions.width,
    nodeWidth,
    nodeHeight,
    horizontalGap,
    verticalGap,
  ])

  // Gérer le repliage/dépliage des nœuds
  const handleToggleCollapse = (id: string) => {
    if (!treeData) return

    // Fonction récursive pour trouver et mettre à jour le nœud
    const updateNode = (node: FamilyTreeNode): FamilyTreeNode => {
      if (node.person.id === id) {
        return { ...node, isCollapsed: !node.isCollapsed }
      }

      return {
        ...node,
        children: node.children.map((child) => updateNode(child)),
      }
    }

    const updatedTree = updateNode(treeData)
    layoutTree(
      updatedTree,
      dimensions.width / 2,
      50,
      nodeWidth,
      nodeHeight,
      horizontalGap,
      verticalGap
    )
    setTreeData(updatedTree)
  }

  // Rendu récursif de l'arbre
  const renderTree = (node: FamilyTreeNode) => {
    return (
      <React.Fragment key={node.person.id}>
        {/* Liens parent-enfant */}
        {!node.isCollapsed &&
          node.children.map((child) => (
            <ParentChildLink
              key={`link-${node.person.id}-${child.person.id}`}
              parent={node}
              child={child}
            />
          ))}

        {/* Nœud de la personne */}
        <PersonNode node={node} onToggleCollapse={handleToggleCollapse} />

        {/* Lien avec le partenaire */}
        {node.partner && <PartnerLink source={node} />}

        {/* Récursion sur les enfants si non replié */}
        {!node.isCollapsed && node.children.map((child) => renderTree(child))}
      </React.Fragment>
    )
  }

  // Calculer la taille totale requise pour l'arbre
  useEffect(() => {
    if (!treeData) return

    let minX = Infinity,
      minY = Infinity
    let maxX = -Infinity,
      maxY = -Infinity

    // Fonction récursive pour trouver les limites
    const findBounds = (node: FamilyTreeNode) => {
      minX = Math.min(minX, node.x || 0)
      minY = Math.min(minY, node.y || 0)
      maxX = Math.max(maxX, (node.x || 0) + (node.width || 0))
      maxY = Math.max(maxY, (node.y || 0) + nodeHeight)

      node.children.forEach((child) => findBounds(child))
    }

    findBounds(treeData)

    // Ajouter une marge
    const margin = 50
    setDimensions({
      width: maxX - minX + margin * 2,
      height: maxY - minY + margin * 2,
    })
  }, [treeData, nodeHeight])

  if (!treeData) {
    return <div>Chargement...</div>
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
    >
      {/* Groupe pour les liens */}
      <g className="links">{renderTree(treeData)}</g>
    </svg>
  )
}
