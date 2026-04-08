import { useEffect } from 'react'

const STYLES = {
  success: { wrap: 'bg-white border-l-4 border-income shadow-lg', icon: '✓', iconCls: 'text-income bg-income-light' },
  error:   { wrap: 'bg-white border-l-4 border-expense shadow-lg', icon: '✕', iconCls: 'text-expense bg-expense-light' },
  info:    { wrap: 'bg-white border-l-4 border-brand-500 shadow-lg', icon: 'ℹ', iconCls: 'text-brand-600 bg-brand-100' },
}

export default function Toast({ toasts, remove }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} remove={remove} />)}
    </div>
  )
}

function ToastItem({ toast, remove }) {
  const s = STYLES[toast.type ?? 'info']

  useEffect(() => {
    const timer = setTimeout(() => remove(toast.id), toast.duration ?? 3500)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, remove])

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${s.wrap}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${s.iconCls}`}>
        {s.icon}
      </div>
      <span className="flex-1 text-sm text-slate-700 font-medium">{toast.message}</span>
      <button onClick={() => remove(toast.id)}
        className="text-slate-300 hover:text-slate-500 text-lg leading-none shrink-0">×</button>
    </div>
  )
}
