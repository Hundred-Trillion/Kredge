import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, loading, isDemoMode } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen bg-navy-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
          <span className="text-navy-200 text-sm">Loading Kredge...</span>
        </div>
      </div>
    )
  }

  // In demo mode, always allow access
  if (isDemoMode) {
    return <Outlet />
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
