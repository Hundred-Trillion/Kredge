import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import KredgeLogo from '../components/KredgeLogo'
import { AlertCircle, ArrowRight, UserPlus } from 'lucide-react'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [firmName, setFirmName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, isDemoMode } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (isDemoMode) {
      navigate('/')
      return
    }

    if (!email || !password || (isSignUp && (!name || !firmName))) {
      setError('Please fill out all required fields.')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp(email, password, {
          name,
          firm_name: firmName
        })
        if (signUpError) {
          setError(signUpError.message || 'Error creating account.')
        } else {
          // Attempt sign in immediately if confirmed, or show success.
          await signIn(email, password)
          navigate('/')
        }
      } else {
        const { error: signInError } = await signIn(email, password)
        if (signInError) {
          setError(signInError.message || 'Invalid credentials. Please try again.')
        } else {
          navigate('/')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-kredge flex items-center justify-center p-4">
      {/* Background subtle elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-electric/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-electric/2 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <KredgeLogo size="large" showTagline />
        </div>

        {/* Login card */}
        <div className="card p-8 glow-electric">
          <h1 className="text-xl font-semibold text-white mb-1">
            {isSignUp ? 'Create your platform account' : 'Sign in to your account'}
          </h1>
          <p className="text-sm text-navy-300 mb-6">
            {isSignUp ? 'Register your firm to manage ITC reconciliations' : 'Access your ITC reconciliation dashboard'}
          </p>

          {isDemoMode && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
              <p className="text-xs text-amber-300">
                <strong>Demo Mode:</strong> Supabase not configured. Click to explore with demo data.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-navy-200 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Adithya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-200 mb-1.5">Firm Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="L88 Laboratories"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-navy-200 mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@yourfirm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-navy-200 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
                <AlertCircle size={16} className="text-danger mt-0.5 flex-shrink-0" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSignUp ? (
                <>
                  Create Account
                  <UserPlus size={18} />
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-navy-300 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-navy-400 mt-6">
          Support or inquiries?{' '}
          <a href="mailto:adithyadrdo@gmail.com" className="text-electric hover:text-electric-300 transition-colors">
            Contact us
          </a>
        </p>
      </div>
    </div>
  )
}
