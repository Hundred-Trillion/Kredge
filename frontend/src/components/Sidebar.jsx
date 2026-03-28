import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import KredgeLogo from './KredgeLogo'
import {
  LayoutDashboard,
  Users,
  FileSearch,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/runs', icon: FileSearch, label: 'Runs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { profile, signOut, isDemoMode } = useAuth()
  const location = useLocation()

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-navy-950 border-r border-surface-border flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-surface-border">
        <KredgeLogo size="default" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(to)

          return (
            <NavLink
              key={to}
              to={to}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group
                ${isActive
                  ? 'bg-electric/10 text-electric border border-electric/20'
                  : 'text-navy-200 hover:text-white hover:bg-navy-800 border border-transparent'
                }
              `}
            >
              <Icon size={18} className={isActive ? 'text-electric' : 'text-navy-300 group-hover:text-white'} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} className="text-electric/50" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Demo mode indicator */}
      {isDemoMode && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-300 font-medium">Demo Mode</p>
          <p className="text-xs text-amber-300/60 mt-0.5">Supabase not configured</p>
        </div>
      )}

      {/* User info + logout */}
      <div className="px-3 pb-4 border-t border-surface-border pt-4">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-electric/20 flex items-center justify-center text-electric text-sm font-bold">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.name || 'User'}</p>
            <p className="text-xs text-navy-300 truncate">{profile?.firm_name || 'Firm'}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-navy-300 
                     hover:text-danger hover:bg-danger/5 transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
