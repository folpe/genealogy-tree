import { Person } from '../public/data/familyData'

// Interface pour les nœuds de l'arbre
export interface TreeNode {
  id: string
  name: string
  gender?: string
  isAlive?: boolean
  birthDate?: string
  deathDate?: string
  photo?: string
  data: Person | null
  partner?: Person
  children: TreeNode[]
  _children?: TreeNode[] // Nœuds enfants cachés (pour le repli)
  isFromOtherUnion?: boolean // Pour marquer les enfants d'une autre union
  parentId?: string // ID du parent dont l'enfant vient d'une autre union
}

// Trouver une personne par ID
export const findPersonById = (
  people: Person[],
  id: string
): Person | undefined => {
  return people.find((person) => person.id === id)
}

// // Calculer l'âge
// export const calculateAge = (birthDate: string, deathDate?: string): number => {
//   const birth = new Date(birthDate)
//   const end = deathDate ? new Date(deathDate) : new Date()

//   let age = end.getFullYear() - birth.getFullYear()
//   const monthDiff = end.getMonth() - birth.getMonth()

//   if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
//     age--
//   }

//   return age
// }

// Vérifier si une personne est un enfant de n'importe qui dans le tableau
export const isChildOfAnyone = (person: Person, people: Person[]): boolean => {
  return people.some((p) => p.childrenIds.includes(person.id))
}

// Créer un graphe hiérarchique à partir des données
export const createHierarchy = (
  people: Person[],
  treeName: string = 'Arbre Généalogique'
): TreeNode => {
  // Identifier les personnes qui ne sont pas des enfants (racines)
  const rootPeople = people.filter((person) => !isChildOfAnyone(person, people))

  // Ensemble pour suivre les personnes déjà traitées
  const processedIds = new Set<string>()

  // Créer un nœud racine pour l'arbre entier
  const rootNode: TreeNode = {
    id: 'root',
    name: treeName,
    data: null,
    children: [],
  }

  // Fonction récursive pour construire l'arbre
  const buildTree = (
    personId: string,
    processedNodes: Set<string> = new Set()
  ): TreeNode | null => {
    const person = findPersonById(people, personId)
    if (!person || processedNodes.has(personId)) return null

    // Marquer cette personne comme traitée
    processedNodes.add(personId)
    processedIds.add(personId)

    // Créer le nœud pour cette personne
    const node: TreeNode = {
      id: person.id,
      name: `${person.firstName} ${person.lastName}`,
      gender: person.gender,
      isAlive: !person.deathDate,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      photo: person.photo,
      data: person,
      children: [],
    }

    // Ajouter le partenaire principal s'il existe
    if (person.partnerId.length > 0) {
      const partnerId = person.partnerId[0]
      const partner = findPersonById(people, partnerId)

      if (partner) {
        node.partner = partner
        processedIds.add(partnerId) // Marque le partenaire comme traité

        // Trouver les enfants communs (qui sont dans les childrenIds des deux partenaires)
        const commonChildrenIds = person.childrenIds.filter((childId) =>
          partner.childrenIds.includes(childId)
        )

        // Ajouter les enfants communs
        commonChildrenIds.forEach((childId) => {
          if (!processedIds.has(childId)) {
            const childNode = buildTree(childId, new Set(processedNodes))
            if (childNode) {
              childNode.isFromOtherUnion = false
              node.children.push(childNode)
            }
          }
        })

        // Ajouter les enfants non communs de cette personne
        const thisPersonsOtherChildrenIds = person.childrenIds.filter(
          (childId) => !partner.childrenIds.includes(childId)
        )

        thisPersonsOtherChildrenIds.forEach((childId) => {
          if (!processedIds.has(childId)) {
            const childNode = buildTree(childId, new Set(processedNodes))
            if (childNode) {
              childNode.isFromOtherUnion = true
              childNode.parentId = person.id
              node.children.push(childNode)
            }
          }
        })

        // Ajouter les enfants non communs du partenaire (seulement si on n'a pas trouvé de candidat meilleur)
        const partnersOtherChildrenIds = partner.childrenIds.filter(
          (childId) =>
            !person.childrenIds.includes(childId) && !processedIds.has(childId)
        )

        partnersOtherChildrenIds.forEach((childId) => {
          if (!processedIds.has(childId)) {
            const childNode = buildTree(childId, new Set(processedNodes))
            if (childNode) {
              childNode.isFromOtherUnion = true
              childNode.parentId = partner.id
              node.children.push(childNode)
            }
          }
        })
      } else {
        // Si pas de partenaire, ajouter tous les enfants non traités
        person.childrenIds.forEach((childId) => {
          if (!processedIds.has(childId)) {
            const childNode = buildTree(childId, new Set(processedNodes))
            if (childNode) {
              node.children.push(childNode)
            }
          }
        })
      }
    } else {
      // Si pas de partenaire, ajouter tous les enfants non traités
      person.childrenIds.forEach((childId) => {
        if (!processedIds.has(childId)) {
          const childNode = buildTree(childId, new Set(processedNodes))
          if (childNode) {
            node.children.push(childNode)
          }
        }
      })
    }

    return node
  }

  // Construire l'arbre pour chaque racine
  rootPeople.forEach((rootPerson) => {
    if (!processedIds.has(rootPerson.id)) {
      const rootTreeNode = buildTree(rootPerson.id)
      if (rootTreeNode) rootNode.children.push(rootTreeNode)
    }
  })

  return rootNode
}

// Créer une copie profonde d'un objet
export const deepCopy = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

// Trouver un nœud dans l'arbre par ID
export const findNodeById = (root: TreeNode, id: string): TreeNode | null => {
  if (root.id === id) return root

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }

  if (root._children) {
    for (const child of root._children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }

  return null
}

export const getMatchingIds = (people: Person[], query: string): string[] => {
  if (!people || !query) return []

  const queryLower = query.toLowerCase()

  return people
    .filter((person) => {
      const firstName = (person.firstName || '').toLowerCase()
      const lastName = (person.lastName || '').toLowerCase()
      const maidenName = (person.maidenName || '').toLowerCase()
      const fullName = `${firstName} ${lastName}`

      return [firstName, lastName, fullName, maidenName].some((item) =>
        item.includes(queryLower)
      )
    })
    .map((person) => person.id)
}

export const getPersonNameById = (people: Person[], id: string): string => {
  const person = people.find((p) => p.id === id)
  return person ? `${person.firstName} ${person.lastName}` : 'Inconnu'
}

export const getPersonGenderById = (people: Person[], id: string): string => {
  const person = people.find((p) => p.id === id)
  return person ? person.gender : ''
}

export const handleSelectPersonById = (
  people: Person[],
  id: string,
  setSelectedPerson: (person: Person) => void
) => {
  const person = people.find((p) => p.id === id)
  if (person) {
    setSelectedPerson(person) // à adapter selon ton state
  }
}

export const calculateAge = (birthDate: string, deathDate?: string): number => {
  const birth = new Date(birthDate)
  const end = deathDate ? new Date(deathDate) : new Date()

  let age = end.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    end.getMonth() > birth.getMonth() ||
    (end.getMonth() === birth.getMonth() && end.getDate() >= birth.getDate())

  if (!hasHadBirthdayThisYear) {
    age--
  }

  return age
}

// Fonction pour centrer les enfants sous leurs parents
export const centerChildrenUnderParents = (nodes) => {
  // Créer un dictionnaire des nœuds par ID pour un accès facile
  const nodeById = {}
  nodes.forEach((node) => {
    if (node.data.id !== 'root') {
      nodeById[node.data.id] = node
    }
  })

  // Traiter les nœuds par niveaux (profondeur), du plus proche de la racine au plus éloigné
  const nodesByDepth = {}
  nodes.forEach((node) => {
    if (node.data.id === 'root') return
    const depth = node.depth
    if (!nodesByDepth[depth]) {
      nodesByDepth[depth] = []
    }
    nodesByDepth[depth].push(node)
  })

  // Traiter chaque niveau en commençant par le plus proche de la racine
  const depths = Object.keys(nodesByDepth)
    .map(Number)
    .sort((a, b) => a - b)

  for (let i = 1; i < depths.length; i++) {
    // Commencer à 1 pour ignorer la racine
    const depthNodes = nodesByDepth[depths[i]]

    // Regrouper les enfants par parent
    const childrenByParentId = {}
    depthNodes.forEach((node) => {
      if (!node.parent || node.parent.data.id === 'root') return

      const parentId = node.parent.data.id
      if (!childrenByParentId[parentId]) {
        childrenByParentId[parentId] = []
      }
      childrenByParentId[parentId].push(node)
    })

    // Centrer chaque groupe d'enfants sous leur parent
    Object.entries(childrenByParentId).forEach(([parentId, children]) => {
      const parent = nodeById[parentId]
      if (!parent || children.length === 0) return

      // Déterminer si le parent a un partenaire
      const hasPartner = !!parent.data.partner

      // Calculer le centre du parent (ou du couple)
      let parentCenterX = parent.x
      if (hasPartner) {
        // Si le parent a un partenaire, centrer les enfants entre les deux
        parentCenterX += PARTNER_DISTANCE / 2
      }

      // Trier les enfants par position X
      children.sort((a, b) => a.x - b.x)

      // Calculer le centre actuel des enfants
      const leftmostChild = children[0]
      const rightmostChild = children[children.length - 1]
      const childrenCenterX = (leftmostChild.x + rightmostChild.x) / 2

      // Calculer le décalage nécessaire
      const offset = parentCenterX - childrenCenterX

      // Appliquer le décalage à tous les enfants
      children.forEach((child) => {
        child.x += offset
      })
    })
  }

  // Dernière étape : vérifier et résoudre les chevauchements après centrage
  preventOverlaps(nodes)
}

// Fonction pour détecter et résoudre les chevauchements horizontaux après centrage
export const preventOverlaps = (nodes) => {
  // Regrouper les nœuds par niveau (y)
  const nodesByLevel = {}
  nodes.forEach((node) => {
    if (node.data.id === 'root') return

    const y = node.y
    if (!nodesByLevel[y]) {
      nodesByLevel[y] = []
    }
    nodesByLevel[y].push(node)
  })

  // Pour chaque niveau, vérifier et résoudre les chevauchements
  Object.values(nodesByLevel).forEach((levelNodes) => {
    // Trier les nœuds par position X
    levelNodes.sort((a, b) => a.x - b.x)

    // Vérifier les chevauchements
    for (let i = 0; i < levelNodes.length - 1; i++) {
      const current = levelNodes[i]
      const next = levelNodes[i + 1]

      // Espace minimal requis (2.5 fois le rayon du nœud + espace supplémentaire)
      const minSpace = NODE_RADIUS * 3 + 20

      // Espace actuel entre les centres des nœuds
      const actualSpace = next.x - current.x

      if (actualSpace < minSpace) {
        // Calculer le décalage nécessaire
        const offset = minSpace - actualSpace

        // Décaler tous les nœuds suivants
        for (let j = i + 1; j < levelNodes.length; j++) {
          levelNodes[j].x += offset
        }
      }
    }
  })
}

// Fonction améliorée pour générer des chemins pour les liens
export const generateImprovedPath = (d) => {
  const sourceX = d.source.x
  const sourceY = d.source.y
  const targetX = d.target.x
  const targetY = d.target.y

  // Position de départ du lien
  let startX = sourceX

  // Si le lien provient du nœud racine (premier nœud invisible)
  if (d.source.data.id === 'root') {
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

  // Point intermédiaire pour le chemin vertical
  const midY = (sourceY + targetY) / 2

  // Si l'enfant est directement sous le parent (ou presque)
  const isAlmostAligned = Math.abs(targetX - startX) < NODE_RADIUS * 0.5

  if (isAlmostAligned) {
    // Chemin direct vertical si l'enfant est presque aligné avec le parent
    return `M${startX},${sourceY} V${targetY}`
  }

  // Chemin normal en forme de Γ inversé avec coins arrondis
  return `M${startX},${sourceY}
          V${midY}
          Q${startX},${midY + 10} ${startX + 10},${midY + 10}
          H${targetX - 10}
          Q${targetX},${midY + 10} ${targetX},${midY + 20}
          V${targetY}`
}
