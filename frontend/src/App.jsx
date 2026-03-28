import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import NewReconciliation from './pages/NewReconciliation'
import ReconciliationResults from './pages/ReconciliationResults'
import Settings from './pages/Settings'
import Runs from './pages/Runs'
import Suppliers from './pages/Suppliers'
import ClientPortal from './pages/ClientPortal'

function AppRoutes() {
  const { isDemoMode, isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          (isAuthenticated || isDemoMode)
            ? <Navigate to="/" replace />
            : <Login />
        }
      />
      
      {/* Client Portal (Public, Token-Auth only) */}
      <Route path="/portal/:token" element={<ClientPortal />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/clients/:id/reconcile" element={<NewReconciliation />} />
          <Route path="/runs/:runId" element={<ReconciliationResults />} />
          <Route path="/runs" element={<Runs />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
