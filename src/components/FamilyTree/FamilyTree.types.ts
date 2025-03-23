export interface Person {
  id: string
  firstName: string
  lastName: string
  maidenName?: string
  birthDate?: string | null
  birthLocation?: string | null
  deathDate?: string | null
  gender?: string
  city?: string
  zipCode?: number
  country?: string
  photo?: string
  partnerId: string[]
  childrenIds: string[]
  parentsIds: string[]
}

export interface FamilyTreeNode {
  person: Person
  partner?: Person
  children: FamilyTreeNode[]
  isCollapsed?: boolean
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface FamilyTreeProps {
  data: Person[]
  rootId?: string
  nodeWidth?: number
  nodeHeight?: number
  horizontalGap?: number
  verticalGap?: number
  selectPersonFunc: (person: Person) => void
  highlightedNodes?: string[]
  shouldFocusOnNodes?: boolean
  shouldResetZoom?: boolean
  onZoomActionComplete?: () => void
}
