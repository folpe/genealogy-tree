import { createRoot } from 'react-dom/client'
import { Main } from './Main'
import '../styles/tailwind.css'

const container = document.querySelector('#root') as Element
const root = createRoot(container)

root.render(<Main />)
