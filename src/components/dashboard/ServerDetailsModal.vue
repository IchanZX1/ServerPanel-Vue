<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  X,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  KeyRound,
  User,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  RefreshCw,
} from 'lucide-vue-next'
import type { ServerItem } from '../../data/dummyData'
import api from '../../api'
import Skeleton from '../ui/Skeleton.vue'

const props = defineProps<{
  isOpen: boolean
  server: ServerItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'renewed'): void
}>()

// Password Sensor Visibility State
const showPassword = ref(false)

// Copy State Feedback
const copiedField = ref<'username' | 'password' | 'ip' | null>(null)

const panelUsernameFallback = '-'
const panelPasswordFallback = 'Sama dengan password akun'

const toggleShowPassword = () => {
  showPassword.value = !showPassword.value
}

const copyToClipboard = (text: string, field: 'username' | 'password' | 'ip') => {
  navigator.clipboard.writeText(text)
  copiedField.value = field
  setTimeout(() => {
    copiedField.value = null
  }, 2000)
}

// ─── Renew (Perpanjang Masa Aktif) ────────────────────────────────────────────
const renewStep = ref<'idle' | 'payment' | 'expired' | 'success'>('idle')
const renewMonths = ref(1)
const renewError = ref<string | null>(null)
const renewLoading = ref(false)
const renewTotal = ref(0)

const paymentId = ref<string | null>(null)
const invoiceId = ref<string | null>(null)
const redirectUrl = ref<string | null>(null)
const qrBase64 = ref<string | null>(null)
const paymentLoading = ref(false)
const checkingStatus = ref(false)
const timeLeft = ref(180)

const RENEW_TIMER_SECONDS = 180 // 3 menit masa aktif pembayaran

let timerInterval: ReturnType<typeof setInterval> | null = null
let pollInterval: ReturnType<typeof setInterval> | null = null

const renewTotalPrice = computed(() => (props.server?.productPrice ?? 0) * renewMonths.value)

const formattedRenewTotal = computed(() => {
  const value = renewTotal.value || renewTotalPrice.value
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
})

const formattedTimer = computed(() => {
  const mins = Math.floor(timeLeft.value / 60)
  const secs = timeLeft.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const startTimer = (seconds: number) => {
  stopTimer()
  timeLeft.value = seconds
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      stopTimer()
      stopPolling()
      renewStep.value = 'expired'
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

const resetRenewState = () => {
  stopPolling()
  renewStep.value = 'idle'
  renewMonths.value = 1
  renewError.value = null
  renewLoading.value = false
  renewTotal.value = 0
  paymentId.value = null
  invoiceId.value = null
  redirectUrl.value = null
  qrBase64.value = null
  paymentLoading.value = false
  checkingStatus.value = false
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      stopTimer()
      resetRenewState()
    }
  },
)

watch(
  () => props.server?.id,
  () => {
    if (props.isOpen) {
      stopTimer()
      resetRenewState()
    }
  },
)

const startRenew = async () => {
  if (renewLoading.value || !props.server) return
  renewLoading.value = true
  renewError.value = null
  try {
    const { data } = await api.post('/api/server/renew', {
      serverId: props.server.id,
      extendMonths: renewMonths.value,
    })
    const d = data.data
    renewStep.value = 'payment'
    renewTotal.value = Number(d.totalPrice) || renewTotalPrice.value
    paymentId.value = d.paymentId ?? null
    invoiceId.value = d.invoiceId ?? null
    redirectUrl.value = d.redirectUrl ?? null
    qrBase64.value = d.qrBase64 ?? null
    const secondsLeft = Math.max(
      1,
      Math.min(RENEW_TIMER_SECONDS, Math.ceil((new Date(d.expiredAt).getTime() - Date.now()) / 1000)),
    )
    startTimer(secondsLeft)
    startPolling()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      ?? 'Gagal membuat pembayaran. Coba lagi.'
    renewError.value = msg
  } finally {
    renewLoading.value = false
  }
}

const startPolling = () => {
  stopPolling()
  void pollStatus()
  pollInterval = setInterval(() => {
    void pollStatus()
  }, 10000)
}

const pollStatus = async () => {
  if (checkingStatus.value || !paymentId.value) return
  checkingStatus.value = true
  try {
    const { data } = await api.post('/api/payment/status', { paymentId: paymentId.value })
    const s = data.data
    if (s.status === 'paid') {
      stopTimer()
      stopPolling()
      renewStep.value = 'success'
      emit('renewed')
    } else if (['expired', 'failed', 'cancelled'].includes(s.status)) {
      stopTimer()
      stopPolling()
      renewStep.value = 'expired'
    }
  } catch {
    // Abaikan — polling berikutnya akan mencoba lagi
  } finally {
    checkingStatus.value = false
  }
}

const resetToIdle = () => {
  stopTimer()
  resetRenewState()
}

const handleClose = () => {
  stopTimer()
  resetRenewState()
  emit('close')
}

onUnmounted(() => {
  stopTimer()
  stopPolling()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen && server" class="modal-overlay" @click.self="handleClose">
        <div class="modal-card">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-main">
              <div class="server-icon-box">
                <Server :size="24" />
              </div>
              <div class="header-titles">
                <div class="title-row">
                  <h2 class="server-title">{{ server.name }}</h2>
                  <span class="status-badge" :class="server.status">
                    <span class="badge-dot"></span>
                    {{ server.status === 'active' ? 'Active' : 'Suspended' }}
                  </span>
                </div>
                <span class="server-id">ID: {{ server.id }}</span>
              </div>
            </div>
            <button class="close-btn" @click="handleClose">
              <X :size="20" />
            </button>
          </div>

          <div class="modal-body">
            <!-- SPECIFICATIONS SECTION -->
            <div class="section-container">
              <h3 class="section-label">Server Specifications</h3>
              <div class="specs-grid">
                <div class="spec-card">
                  <Cpu :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">CPU Allocation</span>
                    <span class="spec-val">{{ server.specs?.cpu || '30% CPU Allocation' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <User :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">RAM Allocation</span>
                    <span class="spec-val">{{ server.specs?.ram || '1 GB RAM' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <HardDrive :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">Storage</span>
                    <span class="spec-val">{{ server.specs?.storage || server.storageType }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <Wifi :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">Bandwidth</span>
                    <span class="spec-val">{{ server.specs?.bandwidth || 'Unlimited Bandwidth' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <Globe :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">Node & IP Address</span>
                    <span class="spec-val">{{ server.ipAddress || '103.147.222.10:2022' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <Calendar :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">Active Until</span>
                    <span class="spec-val highlight-green">{{ server.activeUntil }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- PANEL CREDENTIALS SECTION -->
            <div class="section-container credentials-container">
              <div class="cred-header">
                <KeyRound :size="18" class="cred-icon" />
                <h3 class="section-label">Panel Login Credentials</h3>
              </div>

              <div class="credentials-form">
                <!-- Username Field -->
                <div class="field-group">
                  <label class="field-label">Panel Username</label>
                  <div class="field-box">
                    <span class="field-value">{{ server.panelUsername || panelUsernameFallback }}</span>
                    <button
                      class="copy-btn"
                      @click="copyToClipboard(server.panelUsername || panelUsernameFallback, 'username')"
                      title="Copy Username"
                    >
                      <Check v-if="copiedField === 'username'" :size="16" class="check-icon" />
                      <Copy v-else :size="16" />
                    </button>
                  </div>
                </div>

                <!-- Password Field with Sensor Eye Toggle -->
                <div class="field-group">
                  <label class="field-label">Panel Password</label>
                  <div class="field-box">
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      class="field-input-password"
                      :value="server.panelPassword || panelPasswordFallback"
                      readonly
                    />
                    <!-- Eye Sensor Toggle Button -->
                    <button
                      class="eye-btn"
                      @click="toggleShowPassword"
                      :title="showPassword ? 'Hide Password' : 'Show Password'"
                    >
                      <EyeOff v-if="showPassword" :size="18" />
                      <Eye v-else :size="18" />
                    </button>
                    <!-- Copy Button -->
                    <button
                      class="copy-btn"
                      @click="copyToClipboard(server.panelPassword || panelPasswordFallback, 'password')"
                      title="Copy Password"
                    >
                      <Check v-if="copiedField === 'password'" :size="16" class="check-icon" />
                      <Copy v-else :size="16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- RENEW SECTION -->
            <div class="section-container renew-container">
              <div class="cred-header">
                <Calendar :size="18" class="renew-icon" />
                <h3 class="section-label">Perpanjang Masa Aktif</h3>
              </div>

              <!-- IDLE: pilih durasi -->
              <div v-if="renewStep === 'idle'" class="renew-idle">
                <div class="renew-month-grid">
                  <button
                    v-for="m in [1, 3, 6, 12]"
                    :key="m"
                    class="renew-month-pill"
                    :class="{ active: renewMonths === m }"
                    @click="renewMonths = m"
                    type="button"
                  >
                    {{ m }} Bulan
                  </button>
                </div>
                <div class="renew-summary">
                  <span class="renew-summary-label">Total yang harus dibayar</span>
                  <span class="renew-summary-total">{{ formattedRenewTotal }}</span>
                </div>
                <button class="renew-start-btn" @click="startRenew" :disabled="renewLoading">
                  <RefreshCw :size="16" />
                  <span>{{ renewLoading ? 'Membuat pembayaran...' : 'Perpanjang Sekarang' }}</span>
                </button>
                <p v-if="renewError" class="renew-error">{{ renewError }}</p>
              </div>

              <!-- PAYMENT: QRIS -->
              <div v-else-if="renewStep === 'payment'" class="renew-payment">
                <div class="timer-alert-box">
                  <div class="timer-left">
                    <Clock :size="18" class="clock-icon" />
                    <span>Batas Pembayaran</span>
                  </div>
                  <div class="timer-countdown">{{ formattedTimer }}</div>
                </div>

                <div class="checkout-summary">
                  <div class="summary-line">
                    <span class="label">Server</span>
                    <span class="value">{{ server.name }}</span>
                  </div>
                  <div class="summary-line">
                    <span class="label">Durasi</span>
                    <span class="value">{{ renewMonths }} Bulan</span>
                  </div>
                  <div class="summary-line highlight">
                    <span class="label">Total</span>
                    <span class="value total">{{ formattedRenewTotal }}</span>
                  </div>
                </div>

                <div class="qris-card">
                  <div class="qris-header">
                    <QrCode :size="18" />
                    <span>Scan QRIS</span>
                  </div>
                  <div class="qr-placeholder">
                    <div v-if="paymentLoading" class="qr-skeleton">
                      <Skeleton width="150px" height="150px" radius="10px" />
                    </div>
                    <img
                      v-else-if="qrBase64"
                      :src="qrBase64"
                      width="150"
                      height="150"
                      alt="QRIS"
                      class="qr-image"
                    />
                    <div v-else class="qr-missing">
                      <AlertCircle :size="24" />
                      <span>QR tidak tersedia.</span>
                    </div>
                  </div>
                  <span class="qris-sub">Gopay, OVO, Dana, ShopeePay & Semua Bank</span>
                  <a
                    v-if="redirectUrl"
                    :href="redirectUrl"
                    target="_blank"
                    rel="noopener"
                    class="qris-link"
                  >
                    Buka halaman pembayaran jika QR tidak muncul
                  </a>
                </div>

                <button
                  class="check-status-btn"
                  @click="pollStatus"
                  :disabled="checkingStatus || !paymentId"
                >
                  <Clock :size="16" />
                  <span>{{ checkingStatus ? 'Mengecek status...' : 'Saya Sudah Bayar' }}</span>
                </button>
                <button class="cancel-btn" @click="handleClose">Tutup</button>
                <p v-if="renewError" class="renew-error">{{ renewError }}</p>
              </div>

              <!-- EXPIRED -->
              <div v-else-if="renewStep === 'expired'" class="renew-state">
                <div class="state-icon-box expired">
                  <AlertCircle :size="40" />
                </div>
                <h4 class="state-title">Pembayaran Kedaluwarsa</h4>
                <p class="state-desc">Batas waktu pembayaran habis. Silakan coba perpanjang lagi.</p>
                <button class="retry-btn" @click="resetToIdle">Coba Lagi</button>
              </div>

              <!-- SUCCESS -->
              <div v-else class="renew-state">
                <div class="state-icon-box success">
                  <CheckCircle2 :size="40" />
                </div>
                <h4 class="state-title">Perpanjangan Berhasil!</h4>
                <p class="state-desc">Masa aktif server telah diperpanjang. Halaman akan diperbarui.</p>
                <button class="retry-btn" @click="handleClose">Selesai</button>
              </div>
            </div>

            <!-- Action Button: Open Panel Console -->
            <a
              :href="server.panelUrl || 'https://panel.zxcoderid.com'"
              target="_blank"
              class="login-panel-btn"
            >
              <span>Login to Panel Console</span>
              <ExternalLink :size="18" />
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 14, 0.8);
  backdrop-filter: blur(8px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 580px;
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  background: #0d1527;
  border: 1px solid #1c2a45;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 18px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.server-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 230, 118, 0.12);
  border: 1px solid rgba(0, 230, 118, 0.25);
  color: #00e676;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.server-title {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
}

.server-id {
  font-size: 12px;
  color: #64748b;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.status-badge.active {
  background: rgba(0, 230, 118, 0.15);
  color: #00e676;
  border: 1px solid rgba(0, 230, 118, 0.3);
}

.status-badge.suspended {
  background: rgba(255, 77, 77, 0.15);
  color: #ff4d4d;
  border: 1px solid rgba(255, 77, 77, 0.3);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.spec-card {
  background: #111b2f;
  border: 1px solid #1a2947;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.spec-icon {
  color: #00a3ff;
  flex-shrink: 0;
}

.spec-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.spec-name {
  font-size: 11px;
  color: #64748b;
}

.spec-val {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight-green {
  color: #00e676;
}

/* CREDENTIALS */
.credentials-container {
  background: #091121;
  border: 1px solid #1a2845;
  border-radius: 16px;
  padding: 18px;
}

.cred-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.cred-icon {
  color: #b357ff;
}

.credentials-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 10px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.field-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #141f36;
  border: 1px solid #223456;
  border-radius: 10px;
  padding: 10px 14px;
}

.field-value {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.field-input-password {
  background: none;
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  flex: 1;
  letter-spacing: 1px;
}

.eye-btn, .copy-btn {
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: var(--transition-fast);
}

.eye-btn:hover, .copy-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.check-icon {
  color: #00e676;
}

/* RENEW SECTION */
.renew-container {
  background: #091121;
  border: 1px solid #1a2845;
  border-radius: 16px;
  padding: 18px;
}

.renew-icon {
  color: #00a3ff;
}

.renew-idle,
.renew-payment {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.renew-month-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.renew-month-pill {
  padding: 9px 4px;
  border-radius: 8px;
  background: #141f36;
  border: 1px solid #223456;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  transition: var(--transition-fast);
}

.renew-month-pill:hover {
  background: #1c2b4a;
  color: #ffffff;
}

.renew-month-pill.active {
  background: #0d47a1;
  border-color: #00a3ff;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 163, 255, 0.3);
}

.renew-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0a1120;
  border: 1px solid #16243d;
  border-radius: 12px;
  padding: 12px 14px;
}

.renew-summary-label {
  font-size: 13px;
  color: #94a3b8;
}

.renew-summary-total {
  font-size: 16px;
  font-weight: 700;
  color: #00e676;
}

.renew-start-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, #00875a 0%, #00a36c 100%);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: var(--transition-fast);
}

.renew-start-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 163, 108, 0.3);
}

.renew-start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.renew-error {
  font-size: 12px;
  color: #ff4d4d;
  text-align: center;
}

.timer-alert-box {
  background: rgba(255, 77, 77, 0.12);
  border: 1px solid rgba(255, 77, 77, 0.3);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timer-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ff4d4d;
  font-size: 13px;
  font-weight: 600;
}

.clock-icon {
  animation: renew-pulse 1s infinite alternate;
}

@keyframes renew-pulse {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

.timer-countdown {
  font-size: 17px;
  font-weight: 800;
  color: #ff4d4d;
  font-family: monospace;
}

.checkout-summary {
  background: #10192e;
  border: 1px solid #1a2948;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.summary-line .label { color: #94a3b8; }
.summary-line .value { color: #ffffff; font-weight: 600; }
.summary-line .total { color: #00e676; font-size: 14px; font-weight: 700; }

.qris-card {
  background: #091121;
  border: 1px dashed #203356;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.qris-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #00a3ff;
}

.qr-placeholder {
  padding: 10px;
  background: #ffffff;
  border-radius: 12px;
}

.qr-image {
  display: block;
  image-rendering: pixelated;
}

.qr-skeleton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
}

.qr-missing {
  width: 150px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  text-align: center;
}

.qris-sub {
  font-size: 11px;
  color: #64748b;
  text-align: center;
}

.qris-link {
  font-size: 11px;
  color: #00a3ff;
  text-decoration: underline;
  text-align: center;
  word-break: break-all;
}

.check-status-btn {
  width: 100%;
  padding: 11px;
  border-radius: 10px;
  background: #00875a;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: var(--transition-fast);
}

.check-status-btn:hover {
  background: #00a36c;
}

.check-status-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  width: 100%;
  padding: 8px;
  color: #64748b;
  font-size: 13px;
  transition: var(--transition-fast);
}

.cancel-btn:hover {
  color: #94a3b8;
}

.renew-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 12px 0 4px;
}

.state-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-icon-box.expired {
  background: rgba(255, 77, 77, 0.15);
  color: #ff4d4d;
}

.state-icon-box.success {
  background: rgba(0, 230, 118, 0.15);
  color: #00e676;
}

.state-title {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.state-desc {
  font-size: 12px;
  color: #94a3b8;
  max-width: 320px;
  line-height: 1.5;
}

.retry-btn {
  width: 100%;
  padding: 11px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  background: #2a3854;
  color: #ffffff;
  margin-top: 6px;
}

.retry-btn:hover {
  background: #34456b;
}

.login-panel-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  background: #0d47a1;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  transition: var(--transition-fast);
  box-shadow: 0 4px 15px rgba(13, 71, 161, 0.3);
}

.login-panel-btn:hover {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(13, 71, 161, 0.4);
}

@media (max-width: 640px) {
  .specs-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

@media (max-width: 560px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-card {
    padding: 18px;
    border-radius: 16px;
    gap: 14px;
  }

  .modal-body {
    gap: 14px;
  }

  .modal-header {
    padding-bottom: 12px;
  }

  .header-main {
    gap: 10px;
  }

  .server-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .title-row {
    flex-wrap: wrap;
  }

  .server-title {
    font-size: 15px;
  }

  .section-label {
    font-size: 11px;
  }

  .spec-card {
    padding: 8px 10px;
    gap: 8px;
  }

  .spec-icon {
    width: 16px;
    height: 16px;
  }

  .spec-name {
    font-size: 9px;
  }

  .spec-val {
    font-size: 11px;
    white-space: normal;
    overflow: visible;
    word-break: break-word;
  }

  .credentials-container {
    padding: 12px;
  }

  .field-label {
    font-size: 11px;
  }

  .field-box {
    padding: 8px 10px;
  }

  .field-value,
  .field-input-password {
    font-size: 12px;
  }

  .login-panel-btn {
    padding: 12px;
    font-size: 13px;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
