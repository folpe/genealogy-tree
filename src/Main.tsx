import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import { Login } from './components/Login/Login'
import { ProtectedRoute } from './ProtectedRoute'
import { Tree } from './pages/Tree'
import { useDisablePinch } from './utils/useDisablePinch'

export const Main = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  useDisablePinch()

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
              <Tree />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}
