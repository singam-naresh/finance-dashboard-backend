import { formatINR } from '../utils/formatCurrency'

function getHealth(income, expenses) {
  if (income === 0 && expenses === 0) return null
  const ratio = expenses / (income || 1)
  if (ratio < 0.6)  return { label: 'Excellent', badge: 'badge-good',    icon: '💚', bar: 'bg-emerald-500', pct: Math.min(100, Math.round((1 - ratio) * 100)), tip: 'You\'re saving well. Keep it up!' }
  if (ratio < 0.85) return { label: 'Good',      badge: 'badge-good',    icon: '🟢', bar: 'bg-emerald-400', pct: Math.round((1 - ratio) * 100),               tip: 'Healthy balance. Minor optimisation possible.' }
  if (ratio < 1.0)  return { label: 'Warning',   badge: 'badge-warning', icon: '🟡', bar: 'bg-amber-400',   pct: Math.round((1 - ratio) * 100),               tip: 'Expenses are high. Review your spending.' }
  return               { label: 'At Risk',    badge: 'badge-risk',    icon: '🔴', bar: 'bg-red-500',     pct: 5,                                            tip: 'Expenses exceed income. Take action now.' }
}

export default function FinancialHealth({ income, expenses }) {
  const h = getHealth(parseFloat(income), parseFloat(expenses))
  if (!h) return null

  return (
    <div className="card flex items-start gap-4 py-4">
      <div className="text-2xl">{h.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial Health</span>
          <span className={`badge ${h.badge}`}>{h.label}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5">
          <div className={`h-1.5 rounded-full transition-all duration-700 ${h.bar}`}
            style={{ width: `${h.pct}%` }} />
        </div>
        <p className="text-xs text-slate-500">{h.tip}</p>
      </div>
    </div>
  )
}
