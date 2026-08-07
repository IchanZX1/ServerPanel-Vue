import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export interface AuthUser {
  id: string
  name: string
  username: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const user = ref<AuthUser | null>(JSON.parse(localStorage.getItem('auth_user') ?? 'null'))

  const isLoggedIn = computed(() => !!accessToken.value)

  function setTokenAndUser(token: string, u: AuthUser) {
    accessToken.value = token
    user.value = u
    localStorage.setItem('access_token', token)
    localStorage.setItem('auth_user', JSON.stringify(u))
  }

  function clear() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_user')
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  async function login(email: string, password: string, turnstileToken?: string): Promise<void> {
    const { data } = await axios.post(
      `${BASE}/api/auth/login`,
      { email, password, ...(turnstileToken ? { turnstileToken } : {}) },
      { withCredentials: true },
    )
    setTokenAndUser(data.data.accessToken, data.data.user)
  }

  // ── Register ─────────────────────────────────────────────────────────────────
  async function register(name: string, username: string, email: string, password: string, turnstileToken?: string): Promise<void> {
    await axios.post(`${BASE}/api/auth/signup`, {
      name,
      username,
      email,
      password,
      ...(turnstileToken ? { turnstileToken } : {}),
    })
  }

  // ── Forgot password ──────────────────────────────────────────────────────────
  async function forgotPassword(email: string): Promise<void> {
    await axios.post(`${BASE}/api/auth/forgot-password`, { email })
  }

  // ── Refresh access token (called by axios interceptor) ───────────────────────
  async function refresh(): Promise<string> {
    const { data } = await axios.post(
      `${BASE}/api/auth/refresh`,
      {},
      { withCredentials: true },
    )
    const newToken: string = data.data.accessToken
    accessToken.value = newToken
    localStorage.setItem('access_token', newToken)
    return newToken
  }

  // ── Logout ───────────────────────────────────────────────────────────────────
  async function logout(): Promise<void> {
    try {
      await axios.post(
        `${BASE}/api/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken.value}` },
          withCredentials: true,
        },
      )
    } catch {
      // Best-effort; clear local state regardless
    } finally {
      clear()
    }
  }

  return { accessToken, user, isLoggedIn, login, register, forgotPassword, refresh, logout, clear, setTokenAndUser }
})
