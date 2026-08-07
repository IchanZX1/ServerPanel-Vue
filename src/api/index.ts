import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useAdminAuthStore } from '../stores/adminAuth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  withCredentials: true,
  timeout: 15000,
})

// ── Request: inject Authorization header (only if not already set) ────────────
api.interceptors.request.use((config) => {
  if (!config.headers['Authorization']) {
    const auth = useAuthStore()
    if (auth.accessToken) {
      config.headers['Authorization'] = `Bearer ${auth.accessToken}`
    }
  }
  return config
})

// ── Response: auto-refresh on 401 ─────────────────────────────────────────────
let refreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true

      // Admin route — redirect to admin login
      const url: string = original.url ?? ''
      if (url.includes('/admin/')) {
        const adminAuth = useAdminAuthStore()
        adminAuth.clear()
        window.location.href = '/admin/login'
        return Promise.reject(err)
      }

      // Customer route — try refresh token
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers['Authorization'] = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      refreshing = true
      try {
        const auth = useAuthStore()
        const newToken = await auth.refresh()
        queue.forEach((cb) => cb(newToken))
        queue = []
        original.headers['Authorization'] = `Bearer ${newToken}`
        return api(original)
      } catch {
        const auth = useAuthStore()
        auth.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(err)
  },
)

export default api
