<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShieldCheck, Zap, BarChart3, X } from 'lucide-vue-next'
import { initParticles, tsParticles, defaultParticlesOptions } from '../utils/particles'
import type { Container } from '@tsparticles/engine'
import logoSvg from '../assets/logo.svg'
import { useAuthStore } from '../stores/auth'
import TurnstileWidget from '../components/TurnstileWidget.vue'
import { TURNSTILE_SITE_KEY } from '../utils/turnstile'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// Toggle Card View (login vs register)
const currentCard = ref<'login' | 'register'>('login')

// Login form
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const loginError = ref<string | null>(null)
const loginLoading = ref(false)

// Modal state (for forgot password)
const activeModal = ref<'forgot' | null>(null)

// Register form
const regName = ref('')
const regUsername = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirm = ref('')
const regError = ref<string | null>(null)
const regLoading = ref(false)

// Turnstile captcha
const loginTurnstileToken = ref('')
const regTurnstileToken = ref('')
const loginWidget = ref<InstanceType<typeof TurnstileWidget> | null>(null)
const regWidget = ref<InstanceType<typeof TurnstileWidget> | null>(null)

// Notifikasi sukses registrasi (tampil di kartu login)
const regSuccess = ref<string | null>(null)

function switchCard(card: 'login' | 'register') {
  currentCard.value = card
  loginTurnstileToken.value = ''
  regTurnstileToken.value = ''
  loginError.value = null
  regError.value = null
}

async function handleLogin() {
  if (!email.value || !password.value) return
  if (!loginTurnstileToken.value) {
    loginError.value = 'Harap selesaikan verifikasi captcha terlebih dahulu.'
    return
  }
  loginLoading.value = true
  loginError.value = null
  try {
    await auth.login(email.value, password.value, loginTurnstileToken.value)
    const redirect = (route.query['redirect'] as string) ?? '/dashboard'
    router.push(redirect)
  } catch (e) {
    loginTurnstileToken.value = ''
    loginWidget.value?.reset()
    if (axios.isAxiosError(e)) {
      loginError.value = e.response?.data?.message ?? 'Login gagal. Periksa email dan password.'
    } else {
      loginError.value = 'Terjadi kesalahan. Coba lagi.'
    }
  } finally {
    loginLoading.value = false
  }
}

async function handleRegister() {
  if (!regName.value || !regUsername.value || !regEmail.value || !regPassword.value) {
    regError.value = 'Semua field wajib diisi.'
    return
  }
  if (regPassword.value !== regConfirm.value) {
    regError.value = 'Password tidak cocok.'
    return
  }
  if (!/^[a-z0-9_]+$/.test(regUsername.value) || regUsername.value.length < 3) {
    regError.value = 'Username hanya boleh huruf kecil, angka, dan underscore (min. 3 karakter).'
    return
  }
  if (regPassword.value.length < 8 || !/[A-Z]/.test(regPassword.value) || !/[0-9]/.test(regPassword.value)) {
    regError.value = 'Password minimal 8 karakter dan harus mengandung huruf besar & angka.'
    return
  }
  if (!regTurnstileToken.value) {
    regError.value = 'Harap selesaikan verifikasi captcha terlebih dahulu.'
    return
  }
  regLoading.value = true
  regError.value = null
  try {
    await auth.register(regName.value, regUsername.value, regEmail.value, regPassword.value, regTurnstileToken.value)
    // Sukses → pindah ke kartu login, prefill email (token Turnstile single-use,
    // tidak bisa dipakai ulang untuk login otomatis)
    email.value = regEmail.value
    switchCard('login')
    regSuccess.value = 'Akun berhasil dibuat! Silakan masuk dengan akun kamu.'
  } catch (e) {
    regTurnstileToken.value = ''
    regWidget.value?.reset()
    if (axios.isAxiosError(e)) {
      const serverErrors = e.response?.data?.errors as Record<string, string[]> | undefined
      if (serverErrors && Object.keys(serverErrors).length > 0) {
        regError.value = Object.values(serverErrors).flat().join(' ')
      } else {
        regError.value = e.response?.data?.message ?? 'Registrasi gagal. Coba lagi.'
      }
    } else {
      regError.value = 'Terjadi kesalahan. Coba lagi.'
    }
  } finally {
    regLoading.value = false
  }
}

// Forgot form
const forgotEmail = ref('')
const forgotSent = ref(false)
const forgotError = ref<string | null>(null)
const forgotLoading = ref(false)

function openForgotModal() {
  activeModal.value = 'forgot'
  forgotError.value = null
}

function closeModal() {
  activeModal.value = null
  forgotSent.value = false
  forgotError.value = null
}

async function handleForgot() {
  if (!forgotEmail.value) {
    forgotError.value = 'Email wajib diisi.'
    return
  }
  forgotLoading.value = true
  forgotError.value = null
  try {
    await auth.forgotPassword(forgotEmail.value)
    forgotSent.value = true
  } catch (e) {
    if (axios.isAxiosError(e)) {
      forgotError.value = e.response?.data?.message ?? 'Gagal mengirim email.'
    } else {
      forgotError.value = 'Terjadi kesalahan. Coba lagi.'
    }
  } finally {
    forgotLoading.value = false
  }
}

const particlesContainerId = 'login-particles'
let particlesContainer: Container | undefined

onMounted(async () => {
  await initParticles()
  particlesContainer = await tsParticles.load({
    id: particlesContainerId,
    options: defaultParticlesOptions,
  })
})

onUnmounted(() => {
  particlesContainer?.destroy()
})
</script>

<template>
  <div class="login-page">
    <!-- Particles background -->
    <div :id="particlesContainerId" class="login-particles" aria-hidden="true"></div>

    <div class="login-container">
      <!-- Left Hero -->
      <div class="left-hero">
        <div class="hero-content">
          <h1 class="hero-title">
            <span>ZXcoderID </span>
            <span class="highlight-text">Server's</span>
          </h1>
          <p class="hero-tagline">Create Your Own Server In Here</p>
          <p class="hero-description">
            Run various applications with high performance and an easy-to-use panel.
            Suitable for personal, community, and business needs.
          </p>
          <div class="feature-pills">
            <div class="pill">
              <ShieldCheck :size="16" class="pill-icon" />
              <span>DDoS Protect</span>
            </div>
            <div class="pill">
              <Zap :size="16" class="pill-icon" />
              <span>Faster Server</span>
            </div>
            <div class="pill">
              <BarChart3 :size="16" class="pill-icon" />
              <span>Simple Manage</span>
            </div>
          </div>
        </div>
        <div class="dev-footer-card">
          <p class="dev-title">Development by IchanZX ZXcoderID</p>
          <p class="dev-copyright">© 2026 ZXcoderID. Seluruh hak cipta dilindungi.</p>
        </div>
      </div>

      <!-- Right Form Card Wrapper with Swipe Animation -->
      <div class="right-card-wrapper">
        <Transition name="card-swipe" mode="out-in">

          <!-- ── LOGIN CARD ── -->
          <div v-if="currentCard === 'login'" key="login" class="login-card">
            <div class="logo-box">
              <img :src="logoSvg" alt="ZXcoderID Logo" class="logo-img" />
            </div>
            <h2 class="card-title">Welcome back!</h2>
            <p class="card-subtitle">Please sign-in to your account to view the dashboard</p>

            <button class="google-btn" disabled style="opacity:0.4;cursor:not-allowed;">
              Google Account (Coming Soon)
            </button>

            <div class="form-divider">
              <span class="divider-text">Or Continue with email</span>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
              <div class="form-group">
                <input
                  v-model="email"
                  type="text"
                  class="form-input"
                  placeholder="Email / Username"
                  autocomplete="username"
                  required
                />
              </div>
              <div class="form-group">
                <input
                  v-model="password"
                  type="password"
                  class="form-input"
                  placeholder="Password"
                  autocomplete="current-password"
                  required
                />
              </div>
              <div class="form-options">
                <label class="remember-label">
                  <input v-model="rememberMe" type="checkbox" class="checkbox-input" />
                  <span>Remember Me</span>
                </label>
                <button type="button" class="forgot-link" @click="openForgotModal">
                  Forgot Password?
                </button>
              </div>
              <p v-if="regSuccess" class="form-success">{{ regSuccess }}</p>
              <div class="captcha-field">
                <TurnstileWidget
                  v-if="TURNSTILE_SITE_KEY"
                  ref="loginWidget"
                  theme="dark"
                  @success="loginTurnstileToken = $event"
                  @expired="loginTurnstileToken = ''"
                />
              </div>
              <p v-if="loginError" class="form-error">{{ loginError }}</p>
              <button type="submit" class="submit-btn" :disabled="loginLoading">
                {{ loginLoading ? 'Memproses...' : 'Masuk' }}
              </button>
            </form>

            <div class="card-footer">
              <span>New on our platform? </span>
              <button type="button" class="create-link" @click="switchCard('register')">
                Create an account
              </button>
            </div>
          </div>

          <!-- ── CREATE ACCOUNT CARD (REGISTER) ── -->
          <div v-else key="register" class="login-card">
            <div class="logo-box">
              <img :src="logoSvg" alt="ZXcoderID Logo" class="logo-img" />
            </div>
            <h2 class="card-title">Create Account</h2>
            <p class="card-subtitle">Join ZXcoderID to manage high performance servers</p>

            <button class="google-btn" disabled style="opacity:0.4;cursor:not-allowed;">
              Google Account (Coming Soon)
            </button>

            <div class="form-divider">
              <span class="divider-text">Or Register with email</span>
            </div>

            <form @submit.prevent="handleRegister" class="login-form">
              <div class="form-group">
                <input
                  v-model="regName"
                  type="text"
                  class="form-input"
                  placeholder="Full Name"
                  required
                />
              </div>
              <div class="form-group">
                <input
                  v-model="regUsername"
                  type="text"
                  class="form-input"
                  placeholder="Username"
                  required
                />
                <p class="field-hint">Huruf kecil, angka, dan underscore (min. 3 karakter)</p>
              </div>
              <div class="form-group">
                <input
                  v-model="regEmail"
                  type="email"
                  class="form-input"
                  placeholder="Email Address"
                  required
                />
              </div>
              <div class="form-group">
                <input
                  v-model="regPassword"
                  type="password"
                  class="form-input"
                  placeholder="Password"
                  required
                />
                <p class="field-hint">Min. 8 karakter, wajib huruf besar & angka</p>
              </div>
              <div class="form-group">
                <input
                  v-model="regConfirm"
                  type="password"
                  class="form-input"
                  placeholder="Confirm Password"
                  required
                />
              </div>
              <p v-if="regError" class="form-error">{{ regError }}</p>
              <div class="captcha-field">
                <TurnstileWidget
                  v-if="TURNSTILE_SITE_KEY"
                  ref="regWidget"
                  theme="dark"
                  @success="regTurnstileToken = $event"
                  @expired="regTurnstileToken = ''"
                />
              </div>
              <button type="submit" class="submit-btn" :disabled="regLoading">
                {{ regLoading ? 'Memproses...' : 'Create Account' }}
              </button>
            </form>

            <div class="card-footer">
              <span>Already have an account? </span>
              <button type="button" class="create-link" @click="switchCard('login')">
                Sign in
              </button>
            </div>
          </div>

        </Transition>
      </div>
    </div>

    <!-- ── Forgot Password Modal overlay ── -->
    <Transition name="modal-fade">
      <div v-if="activeModal === 'forgot'" class="modal-overlay" @click.self="closeModal" aria-modal="true" role="dialog">
        <div class="modal-card">
          <button class="modal-close" @click="closeModal" aria-label="Close">
            <X :size="18" />
          </button>

          <template v-if="!forgotSent">
            <h2 class="modal-title">Forgot Password?</h2>
            <p class="modal-subtitle">Enter your email and we'll send a reset link</p>
            <form @submit.prevent="handleForgot" class="modal-form">
              <input v-model="forgotEmail" type="email" class="form-input" placeholder="Email Address" required />
              <p v-if="forgotError" class="form-error">{{ forgotError }}</p>
              <button type="submit" class="submit-btn" :disabled="forgotLoading">
                {{ forgotLoading ? 'Mengirim...' : 'Send Reset Link' }}
              </button>
            </form>
            <div class="modal-footer">
              Remembered your password?
              <button type="button" class="create-link" @click="closeModal">Back to Sign in</button>
            </div>
          </template>

          <template v-else>
            <div class="sent-state">
              <div class="sent-icon" aria-hidden="true">✉</div>
              <h2 class="modal-title">Check your email</h2>
              <p class="modal-subtitle">
                We sent a reset link to <strong>{{ forgotEmail }}</strong>.<br/>
                Check your inbox and follow the instructions.
              </p>
              <button class="submit-btn" @click="closeModal">Back to Sign in</button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Page ── */
.login-page {
  min-height: 100vh;
  width: 100%;
  background-color: #060810;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

.login-particles {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

/* ── Left Hero ── */
.left-hero {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 520px;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
}

.highlight-text { color: #00a3ff; }

.hero-tagline {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.hero-description {
  font-size: 15px;
  line-height: 1.6;
  color: #cbd5e1;
  max-width: 440px;
}

.feature-pills {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: #092c4c;
  border: 1px solid rgba(0, 163, 255, 0.3);
  color: #00a3ff;
  font-size: 12px;
  font-weight: 600;
}

.pill-icon { color: #00a3ff; }

.dev-footer-card {
  background: rgba(9, 25, 46, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 163, 255, 0.2);
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 40px;
}

.dev-title { font-size: 15px; font-weight: 700; color: #ffffff; }
.dev-copyright { font-size: 12px; color: #64748b; }

/* ── Login Card Wrapper & Cards ── */
.right-card-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(11, 18, 32, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid #182338;
  border-radius: 24px;
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  will-change: transform, opacity;
}

.logo-box {
  width: 120px;
  height: 90px;
  border: 2px solid #2a3854;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  background: #080d19;
  padding: 12px;
}

.logo-img { width: 52px; height: 52px; object-fit: contain; }

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.card-subtitle {
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 24px;
}

.google-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: #341a54;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid rgba(179, 87, 255, 0.3);
  transition: var(--transition-fast);
}

.google-btn:hover {
  background: #462272;
  box-shadow: 0 4px 15px rgba(179, 87, 255, 0.25);
}

.form-divider {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 20px 0;
}

.form-divider::before {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 50%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.divider-text {
  position: relative;
  padding: 0 12px;
  font-size: 11px;
  color: #64748b;
  background: rgba(11, 18, 32, 0.85);
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  background: #18152e;
  border: 1px solid #2a244d;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: var(--transition-fast);
  font-family: var(--font-family);
}

.form-input::placeholder { color: #64748b; }

.form-input:focus {
  border-color: #00a3ff;
  box-shadow: 0 0 0 2px rgba(0, 163, 255, 0.2);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  cursor: pointer;
}

.checkbox-input { accent-color: #00a3ff; }

.forgot-link {
  color: #00a3ff;
  font-size: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
}

.forgot-link:hover { text-decoration: underline; }

.form-error {
  font-size: 12px;
  color: #ef4444;
  text-align: center;
}

.form-success {
  font-size: 12px;
  color: #00e676;
  text-align: center;
}

.captcha-field {
  margin-top: 4px;
}

.field-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: #4a1d7c;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  margin-top: 6px;
  transition: var(--transition-fast);
  font-family: var(--font-family);
  border: none;
  cursor: pointer;
}

.submit-btn:hover {
  background: #5d259c;
  box-shadow: 0 4px 15px rgba(93, 37, 156, 0.4);
}

.card-footer {
  margin-top: 20px;
  font-size: 12px;
  color: #94a3b8;
}

.create-link {
  color: #00a3ff;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: inherit;
}

.create-link:hover { text-decoration: underline; }

/* ── Card Swipe Transition (Slide Left/Right) ── */
.card-swipe-enter-active,
.card-swipe-leave-active {
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-swipe-enter-from {
  opacity: 0;
  transform: translateX(45px) scale(0.96);
}

.card-swipe-leave-to {
  opacity: 0;
  transform: translateX(-45px) scale(0.96);
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.modal-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  background: #0b1220;
  border: 1px solid #1e2d45;
  border-radius: 24px;
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.7);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: var(--transition-fast);
  background: none;
  border: none;
  cursor: pointer;
}

.modal-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.modal-subtitle {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 4px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-footer {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  margin-top: 4px;
}

.sent-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.sent-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

/* ── Modal transition ── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  transform: translateY(12px);
  opacity: 0;
}

/* ── Mobile ── */
@media (max-width: 991px) {
  .login-container {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .left-hero { min-height: unset; }
}

@media (max-width: 560px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-card {
    padding: 24px 20px;
    border-radius: 18px;
  }
}
</style>
