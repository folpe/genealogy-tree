import { createRoot } from 'react-dom/client'
import { FamilyTree } from './FamilyTree'
import './index.css'

const container = document.querySelector('#root') as Element
const root = createRoot(container)

root.render(<FamilyTree />)
