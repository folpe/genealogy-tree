// App.tsx
import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { FamilyTree } from './FamilyTree'
import { Login } from './Login'
import { ProtectedRoute } from './ProtectedRoute'

export const Main = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  console.info('is Authenticated: ', isAuthenticated)

  useEffect(() => {
    const alreadyAuth = localStorage.getItem('access_granted') === 'true'
    if (alreadyAuth) setIsAuthenticated(true)
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/tree"
          element={
            <ProtectedRoute>
              <FamilyTree />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}
