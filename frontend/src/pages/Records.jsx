import { useEffect, useState, useCallback, useRef } from 'react'
import { getRecords, deleteRecord, filterByType } from '../services/api'
import Layout from '../components/Layout'
import AddRecordModal from '../components/AddRecordModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'
import { useToast } from '../hooks/useToast'
import { formatINR } from '../utils/formatCurrency'
import { exportToCsv } from '../utils/exportCsv'

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
}

const PAGE_SIZE = 10

function SortBtn({ field, sortBy, direction, onClick, children }) {
  const active = sortBy === field
  return (
    <button onClick={() => onClick(field)}
      className={`flex items-center gap-1 hover:text-slate-700 transition-colors ${active ? 'text-brand-600' : ''}`}>
      {children}
      <span className="text-xs">{active ? (direction === 'asc' ? '↑' : '↓') : '↕'}</span>
    </button>
  )
}

export default function Records() {
  const { toasts, remove, toast } = useToast()
  const user      = getUser()
  const isAdmin   = user.roles?.includes('ROLE_ADMIN')
  const isAnalyst = user.roles?.includes('ROLE_ANALYST')
  const canWrite  = isAdmin || isAnalyst

  // Admin toggle: 'mine' | 'all'
  const [viewMode, setViewMode]         = useState('mine')

  const [records, setRecords]           = useState([])
  const [page, setPage]                 = useState(0)
  const [totalPages, setTotalPages]     = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [typeFilter, setTypeFilter]     = useState('ALL')
  const [search, setSearch]             = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy]             = useState('date')
  const [direction, setDirection]       = useState('desc')

  const [showModal, setShowModal]       = useState(false)
  const [editRecord, setEditRecord]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const searchTimer = useRef(null)

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = typeFilter === 'ALL'
        ? await getRecords(page, PAGE_SIZE, sortBy, direction)
        : await filterByType(typeFilter, page, PAGE_SIZE, sortBy, direction)
      setRecords(res.data.content)
      setTotalPages(res.data.totalPages)
      setTotalElements(res.data.totalElements)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, sortBy, direction])

  useEffect(() => { load() }, [load])

  // PRIVACY SAFETY NET: Even if backend returns other users' records (old build),
  // non-admin users will NEVER see records that don't belong to them.
  const displayed = records.filter((r) => {
    // Hard privacy filter — non-admins can ONLY see their own records
    if (!isAdmin && r.username !== user.username) return false

    const matchSearch = !debouncedSearch ||
      r.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.username.toLowerCase().includes(debouncedSearch.toLowerCase())

    // Admin "My Records" → show only own; "All Records" → show everything
    const matchView = !isAdmin || viewMode === 'all' || r.username === user.username

    return matchSearch && matchView
  })

  const handleSort = (field) => {
    if (sortBy === field) setDirection((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setDirection('desc') }
    setPage(0)
  }

  const handleFilterChange = (val) => { setTypeFilter(val); setPage(0) }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteRecord(deleteTarget.id)
      setDeleteTarget(null)
      toast.success('Record deleted')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const openAdd  = () => { setEditRecord(null); setShowModal(true) }
  const openEdit = (r) => { setEditRecord(r); setShowModal(true) }

  const handleExport = () => {
    exportToCsv(displayed, `finguard-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.info('CSV exported')
  }

  const colSpan = canWrite ? 7 : 6

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Financial Records</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {totalElements > 0 ? `${totalElements} total records` : 'Manage income and expenses'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleExport} className="btn-ghost text-xs border border-slate-200">
              ⬇ Export CSV
            </button>
            {canWrite && (
              <button onClick={openAdd} className="btn-primary">
                + Add Record
              </button>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
            <input className="input pl-9 py-2 text-sm" placeholder="Search category, user…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Type filter */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {['ALL', 'INCOME', 'EXPENSE'].map((f) => (
              <button key={f} onClick={() => handleFilterChange(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {f === 'INCOME' ? '↑ ' : f === 'EXPENSE' ? '↓ ' : ''}{f}
              </button>
            ))}
          </div>

          {/* Admin view toggle */}
          {isAdmin && (
            <div className="flex gap-1 bg-brand-50 border border-brand-100 rounded-xl p-1">
              {[['mine', 'My Records'], ['all', 'All Records']].map(([val, label]) => (
                <button key={val} onClick={() => setViewMode(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === val ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-600 hover:bg-brand-100'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 flex items-center gap-3">
            <span>⚠️</span><span className="flex-1">{error}</span>
            <button onClick={load} className="text-xs underline">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">
                    <SortBtn field="date" sortBy={sortBy} direction={direction} onClick={handleSort}>Date</SortBtn>
                  </th>
                  <th className="px-4 py-3">
                    <SortBtn field="category" sortBy={sortBy} direction={direction} onClick={handleSort}>Category</SortBtn>
                  </th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3 text-right">
                    <SortBtn field="amount" sortBy={sortBy} direction={direction} onClick={handleSort}>
                      <span className="ml-auto">Amount</span>
                    </SortBtn>
                  </th>
                  {canWrite && <th className="px-4 py-3 w-24"></th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTable rows={6} cols={colSpan} />
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-20 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">📭</div>
                      <p className="text-slate-600 font-semibold">No records found</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {search ? 'Try a different search term' : 'Add your first record to get started'}
                      </p>
                      {canWrite && !search && (
                        <button onClick={openAdd} className="btn-primary mt-4 text-xs">+ Add Record</button>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayed.map((r, idx) => (
                    <tr key={r.id}
                      className={`table-row ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-4 py-3 text-slate-500 text-xs font-medium whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{r.category}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${r.type === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                          {r.type === 'INCOME' ? '↑' : '↓'} {r.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-[160px] truncate text-xs">
                        {r.description || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold uppercase shrink-0">
                            {r.username?.[0]}
                          </div>
                          <span className="text-slate-500 text-xs truncate max-w-[80px]">{r.username}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold text-sm whitespace-nowrap ${
                        r.type === 'INCOME' ? 'text-income-text' : 'text-expense-text'
                      }`}>
                        {r.type === 'INCOME' ? '+' : '−'}{formatINR(r.amount)}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {(isAdmin || r.username === user.username) && (
                              <button onClick={() => openEdit(r)}
                                className="btn-ghost text-xs px-2 py-1 text-brand-600 hover:bg-brand-50">
                                Edit
                              </button>
                            )}
                            {isAdmin && (
                              <button onClick={() => setDeleteTarget(r)}
                                className="btn-ghost text-xs px-2 py-1 text-red-500 hover:bg-red-50">
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {totalPages} · {totalElements} records
              </span>
              <div className="flex gap-1">
                {[
                  { label: '«', action: () => setPage(0),                    disabled: page === 0 },
                  { label: '‹', action: () => setPage((p) => p - 1),         disabled: page === 0 },
                  { label: '›', action: () => setPage((p) => p + 1),         disabled: page >= totalPages - 1 },
                  { label: '»', action: () => setPage(totalPages - 1),       disabled: page >= totalPages - 1 },
                ].map(({ label, action, disabled }) => (
                  <button key={label} onClick={action} disabled={disabled}
                    className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-40 min-w-[32px]">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddRecordModal
          editRecord={editRecord}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            load()
            toast.success(editRecord ? 'Record updated successfully' : 'Record created successfully')
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete the ${deleteTarget.type.toLowerCase()} of ${formatINR(deleteTarget.amount)} in "${deleteTarget.category}"? This action cannot be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast toasts={toasts} remove={remove} />
    </Layout>
  )
}
