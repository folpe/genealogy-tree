import { useEffect, useRef, useState } from 'react'
import { tree, select, hierarchy, zoom, zoomIdentity } from 'd3'
import { Person } from '../public/data/familyData'
import {
  TreeNode,
  createHierarchy,
  deepCopy,
  getMatchingIds,
} from './FamilyTree.helpers'
import PersonCard from './PersonCard'
import SynthesisCard from './SynthesisCard'
import { SearchField } from './SearchField'
import { ZoomControls } from './ZoomControl'

// Composant principal FamilyTree
export const FamilyTree = () => {
  const svgRef = useRef(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [treeRoot, setTreeRoot] = useState<TreeNode | null>(null)
  const [highlightedNodes, setHighlightedNodes] = useState([])
  const [treeData, setTreeData] = useState(null)
  const [familyData, setFamilyData] = useState([])

  // Constantes pour la taille et l'espacement
  const NODE_RADIUS = 20
  const PARTNER_DISTANCE = 70
  const NODE_SPACING_H = 60
  const NODE_SPACING_V = 130

  const maleColor = '#6495ED' // Bleu éclatant (vivant)
  const femaleColor = '#FF69B4' // Rose vif (vivante)
  const malePaleColor = '#A0BCE6' // Bleu pâle/grisé (décédé)
  const femalePaleColor = '#F4B6C2' // Rose pâle/grisé (décédée)
  const strokeAlive = '#00C853' // Vert (vivant)
  const strokeDeceased = '#B0BEC5' // Gris doux (décédé)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/getNotionPeople`)
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données')
        }
        const jsonData = await response.json()
        setFamilyData(jsonData)
      } catch (err) {
        console.error(err.message)
      }
    }

    fetchData()
  }, [])

  // Fonction de recherche améliorée
  const handleSearch = (query: string) => {
    // Si la requête est vide, réinitialiser tout
    if (!query.trim()) {
      setHighlightedNodes([])

      // Réinitialiser tous les nœuds à leur apparence normale
      if (svgRef.current) {
        // Réinitialiser les cercles des nœuds principaux
        select(svgRef.current)
          .selectAll('.node circle')
          .attr('stroke-width', 2)
          .attr('stroke', (d: any) => (d.data.isAlive ? 'green' : 'black'))
          .attr('opacity', 1)

        // Réinitialiser les cercles des partenaires
        select(svgRef.current)
          .selectAll('.partner-group circle')
          .attr('stroke-width', 2)
          .attr('stroke', function () {
            // Récupérer la donnée associée à ce cercle
            const partnerCircle = select(this)
            const partnerData = partnerCircle.datum()
            return partnerData && partnerData.deathDate ? 'black' : 'green'
          })
          .attr('opacity', 1)
      }
      return
    }

    const matches = getMatchingIds(familyData, query)
    setHighlightedNodes(matches)
    // Appliquer immédiatement la surbrillance
    applyHighlights(matches)
  }

  // Fonction pour appliquer la surbrillance aux nœuds correspondants
  const applyHighlights = (matches) => {
    if (!svgRef.current || !matches.length) return

    // D'abord, réinitialiser tous les cercles
    // Cercles des nœuds principaux
    select(svgRef.current).selectAll('.node circle').attr('opacity', 0.2)

    // Cercles des partenaires
    select(svgRef.current)
      .selectAll('.partner-group circle')
      .attr('opacity', 0.2)

    // Mettre en surbrillance les nœuds principaux
    select(svgRef.current)
      .selectAll('.node')
      .each(function (d) {
        if (matches.includes(d.data.id)) {
          select(this).select('circle').attr('opacity', 1)
        }
      })

    // Mettre en surbrillance les partenaires
    // Pour chaque nœud principal
    select(svgRef.current)
      .selectAll('.partner-group')
      .each(function (data) {
        if (matches.includes((data as Person).id)) {
          select(this).select('circle').attr('opacity', 1)
        }
      })
  }

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

  // Fonction pour éviter le chevauchement des partenaires
  const preventPartnerOverlap = (nodes, partnerDistance) => {
    // Créer une liste temporaire incluant à la fois les nœuds et leurs partenaires
    const allPositions = []

    // Ajouter d'abord tous les nœuds principaux
    nodes.forEach((node) => {
      allPositions.push({
        id: node.data.id,
        x: node.x,
        y: node.y,
        hasPartner: !!node.data.partner,
        isPartner: false,
        node: node,
      })

      // Si ce nœud a un partenaire, ajouter aussi sa position
      if (node.data.partner) {
        allPositions.push({
          id: `partner-${node.data.id}`,
          x: node.x + partnerDistance,
          y: node.y,
          hasPartner: false,
          isPartner: true,
          mainNodeId: node.data.id,
          node: node,
        })
      }
    })

    // Trier par niveau (y) puis par position x
    allPositions.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })

    // Regrouper par niveau y
    const positionsByLevel = {}
    allPositions.forEach((pos) => {
      const y = pos.y
      if (!positionsByLevel[y]) {
        positionsByLevel[y] = []
      }
      positionsByLevel[y].push(pos)
    })

    // Pour chaque niveau, vérifier et ajuster les positions
    Object.keys(positionsByLevel).forEach((level) => {
      const positions = positionsByLevel[level]

      // Vérifier les chevauchements et ajuster
      for (let i = 0; i < positions.length - 1; i++) {
        const current = positions[i]
        const next = positions[i + 1]

        // Calculer l'espace minimal nécessaire
        const minSpace = NODE_RADIUS * 3 // Pour laisser un espace entre les cercles

        // Calculer l'espace actuel
        const actualSpace = next.x - current.x

        if (actualSpace < minSpace) {
          // Calculer le décalage nécessaire
          const offset = minSpace - actualSpace + 10 // 10 pixels d'espace supplémentaire

          // Appliquer le décalage à tous les nœuds suivants du même niveau
          for (let j = i + 1; j < positions.length; j++) {
            positions[j].x += offset
          }

          // Si le nœud décalé est un nœud principal, ajuster également sa position dans les données d'origine
          if (!next.isPartner) {
            next.node.x = next.x
          }
          // Si c'est un partenaire, nous n'avons pas besoin de mettre à jour sa position ici car elle sera recalculée plus tard
        }
      }
    })

    // Mettre à jour les positions des nœuds principaux
    // (les positions des partenaires seront calculées lors du rendu)
    nodes.forEach((node) => {
      const positionInfo = allPositions.find((p) => p.id === node.data.id)
      if (positionInfo) {
        node.x = positionInfo.x
      }
    })
  }

  // Rendu de l'arbre
  const renderTree = (rootData: TreeNode) => {
    if (!svgRef.current) return

    // Nettoyer le SVG existant
    select(svgRef.current).selectAll('*').remove()

    // Dimensions et marges
    const margin = { top: 50, right: 120, bottom: 50, left: 120 }
    const width = 1600 - margin.left - margin.right
    const height = 1000 - margin.top - margin.bottom

    // Créer le conteneur SVG principal
    const svg = select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // Ajouter un groupe qui sera zoomable
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const zoomHandler = (event) => {
      // Appliquer la transformation de zoom directement à l'élément g
      g.attr('transform', event.transform)
    }
    // Ajouter le comportement de zoom
    const zoomBehavior = zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', zoomHandler)
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
        // Séparation de base selon que les nœuds ont le même parent
        let baseSeparation = a.parent === b.parent ? 1.2 : 1.4

        // Augmenter la séparation si l'un des nœuds a un partenaire
        // et l'autre n'en a pas
        const aHasPartner = a.data.partner !== undefined
        const bHasPartner = b.data.partner !== undefined

        if (aHasPartner !== bHasPartner) {
          // Si l'un a un partenaire et l'autre non, augmenter la séparation
          baseSeparation += 0.8
        }

        // Si les deux ont des partenaires, s'assurer qu'ils sont suffisamment espacés
        if (aHasPartner && bHasPartner) {
          baseSeparation += 0.4
        }

        return baseSeparation
      })

    // Calculer les positions
    const treeDataResult = treeLayout(root)

    // Appliquer la fonction pour éviter les chevauchements
    preventPartnerOverlap(
      treeDataResult.descendants().filter((d) => d.data.id !== 'root'),
      PARTNER_DISTANCE
    )

    setTreeData(treeDataResult)

    // Fonction pour générer des chemins pour les liens
    const generatePath = (d) => {
      const sourceX = d.source.x
      const sourceY = d.source.y
      const targetX = d.target.x
      const targetY = d.target.y

      // Position de départ du lien
      let startX = sourceX

      // Si le lien provient du nœud racine (premier nœud invisible)
      if (d.source.data.id === 'root') {
        // Supprimer uniquement le segment vertical supérieur
        // Commencer directement à la position Y de la cible (au niveau du cercle)
        return `M${startX},${targetY} H${targetX}`
      }

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

      // Chemin normal en forme de Γ inversé pour les autres liens
      return `M${startX},${sourceY} V${
        (sourceY + targetY) / 2
      } H${targetX} V${targetY}`
    }

    // Ajouter les liens
    g.selectAll('.link')
      .data(treeDataResult.links())
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
      .data(treeDataResult.descendants().filter((d) => d.data.id !== 'root'))
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)

    // Ajouter cercles pour les nœuds
    nodes
      .append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', (d) => {
        if (d.data.deathDate) {
          return d.data.gender === 'male' ? malePaleColor : femalePaleColor
        }
        return d.data.gender === 'male' ? maleColor : femaleColor
      })
      .attr('stroke', (d) => (d.data.deathDate ? strokeDeceased : strokeAlive))
      .attr('stroke-width', 2)
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
    treeDataResult
      .descendants()
      .filter((node) => node.data.partner && node.data.id !== 'root')
      .forEach((node) => {
        // Créer un groupe pour le partenaire et ses éléments
        const partnerGroup = g
          .append('g')
          .datum(node.data.partner)
          .attr('class', 'partner-group')
          .attr(
            'transform',
            `translate(${node.x + PARTNER_DISTANCE},${node.y})`
          )

        // Ligne de connexion horizontale entre partenaires
        g.append('line')
          .attr('x1', node.x + NODE_RADIUS)
          .attr('y1', node.y)
          .attr('x2', node.x + PARTNER_DISTANCE - NODE_RADIUS)
          .attr('y2', node.y)
          .attr('stroke', 'green')
          .attr('stroke-width', 2)

        // Cercle pour le partenaire
        partnerGroup
          .append('circle')
          .attr('r', NODE_RADIUS)
          .attr('fill', () => {
            if (node.data.partner.deathDate) {
              return node.data.partner.gender === 'male'
                ? malePaleColor
                : femalePaleColor
            }
            return node.data.partner.gender === 'male' ? maleColor : femaleColor
          })
          .attr(
            'stroke',
            node.data.partner.deathDate ? strokeDeceased : strokeAlive
          )
          .attr('stroke-width', 2)
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
    const initialTransform = zoomIdentity.translate(
      width / 2 + 100,
      height / 2 - 250
    )

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left + width / 2},${margin.top})`)

    // Réappliquer la surbrillance si nécessaire
    if (highlightedNodes.length > 0) {
      applyHighlights(highlightedNodes)
    }
  }

  // Initialisation de l'arbre
  useEffect(() => {
    const hierarchyData = createHierarchy(
      familyData,
      'Arbre Généalogique Familial'
    )
    setTreeRoot(hierarchyData)
    renderTree(hierarchyData)
  }, [familyData])

  // Effet pour réagir aux changements des nœuds en surbrillance
  useEffect(() => {
    if (treeRoot && highlightedNodes.length > 0 && svgRef.current) {
      applyHighlights(highlightedNodes)
    }
  }, [highlightedNodes])

  return (
    <div className="flex flex-col w-full p-4">
      <div className="w-full p-4">
        <h1 className="text-2xl font-bold mb-6">Arbre Généalogique Familial</h1>

        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <SearchField onSearch={handleSearch} />
          <SynthesisCard people={familyData} />
          <ZoomControls svgRef={svgRef} />
        </div>

        <div className="relative w-full h-[1000px] border border-gray-300 rounded-lg overflow-hidden">
          <p className="absolute bottom-2 right-2 text-sm text-gray-500">
            Utilisez la souris pour déplacer et zoomer (molette)
          </p>
          {highlightedNodes.length > 0 && (
            <div className="absolute top-2 left-2 bg-yellow-100 p-2 rounded shadow-sm">
              <p className="text-sm">
                {highlightedNodes.length} résultat(s) trouvé(s)
              </p>
            </div>
          )}
          <svg ref={svgRef} className="w-full h-full" />
        </div>
      </div>

      <div className="flex align-center justify-center p-4 w-full">
        {selectedPerson && (
          <PersonCard
            people={familyData}
            closeCardFunc={() => setSelectedPerson(null)}
            selectedPerson={selectedPerson}
            selectPersonFunc={setSelectedPerson}
          />
        )}
      </div>
    </div>
  )
}
