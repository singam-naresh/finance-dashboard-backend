import axios from 'axios'

// ── Axios instance ────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor: attach JWT ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

// ── Response interceptor: global error handling ───────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status

    if (status === 401) {
      // Session expired — clear and redirect
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Dispatch a custom event so Toast can show "Session expired"
      window.dispatchEvent(new CustomEvent('auth:expired'))
      window.location.href = '/login'
    }

    // 403 / 500 / network errors are handled per-call in components
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const login = (username, password) =>
  api.post('/auth/login', { username, password })

export const register = (username, email, password) =>
  api.post('/auth/register', { username, email, password })

// ── Dashboard ─────────────────────────────────────────────────
export const getDashboardSummary = () =>
  api.get('/dashboard/summary')

// ── Records ───────────────────────────────────────────────────
// GET /api/records uses explicit sortBy + direction params
export const getRecords = (page = 0, size = 10, sortBy = 'date', direction = 'desc') =>
  api.get('/records', { params: { page, size, sortBy, direction } })

export const createRecord = (data) =>
  api.post('/records', data)

export const updateRecord = (id, data) =>
  api.put(`/records/${id}`, data)

export const deleteRecord = (id) =>
  api.delete(`/records/${id}`)

// GET /api/records/filter/type uses Spring Pageable → sort=field,direction
export const filterByType = (type, page = 0, size = 10, sortBy = 'date', direction = 'desc') =>
  api.get('/records/filter/type', {
    params: { type, page, size, sort: `${sortBy},${direction}` },
  })

// GET /api/records/filter/category uses Spring Pageable → sort=field,direction
export const filterByCategory = (category, page = 0, size = 10, sortBy = 'date', direction = 'desc') =>
  api.get('/records/filter/category', {
    params: { category, page, size, sort: `${sortBy},${direction}` },
  })

// ── Users ─────────────────────────────────────────────────────
export const getUsers = (page = 0) =>
  api.get('/users', { params: { page, size: 20 } })

export default api
