import { useState, useEffect } from 'react'
import { createRecord, updateRecord } from '../services/api'

const EMPTY = { amount: '', type: 'INCOME', category: '', date: '', description: '' }

const CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Business',
  'Rent', 'Food', 'Transport', 'Utilities', 'Healthcare',
  'Education', 'Entertainment', 'Shopping', 'Other',
]

export default function AddRecordModal({ onClose, onSuccess, editRecord = null }) {
  const [form, setForm]           = useState(EMPTY)
  const [errors, setErrors]       = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]     = useState(false)
  const isEdit = !!editRecord

  useEffect(() => {
    if (editRecord) {
      setForm({
        amount:      editRecord.amount ?? '',
        type:        editRecord.type ?? 'INCOME',
        category:    editRecord.category ?? '',
        date:        editRecord.date ?? '',
        description: editRecord.description ?? '',
      })
    }
  }, [editRecord])

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Enter a positive amount'
    if (!form.category.trim()) e.category = 'Category is required'
    if (!form.date) e.date = 'Date is required'
    else if (new Date(form.date) > new Date()) e.date = 'Date cannot be in the future'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setServerError('')
    setLoading(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (isEdit) await updateRecord(editRecord.id, payload)
      else        await createRecord(payload)
      onSuccess()
      onClose()
    } catch (err) {
      const data = err.response?.data
      if (data?.fieldErrors) setErrors(data.fieldErrors)
      else setServerError(data?.message || `Failed to ${isEdit ? 'update' : 'create'} record`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800">{isEdit ? 'Edit Record' : 'New Record'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? 'Update the financial record' : 'Add a new income or expense'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-lg">
            ×
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4" noValidate>
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
              <span>⚠️</span> {serverError}
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['INCOME', 'EXPENSE'].map((t) => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    form.type === t
                      ? t === 'INCOME'
                        ? 'border-income bg-income-light text-income-text'
                        : 'border-expense bg-expense-light text-expense-text'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  {t === 'INCOME' ? '↑ Income' : '↓ Expense'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
              <input className={`input pl-7 ${errors.amount ? 'input-error' : ''}`}
                type="number" step="0.01" min="0.01" placeholder="0.00"
                value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <select className={`input ${errors.category ? 'input-error' : ''}`}
              value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <input className={`input ${errors.date ? 'input-error' : ''}`}
              type="date" max={new Date().toISOString().slice(0, 10)}
              value={form.date} onChange={(e) => set('date', e.target.value)} />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea className="input resize-none" rows={2}
              placeholder="Optional note about this transaction"
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading
                ? <><span className="animate-spin">⏳</span> Saving…</>
                : isEdit ? '✓ Update Record' : '+ Save Record'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
