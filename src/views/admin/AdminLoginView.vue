<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuthStore } from '../../stores/adminAuth'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const adminAuth = useAdminAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

// Jika sudah login, redirect ke admin dashboard
onMounted(() => {
  if (adminAuth.isLoggedIn) router.replace('/admin/dashboard')
})

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Email dan password wajib diisi.'
    return
  }
  loading.value = true
  error.value = null
  try {
    await adminAuth.login(email.value, password.value)
    const redirect = (route.query['redirect'] as string) ?? '/admin/dashboard'
    router.push(redirect)
  } catch (e) {
    if (axios.isAxiosError(e)) {
      error.value = e.response?.data?.message ?? 'Login gagal. Periksa kredensial admin.'
    } else {
      error.value = 'Terjadi kesalahan. Coba lagi.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="admin-login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">Admin Panel</h1>
        <p class="login-subtitle">ZXcoderID Server Management</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="admin@example.com"
            autocomplete="username"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  padding: 24px;
}

.login-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  margin-bottom: 32px;
  text-align: center;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 14px;
  color: #94a3b8;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e1;
}

.form-input {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 14px;
  color: #f1f5f9;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #3b82f6;
}

.form-error {
  font-size: 13px;
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 6px;
  padding: 8px 12px;
}

.login-btn {
  padding: 12px;
  border-radius: 8px;
  background: #3b82f6;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.login-btn:hover:not(:disabled) {
  background: #2563eb;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
