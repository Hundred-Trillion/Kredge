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

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/clients/:id/reconcile" element={<NewReconciliation />} />
          <Route path="/runs/:runId" element={<ReconciliationResults />} />
          <Route path="/settings" element={<SettingsPlaceholder />} />
          <Route path="/runs" element={<RunsPlaceholder />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function SettingsPlaceholder() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <div className="card p-8 text-center">
        <p className="text-navy-300">Settings page coming in v2.</p>
        <p className="text-xs text-navy-500 mt-2">Firm profile, notification preferences, WhatsApp configuration</p>
      </div>
    </div>
  )
}

function RunsPlaceholder() {
  return (
    <div className="animate-fade-in">
      <Navigate to="/" replace />
    </div>
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
