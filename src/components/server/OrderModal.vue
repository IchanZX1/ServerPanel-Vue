<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  X,
  Server,
  Calendar,
  Mail,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowRight
} from 'lucide-vue-next'
import type { ProductItem } from '../../data/dummyData'
import { useAuthStore } from '../../stores/auth'
import api from '../../api'
import Skeleton from '../ui/Skeleton.vue'

const props = defineProps<{
  isOpen: boolean
  product: ProductItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'provisioned'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const isDev = import.meta.env.DEV

// Form States
const step = ref<'form' | 'payment' | 'expired' | 'success'>('form')
const serverName = ref('')
const email = ref(authStore.user?.email ?? '')
const durationMonths = ref(1)

// Provisioning state (dev — dibuat via /api/dev/provision-server)
const provisioning = ref(false)
const provisionError = ref<string | null>(null)
const provisionedServer = ref<{
  serverId: string
  name: string
  pterodactylServerId: number
  ipAddress: string
  activeUntil: string
  credentials: { panelUrl: string; username: string; password: string }
} | null>(null)

// Real payment state (Maelyn QRIS)
const paymentId = ref<string | null>(null)
const invoiceId = ref<string | null>(null)
const redirectUrl = ref<string | null>(null)
const qrBase64 = ref<string | null>(null)
const paymentLoading = ref(false)
const paymentError = ref<string | null>(null)
const checkingStatus = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

// Countdown timer state (dikunci ketat 3 menit = 180 detik)
const INITIAL_TIMER = 180 // 3 minutes in seconds
const timeLeft = ref(INITIAL_TIMER)
let timerInterval: ReturnType<typeof setInterval> | null = null

// Form price calculation
const numericPrice = computed(() => {
  if (!props.product) return 10000
  // Extract number from "Rp 10.000" -> 10000
  const match = props.product.price.replace(/[^\d]/g, '')
  return parseInt(match, 10) || 10000
})

const totalPrice = computed(() => {
  return numericPrice.value * durationMonths.value
})

const formattedTotalPrice = computed(() => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(totalPrice.value)
})

// Timer formatter MM:SS
const formattedTimer = computed(() => {
  const mins = Math.floor(timeLeft.value / 60)
  const secs = timeLeft.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const startTimer = (seconds: number = INITIAL_TIMER) => {
  stopTimer()
  timeLeft.value = seconds
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      stopTimer()
      stopPolling()
      step.value = 'expired'
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetPaymentState = () => {
  stopPolling()
  paymentId.value = null
  invoiceId.value = null
  redirectUrl.value = null
  qrBase64.value = null
  paymentLoading.value = false
  paymentError.value = null
  checkingStatus.value = false
}

// Reset form on open
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      step.value = 'form'
      serverName.value = props.product ? `${props.product.name} Server - 01` : 'My New Server'
      email.value = authStore.user?.email ?? ''
      durationMonths.value = 1
      provisionError.value = null
      provisionedServer.value = null
      resetPaymentState()
      stopTimer()
    } else {
      stopTimer()
      resetPaymentState()
    }
  }
)

const handleProceedToPayment = () => {
  if (!serverName.value || !email.value) return
  step.value = 'payment'
  void createOrder()
}

const createOrder = async () => {
  if (paymentLoading.value) return
  paymentLoading.value = true
  paymentError.value = null
  try {
    const { data } = await api.post('/api/order/create', {
      productId: props.product?.id,
      name: serverName.value,
      months: durationMonths.value,
    })
    const d = data.data
    paymentId.value = d.paymentId
    invoiceId.value = d.invoiceId
    redirectUrl.value = d.redirectUrl ?? null
    qrBase64.value = d.qrBase64 ?? null
    const secondsLeft = Math.max(
      1,
      Math.min(INITIAL_TIMER, Math.ceil((new Date(d.expiredAt).getTime() - Date.now()) / 1000)),
    )
    startTimer(secondsLeft)
    startPolling()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      ?? 'Gagal membuat pembayaran. Coba lagi.'
    paymentError.value = msg
  } finally {
    paymentLoading.value = false
  }
}

const refreshQr = async () => {
  if (!invoiceId.value || paymentLoading.value) return
  paymentLoading.value = true
  paymentError.value = null
  try {
    const { data } = await api.post('/api/payment/qris', { invoiceId: invoiceId.value })
    qrBase64.value = data.data?.qrBase64 ?? null
    if (!qrBase64.value) paymentError.value = 'QR tidak tersedia. Silakan hubungi admin.'
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      ?? 'Gagal memuat QR.'
    paymentError.value = msg
  } finally {
    paymentLoading.value = false
  }
}

const startPolling = () => {
  stopPolling()
  void pollStatus()
  pollInterval = setInterval(() => {
    void pollStatus()
  }, 10000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
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
      provisionedServer.value = mapProvision(s.provision)
      step.value = 'success'
      emit('provisioned')
    } else if (['expired', 'failed', 'cancelled'].includes(s.status)) {
      stopTimer()
      stopPolling()
      step.value = 'expired'
    }
  } catch {
    // Abaikan — polling berikutnya akan mencoba lagi
  } finally {
    checkingStatus.value = false
  }
}

const mapProvision = (provision: unknown) => {
  const p = provision as {
    serverId?: string
    name?: string
    pterodactylServerId?: number
    ipAddress?: string
    activeUntil?: string
    credentials?: { panelUrl?: string; username?: string; password?: string }
  } | null
  if (!p?.serverId) return null
  return {
    serverId: p.serverId,
    name: p.name ?? '',
    pterodactylServerId: p.pterodactylServerId ?? 0,
    ipAddress: p.ipAddress ?? '',
    activeUntil: p.activeUntil ?? '',
    credentials: {
      panelUrl: p.credentials?.panelUrl ?? '',
      username: p.credentials?.username ?? '',
      password: p.credentials?.password ?? '',
    },
  }
}

const retryCreateOrder = () => {
  paymentError.value = null
  void createOrder()
}

const handleSimulateSuccess = async () => {
  if (provisioning.value) return
  provisioning.value = true
  provisionError.value = null
  try {
    const { data } = await api.post('/api/dev/provision-server', {
      productId: props.product?.id,
      name: serverName.value,
      months: durationMonths.value,
    })
    provisionedServer.value = data.data
    stopTimer()
    stopPolling()
    step.value = 'success'
    emit('provisioned')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      ?? 'Gagal membuat server. Coba lagi.'
    provisionError.value = msg
  } finally {
    provisioning.value = false
  }
}

const handleClose = () => {
  stopTimer()
  resetPaymentState()
  emit('close')
}

const handleGoToDashboard = () => {
  handleClose()
  router.push('/dashboard')
}

onUnmounted(() => {
  stopTimer()
  stopPolling()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-card" :class="step">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-left">
              <div class="product-badge" v-if="product">{{ product.badge }}</div>
              <h2 class="modal-title">
                {{ step === 'form' ? 'Configure Your Server' : step === 'payment' ? 'Payment Checkout' : step === 'success' ? 'Order Successful!' : 'Transaction Expired' }}
              </h2>
            </div>
            <button class="close-btn" @click="handleClose">
              <X :size="20" />
            </button>
          </div>

          <!-- STEP 1: FORM ORDER -->
          <div v-if="step === 'form'" class="modal-body">
            <!-- Product Summary Bar -->
            <div class="product-summary-card" v-if="product">
              <div class="summary-icon">
                <Server :size="24" />
              </div>
              <div class="summary-details">
                <span class="plan-name">{{ product.name }} Plan</span>
                <span class="plan-price">{{ product.price }} / Month</span>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleProceedToPayment" class="order-form">
              <!-- Field 1: Server Name -->
              <div class="form-group">
                <label class="form-label">
                  <Edit3 :size="14" />
                  <span>Server Name</span>
                  <span class="required">*</span>
                </label>
                <input
                  v-model="serverName"
                  type="text"
                  class="form-input"
                  placeholder="e.g. Server Dunia IchanZX - 01"
                  required
                />
              </div>

              <!-- Field 2: Email -->
              <div class="form-group">
                <label class="form-label">
                  <Mail :size="14" />
                  <span>Email Address</span>
                  <span class="required">*</span>
                </label>
                <input
                  v-model="email"
                  type="email"
                  class="form-input"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <!-- Field 3: Duration Months (1-12) -->
              <div class="form-group">
                <label class="form-label">
                  <Calendar :size="14" />
                  <span>Rental Duration</span>
                  <span class="duration-highlight">{{ durationMonths }} Month{{ durationMonths > 1 ? 's' : '' }}</span>
                </label>
                <div class="duration-selector">
                  <button
                    type="button"
                    v-for="month in 12"
                    :key="month"
                    class="duration-pill"
                    :class="{ active: durationMonths === month }"
                    @click="durationMonths = month"
                  >
                    {{ month }}m
                  </button>
                </div>
              </div>

              <!-- Order Pricing Breakdown -->
              <div class="pricing-breakdown">
                <div class="breakdown-row">
                  <span>Base Price</span>
                  <span>{{ product?.price }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Duration</span>
                  <span>x {{ durationMonths }} Month(s)</span>
                </div>
                <div class="breakdown-row total-row">
                  <span>Total Amount</span>
                  <span class="total-amount">{{ formattedTotalPrice }}</span>
                </div>
              </div>

              <!-- Submit Action Button -->
              <button type="submit" class="proceed-btn">
                <span>Proceed to Payment</span>
                <ArrowRight :size="18" />
              </button>
            </form>
          </div>

          <!-- STEP 2: PAYMENT & COUNTDOWN TIMEOUT -->
          <div v-else-if="step === 'payment'" class="modal-body payment-step">
            <!-- 5 Min Timeout Alert -->
            <div class="timer-alert-box">
              <div class="timer-left">
                <Clock :size="20" class="clock-icon" />
                <span>Payment Timeout</span>
              </div>
              <div class="timer-countdown">{{ formattedTimer }}</div>
            </div>

            <!-- Payment Summary -->
            <div class="checkout-summary">
              <div class="summary-line">
                <span class="label">Server Name:</span>
                <span class="value">{{ serverName }}</span>
              </div>
              <div class="summary-line">
                <span class="label">Plan & Duration:</span>
                <span class="value">{{ product?.name }} ({{ durationMonths }} Month)</span>
              </div>
              <div class="summary-line highlight">
                <span class="label">Total Payment:</span>
                <span class="value total">{{ formattedTotalPrice }}</span>
              </div>
            </div>

            <!-- QRIS / Real Maelyn Payment -->
            <div class="qris-card">
              <div class="qris-header">
                <QrCode :size="20" />
                <span>Scan QRIS Payment</span>
              </div>
              <div class="qr-placeholder">
                <div v-if="paymentLoading" class="qr-skeleton">
                  <Skeleton width="190px" height="190px" radius="12px" />
                </div>
                <img
                  v-else-if="qrBase64"
                  :src="qrBase64"
                  width="190"
                  height="190"
                  alt="QRIS Maelyn"
                  class="qr-image"
                />
                <div v-else class="qr-missing">
                  <AlertCircle :size="28" />
                  <span>QR tidak tersedia saat ini.</span>
                </div>
              </div>
              <span class="qris-sub">Supports Gopay, OVO, Dana, ShopeePay & All Banks</span>
              <a v-if="redirectUrl" :href="redirectUrl" target="_blank" rel="noopener" class="qris-link">
                Buka halaman pembayaran jika QR tidak muncul
              </a>
            </div>

            <!-- Action buttons -->
            <div class="payment-actions">
              <button
                v-if="isDev"
                class="simulate-success-btn"
                @click="handleSimulateSuccess"
                :disabled="provisioning"
              >
                <CheckCircle2 :size="18" />
                <span>{{ provisioning ? 'Membuat Server...' : 'Simulate Instant Payment (Dev)' }}</span>
              </button>
              <button
                class="check-status-btn"
                @click="pollStatus"
                :disabled="checkingStatus || !paymentId"
              >
                <Clock :size="18" />
                <span>{{ checkingStatus ? 'Mengecek status...' : 'Saya Sudah Bayar' }}</span>
              </button>
              <button class="cancel-btn" @click="handleClose" :disabled="provisioning">Cancel</button>
            </div>
            <p v-if="paymentError" class="provision-error">
              {{ paymentError }}
              <button
                v-if="!paymentId"
                class="error-retry"
                @click="retryCreateOrder"
                :disabled="paymentLoading"
              >
                Coba lagi
              </button>
              <button
                v-else-if="!qrBase64"
                class="error-retry"
                @click="refreshQr"
                :disabled="paymentLoading"
              >
                Muat ulang QR
              </button>
            </p>
            <p v-if="provisionError" class="provision-error">{{ provisionError }}</p>
            <p v-if="isDev" class="dev-note">Mode development: tombol simulate membuat server tanpa pembayaran.</p>
          </div>

          <!-- STEP 3: TRANSACTION EXPIRED STATE -->
          <div v-else-if="step === 'expired'" class="modal-body expired-step">
            <div class="state-icon-box expired">
              <AlertCircle :size="48" />
            </div>
            <h3 class="state-title">Transaction Expired</h3>
            <p class="state-desc">
              The 3-minute payment window has timed out. Please configure your order again to proceed.
            </p>
            <button class="retry-btn" @click="step = 'form'">Try Again</button>
          </div>

          <!-- STEP 4: SUCCESS STATE -->
          <div v-else-if="step === 'success'" class="modal-body success-step">
            <div class="state-icon-box success">
              <CheckCircle2 :size="48" />
            </div>
            <h3 class="state-title">Server Provisioned Successfully!</h3>
            <p class="state-desc">
              Your server <strong>{{ serverName }}</strong> is now active and ready in your dashboard.
            </p>
            <div v-if="provisionedServer" class="credential-box">
              <div class="cred-row">
                <span class="cred-label">Panel</span>
                <span class="cred-value">{{ provisionedServer.credentials.panelUrl }}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Username</span>
                <span class="cred-value">{{ provisionedServer.credentials.username }}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Password</span>
                <span class="cred-value">{{ provisionedServer.credentials.password }}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">IP:Port</span>
                <span class="cred-value">{{ provisionedServer.ipAddress }}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Server ID</span>
                <span class="cred-value mono">{{ provisionedServer.serverId }}</span>
              </div>
            </div>
            <button class="goto-dashboard-btn" @click="handleGoToDashboard">
              Go to Dashboard
            </button>
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
  max-width: 500px;
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
  gap: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-badge {
  font-size: 10px;
  font-weight: 700;
  color: #00e676;
  background: rgba(0, 230, 118, 0.12);
  border: 1px solid rgba(0, 230, 118, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
  text-transform: uppercase;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
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

/* Product Summary */
.product-summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #121c33;
  border: 1px solid #1f2f50;
  border-radius: 12px;
  padding: 14px 16px;
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 163, 255, 0.12);
  color: #00a3ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-details {
  display: flex;
  flex-direction: column;
}

.plan-name {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.plan-price {
  font-size: 13px;
  color: #94a3b8;
}

/* Form Controls */
.order-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}

.required {
  color: #ff4d4d;
}

.duration-highlight {
  margin-left: auto;
  font-size: 12px;
  color: #00a3ff;
  font-weight: 700;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  background: #141f36;
  border: 1px solid #223456;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: var(--transition-fast);
}

.form-input:focus {
  border-color: #00a3ff;
  box-shadow: 0 0 0 2px rgba(0, 163, 255, 0.2);
}

/* Duration selector pills (1-12) */
.duration-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.duration-pill {
  padding: 8px 4px;
  border-radius: 8px;
  background: #141f36;
  border: 1px solid #223456;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  transition: var(--transition-fast);
}

.duration-pill:hover {
  background: #1c2b4a;
  color: #ffffff;
}

.duration-pill.active {
  background: #0d47a1;
  border-color: #00a3ff;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 163, 255, 0.3);
}

/* Pricing Breakdown */
.pricing-breakdown {
  background: #0a1120;
  border: 1px solid #16243d;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #94a3b8;
}

.total-row {
  border-top: 1px solid #1f2f50;
  padding-top: 8px;
  margin-top: 4px;
  font-weight: 700;
  color: #ffffff;
}

.total-amount {
  font-size: 16px;
  color: #00e676;
}

.proceed-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00875a 0%, #00a36c 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 163, 108, 0.3);
  transition: var(--transition-fast);
}

.proceed-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 163, 108, 0.4);
}

/* STEP 2: PAYMENT & TIMEOUT */
.payment-step {
  gap: 18px;
}

.timer-alert-box {
  background: rgba(255, 77, 77, 0.12);
  border: 1px solid rgba(255, 77, 77, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
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
  animation: pulse 1s infinite alternate;
}

.timer-countdown {
  font-size: 18px;
  font-weight: 800;
  color: #ff4d4d;
  font-family: monospace;
}

.checkout-summary {
  background: #10192e;
  border: 1px solid #1a2948;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.summary-line .label { color: #94a3b8; }
.summary-line .value { color: #ffffff; font-weight: 600; }
.summary-line .total { color: #00e676; font-size: 15px; font-weight: 700; }

.qris-card {
  background: #091121;
  border: 1px dashed #203356;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
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
  padding: 12px;
  background: #ffffff;
  border-radius: 12px;
}

.qris-sub {
  font-size: 11px;
  color: #64748b;
  text-align: center;
}

.qr-image {
  display: block;
  image-rendering: pixelated;
}

.qr-skeleton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 190px;
  height: 190px;
}

.qr-missing {
  width: 190px;
  height: 190px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  text-align: center;
}

.qr-link {
  font-size: 11px;
  color: #00a3ff;
  text-decoration: underline;
  text-align: center;
  word-break: break-all;
}

.payment-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.check-status-btn {
  width: 100%;
  padding: 12px;
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

.error-retry {
  margin-left: 6px;
  color: #00a3ff;
  text-decoration: underline;
  font-size: 12px;
  transition: var(--transition-fast);
}

.error-retry:hover {
  color: #4db8ff;
}

.error-retry:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.simulate-success-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: #0d47a1;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: var(--transition-fast);
}

.simulate-success-btn:hover {
  background: #1565c0;
}

.cancel-btn {
  width: 100%;
  padding: 10px;
  color: #64748b;
  font-size: 13px;
  transition: var(--transition-fast);
}

.cancel-btn:hover {
  color: #94a3b8;
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.provision-error {
  font-size: 12px;
  color: #ff4d4d;
  text-align: center;
}

.dev-note {
  font-size: 11px;
  color: #64748b;
  text-align: center;
}

.credential-box {
  width: 100%;
  background: #0a1120;
  border: 1px solid #1f2f50;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.cred-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.cred-label {
  color: #64748b;
  flex-shrink: 0;
}

.cred-value {
  color: #00e676;
  font-weight: 600;
  word-break: break-all;
  text-align: right;
}

.cred-value.mono {
  font-family: monospace;
  font-size: 11px;
}

/* STATE SCREENS: EXPIRED & SUCCESS */
.expired-step, .success-step {
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.state-icon-box {
  width: 80px;
  height: 80px;
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
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.state-desc {
  font-size: 14px;
  color: #94a3b8;
  max-width: 360px;
  line-height: 1.5;
}

.retry-btn, .goto-dashboard-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  margin-top: 10px;
}

.retry-btn {
  background: #2a3854;
  color: #ffffff;
}

.goto-dashboard-btn {
  background: #00875a;
  color: #ffffff;
}

/* Modal Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 560px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-card {
    padding: 20px;
    border-radius: 18px;
  }

  .modal-title {
    font-size: 16px;
  }

  .duration-selector {
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
  }
}
</style>
