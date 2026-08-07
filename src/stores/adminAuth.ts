import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const TOKEN_KEY = 'admin_access_token'
const USER_KEY = 'admin_user'

export interface AdminUser {
  id: string
  email: string
  name: string
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!))
    return (payload.exp * 1000) < Date.now()
  } catch {
    return true
  }
}

function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  if (isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return null
  }
  return token
}

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const accessToken = ref<string | null>(getStoredToken())
  const user = ref<AdminUser | null>(JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'))
  const isLoggedIn = computed(() => !!accessToken.value)

  function setTokenAndUser(token: string, u: AdminUser) {
    accessToken.value = token
    user.value = u
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  function clear() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  async function login(email: string, password: string): Promise<void> {
    const { data } = await axios.post(`${BASE}/api/admin/login`, { email, password })
    setTokenAndUser(data.data.accessToken, data.data.admin)
  }

  async function logout(): Promise<void> {
    try {
      await axios.post(
        `${BASE}/api/admin/logout`,
        {},
        { headers: { Authorization: `Bearer ${accessToken.value}` } },
      )
    } catch { /* best-effort */ }
    finally { clear() }
  }

  return { accessToken, user, isLoggedIn, login, logout, clear, setTokenAndUser }
})
