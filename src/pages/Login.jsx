// src/pages/Login.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { user, loginWithGoogle, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleLogin = async () => {
    try {
      await loginWithGoogle()
      toast.success('Welcome to SplitSmart!')
    } catch {
      toast.error('Login failed. Try again.')
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      {/* Background grain */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#14532d22_0%,_transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/25">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="font-display font-extrabold text-3xl text-white">SplitSmart</h1>
          <p className="text-slate-400 font-body mt-1 text-center">
            Split expenses, not friendships.
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 flex flex-col gap-5">
          <div>
            <h2 className="font-display font-bold text-white text-xl mb-1">Get started</h2>
            <p className="text-slate-500 text-sm font-body">
              Sign in to manage shared expenses with your group.
            </p>
          </div>

          {/* Feature list */}
          <ul className="flex flex-col gap-2">
            {[
              'Track who paid what, instantly',
              'Auto-calculate who owes whom',
              'Spending insights & analytics',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-400 font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <button onClick={handleLogin} className="btn-primary w-full justify-center py-3 text-base">
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-xs text-slate-600 text-center font-body">
            By signing in you agree to be a responsible group member 🙂
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}