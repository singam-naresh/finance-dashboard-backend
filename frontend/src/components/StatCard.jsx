export default function StatCard({ label, value, sub, color = 'slate', icon }) {
  const styles = {
    green: {
      wrap: 'bg-white border border-income-light',
      icon: 'bg-income-light text-income',
      label: 'text-slate-500',
      value: 'text-income-text',
      sub: 'text-income',
    },
    red: {
      wrap: 'bg-white border border-expense-light',
      icon: 'bg-expense-light text-expense',
      label: 'text-slate-500',
      value: 'text-expense-text',
      sub: 'text-expense',
    },
    blue: {
      wrap: 'bg-white border border-brand-100',
      icon: 'bg-brand-100 text-brand-600',
      label: 'text-slate-500',
      value: 'text-brand-700',
      sub: 'text-brand-500',
    },
    slate: {
      wrap: 'bg-white border border-slate-100',
      icon: 'bg-slate-100 text-slate-500',
      label: 'text-slate-500',
      value: 'text-slate-800',
      sub: 'text-slate-400',
    },
  }
  const s = styles[color] ?? styles.slate

  return (
    <div className={`rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-200 p-5 ${s.wrap}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${s.icon}`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${s.value}`}>{value}</div>
      {sub && <div className={`text-xs mt-1.5 font-medium ${s.sub}`}>{sub}</div>}
    </div>
  )
}
