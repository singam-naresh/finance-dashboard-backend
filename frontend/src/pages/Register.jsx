import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/api'

const rules = [
  { test: (p) => p.length >= 8,          label: '8+ characters' },
  { test: (p) => /[A-Z]/.test(p),        label: 'Uppercase letter' },
  { test: (p) => /[a-z]/.test(p),        label: 'Lowercase letter' },
  { test: (p) => /\d/.test(p),           label: 'Number' },
  { test: (p) => /[@$!%*?&_\-]/.test(p), label: 'Special character' },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]           = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw]       = useState(false)
  const [errors, setErrors]       = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/dashboard')
  }, [navigate])

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Required'
    else if (form.username.length < 3) e.username = 'Min 3 characters'
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Letters, digits, underscores only'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Required'
    else if (!rules.every((r) => r.test(form.password))) e.password = 'Password does not meet requirements'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setServerError('')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      const data = err.response?.data
      if (data?.fieldErrors) setErrors(data.fieldErrors)
      else setServerError(data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = rules.filter((r) => r.test(form.password)).length

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-xl font-bold">₹</div>
          <span className="text-xl font-bold tracking-tight">FinGuard</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Start your<br />
            <span className="text-blue-300">financial journey.</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            Create your account and get instant access to income tracking, expense management, and analytics.
          </p>
          <div className="mt-8 space-y-3">
            {['Free to use, no credit card required', 'Secure JWT-based authentication', 'Role-based access control'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-blue-300 text-xs">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-500 text-xs">© 2026 FinGuard</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">₹</div>
            <h1 className="text-2xl font-bold text-white">FinGuard</h1>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
            <p className="text-slate-300 text-sm mb-6">Join FinGuard and take control of your finances</p>

            {serverError && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <span>⚠</span> {serverError}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4" noValidate>
              <GlassField label="Username" error={errors.username}>
                <input className={glassInput(errors.username)} placeholder="johndoe"
                  value={form.username} onChange={(e) => set('username', e.target.value)} />
              </GlassField>

              <GlassField label="Email" error={errors.email}>
                <input className={glassInput(errors.email)} type="email" placeholder="you@example.com"
                  value={form.email} onChange={(e) => set('email', e.target.value)} />
              </GlassField>

              <GlassField label="Password" error={errors.password}>
                <div className="relative">
                  <input className={`${glassInput(errors.password)} pr-11`}
                    type={showPw ? 'text' : 'password'} placeholder="Create a strong password"
                    value={form.password} onChange={(e) => set('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm">
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                          i <= pwStrength
                            ? pwStrength <= 2 ? 'bg-red-400' : pwStrength <= 3 ? 'bg-yellow-400' : 'bg-emerald-400'
                            : 'bg-white/20'
                        }`} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {rules.map((r) => (
                        <span key={r.label} className={`text-xs ${r.test(form.password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {r.test(form.password) ? '✓' : '○'} {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </GlassField>

              <GlassField label="Confirm Password" error={errors.confirm}>
                <input className={glassInput(errors.confirm)} type="password" placeholder="Repeat password"
                  value={form.confirm} onChange={(e) => set('confirm', e.target.value)} />
              </GlassField>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                {loading ? <><span className="animate-spin">⏳</span> Creating…</> : 'Create account →'}
              </button>
            </form>

            <p className="text-slate-400 text-xs text-center mt-5 pt-5 border-t border-white/10">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-300 hover:text-blue-200 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const glassInput = (err) =>
  `w-full bg-white/10 border ${err ? 'border-red-400/60' : 'border-white/20'} rounded-xl px-4 py-3 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition`

function GlassField({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
