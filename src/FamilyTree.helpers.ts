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

// Calculer l'âge
export const calculateAge = (birthDate: string, deathDate?: string): number => {
  const birth = new Date(birthDate)
  const end = deathDate ? new Date(deathDate) : new Date()

  let age = end.getFullYear() - birth.getFullYear()
  const monthDiff = end.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--
  }

  return age
}

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
    if (person.partnersIds.length > 0) {
      const partnerId = person.partnersIds[0]
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
