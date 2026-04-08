import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login } from '../services/api'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const registered = location.state?.registered
  const expired    = location.state?.expired ?? document.title.includes('Session expired')

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/dashboard')
  }, [navigate])

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    try {
      const { data } = await login(form.username, form.password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({ username: data.username, roles: [...data.roles] }))
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const msg    = err.response?.data?.message
      if (status === 429) setError('Too many failed attempts. Account locked for 5 minutes.')
      else if (status === 401) setError('Invalid username or password.')
      else setError(msg || 'Login failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-xl font-bold">₹</div>
          <span className="text-xl font-bold tracking-tight">FinGuard</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Track every rupee.<br />
            <span className="text-blue-300">Grow every day.</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            A production-grade financial dashboard with role-based access, real-time analytics, and secure JWT authentication.
          </p>
          <div className="mt-8 flex gap-6">
            {[['₹', 'INR Native'], ['🔒', 'JWT Secured'], ['📊', 'Live Analytics']].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-300">
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-500 text-xs">© 2026 FinGuard · Built with Spring Boot + React</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">₹</div>
            <h1 className="text-2xl font-bold text-white">FinGuard</h1>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-slate-300 text-sm mb-6">Track and manage your finances intelligently</p>

            {registered && (
              <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <span>✓</span> Account created. You can now sign in.
              </div>
            )}
            {expired && !registered && (
              <div className="bg-amber-500/20 border border-amber-400/30 text-amber-300 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <span>⏱</span> Session expired. Please sign in again.
              </div>
            )}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  placeholder="Enter your username"
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition text-sm">
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-150 shadow-lg shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                {loading ? <><span className="animate-spin">⏳</span> Signing in…</> : 'Sign in →'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-white/10 text-center">
              <p className="text-slate-400 text-xs">
                No account?{' '}
                <Link to="/register" className="text-blue-300 hover:text-blue-200 font-medium">Create one free</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
