import { Navigate } from 'react-router-dom'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const access = localStorage.getItem('access_granted')
  return access === 'true' ? <>{children}</> : <Navigate to="/" replace />
}
