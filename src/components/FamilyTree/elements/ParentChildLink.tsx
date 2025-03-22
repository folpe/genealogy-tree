import { FamilyTreeNode } from '../FamilyTree.types'

interface ParentChildLinkProps {
  parent: FamilyTreeNode
  child: FamilyTreeNode
}

export const ParentChildLink: React.FC<ParentChildLinkProps> = ({
  parent,
  child,
}) => {
  // Point de départ (milieu-bas du parent)
  const startX = parent.x! + parent.width! / 2
  const startY = parent.y! + 60 // Hauteur du nœud parent

  // Point d'arrivée (milieu-haut de l'enfant)
  const endX = child.x! + child.width! / 2
  const endY = child.y!

  // Point de contrôle pour la ligne verticale
  const controlY = (startY + endY) / 2

  return (
    <g>
      <path
        d={`M ${startX} ${startY} L ${startX} ${controlY} L ${endX} ${controlY} L ${endX} ${endY}`}
        fill="none"
        stroke="#666"
        strokeWidth={1.5}
      />
    </g>
  )
}
