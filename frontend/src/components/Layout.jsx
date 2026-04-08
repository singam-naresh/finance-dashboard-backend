import { NavLink, useNavigate } from 'react-router-dom'

const Icons = {
  dashboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  records: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
    </svg>
  ),
  user: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
  { to: '/records',   label: 'Records',   icon: Icons.records },
]

function roleBadge(role) {
  if (role?.includes('ADMIN'))   return { cls: 'bg-blue-500/20 text-blue-200 border border-blue-400/30',   label: 'ADMIN' }
  if (role?.includes('ANALYST')) return { cls: 'bg-violet-500/20 text-violet-200 border border-violet-400/30', label: 'ANALYST' }
  return                                { cls: 'bg-white/10 text-slate-300 border border-white/20',          label: 'VIEWER' }
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()
  const primaryRole = user.roles?.[0] ?? ''
  const rb = roleBadge(primaryRole)

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">

      {/* ── Sidebar — matches login dark blue theme ── */}
      <aside className="w-60 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/30">
              ₹
            </div>
            <span className="text-base font-bold text-white tracking-tight">FinGuard</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 ml-10">Finance Dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }>
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center text-blue-200 text-sm font-bold uppercase shrink-0">
              {user.username?.[0] ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user.username}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rb.cls}`}>{rb.label}</span>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 transition-all">
            {Icons.logout} Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center px-6 shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              {Icons.user}
              <span className="font-medium text-white">{user.username}</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${rb.cls}`}>{rb.label}</span>
          </div>
        </header>

        {/* Scrollable page content — light card area on dark bg */}
        <main className="flex-1 overflow-auto bg-slate-50/95 backdrop-blur-sm">
          {children}
        </main>
      </div>
    </div>
  )
}
