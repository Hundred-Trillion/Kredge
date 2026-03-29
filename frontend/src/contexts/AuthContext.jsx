import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext({})

// Demo user for when Supabase is not configured
const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@kredge.in',
  user_metadata: {
    name: 'Rajesh Sharma',
    firm_name: 'Sharma & Associates',
    telegram_chat_id: '6186383218',
  },
}

const DEMO_PROFILE = {
  id: 'demo-user-001',
  name: 'Rajesh Sharma',
  email: 'demo@kredge.in',
  telegram_chat_id: '6186383218',
  telegram_alerts: true,
  firm_name: 'Sharma & Associates',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Demo mode — no Supabase, auto-authenticate
      setIsDemoMode(true)
      setUser(DEMO_USER)
      setProfile(DEMO_PROFILE)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!error && data) {
      setProfile(data)
    }
  }

  async function signIn(email, password) {
    if (isDemoMode) {
      setUser(DEMO_USER)
      setProfile(DEMO_PROFILE)
      return { data: { user: DEMO_USER }, error: null }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  async function signUp(email, password, metadata) {
    if (isDemoMode) {
      setUser(DEMO_USER)
      setProfile(DEMO_PROFILE)
      return { data: { user: DEMO_USER }, error: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return { data, error }
  }

  async function signOut() {
    if (isDemoMode) {
      setUser(null)
      setProfile(null)
      return
    }

    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile: profile || (user ? {
      id: user.id,
      name: user.user_metadata?.name || 'User',
      email: user.email,
      telegram_chat_id: user.user_metadata?.telegram_chat_id || '',
      telegram_alerts: user.user_metadata?.telegram_alerts ?? true,
      firm_name: user.user_metadata?.firm_name || 'My Firm',
    } : null),
    loading,
    isDemoMode,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
