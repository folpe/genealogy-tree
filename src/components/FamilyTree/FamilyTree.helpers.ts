// utils.ts
import { Person, FamilyTreeNode } from './FamilyTree.types'

// Construit un dictionnaire pour accéder rapidement aux personnes par ID
export const buildPeopleMap = (people: Person[]): Record<string, Person> => {
  const map: Record<string, Person> = {}
  people.forEach((person) => {
    map[person.id] = person
  })
  return map
}

// Trouve la racine de l'arbre si non spécifiée
export const findRoot = (people: Person[]): Person | undefined => {
  // Personnes qui sont des enfants (ont des parents)
  const hasParent = new Set<string>()

  people.forEach((person) => {
    person.childrenIds.forEach((childId) => {
      hasParent.add(childId)
    })
  })

  // Personnes qui sont des parents mais pas des enfants, triées par ordre d'âge
  const potentialRoots = people
    .filter(
      (person) => !hasParent.has(person.id) && person.childrenIds.length > 0
    )
    .sort((a, b) => {
      if (!a.birthDate) return 1
      if (!b.birthDate) return -1
      return a.birthDate.localeCompare(b.birthDate)
    })

  return potentialRoots[0]
}

// Construit un arbre à partir de la racine
export const buildTree = (
  rootPerson: Person,
  peopleMap: Record<string, Person>
): FamilyTreeNode => {
  // Créer le nœud pour cette personne
  const node: FamilyTreeNode = {
    person: rootPerson,
    children: [],
    isCollapsed: false,
  }

  // Ajouter le partenaire s'il existe
  if (rootPerson.partnerId.length > 0) {
    const partnerId = rootPerson.partnerId[0] // Prendre le premier partenaire
    node.partner = peopleMap[partnerId]
  }

  // Récursivement ajouter les enfants
  rootPerson.childrenIds.forEach((childId) => {
    const childPerson = peopleMap[childId]
    if (childPerson) {
      // Ne pas inclure les enfants qui sont aussi partenaires (éviter les cycles)
      if (rootPerson.partnerId.includes(childId)) {
        return
      }

      // Construire le sous-arbre pour cet enfant
      const childNode = buildTree(childPerson, peopleMap)
      node.children.push(childNode)
    }
  })

  return node
}

// Prépare le positionnement des nœuds
export const layoutTree = (
  node: FamilyTreeNode,
  x = 0,
  y = 0,
  nodeWidth = 120,
  nodeHeight = 80,
  horizontalGap = 20,
  verticalGap = 60
): void => {
  // Positionner ce nœud
  node.x = x
  node.y = y
  node.width = nodeWidth

  if (node.isCollapsed || node.children.length === 0) {
    return
  }

  // Calculer largeur totale nécessaire pour les enfants
  const totalChildrenWidth = node.children.reduce((width, child) => {
    return width + nodeWidth + horizontalGap
  }, -horizontalGap)

  // Position de départ pour le premier enfant
  let startX = x - totalChildrenWidth / 2 + nodeWidth / 2

  // Positionner chaque enfant
  node.children.forEach((child) => {
    layoutTree(
      child,
      startX,
      y + nodeHeight + verticalGap,
      nodeWidth,
      nodeHeight,
      horizontalGap,
      verticalGap
    )
    startX += nodeWidth + horizontalGap
  })
}
