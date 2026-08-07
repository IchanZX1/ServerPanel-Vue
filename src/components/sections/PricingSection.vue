<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  badge?: string
  price: number
  period: string
  description: string
  features: PlanFeature[]
  cta: string
  highlighted: boolean
}

const router = useRouter()

function navigateToLogin() {
  router.push('/login')
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 25000,
    period: '/bulan',
    description: 'Cocok untuk personal dan proyek kecil yang baru mulai.',
    highlighted: false,
    cta: 'Mulai Gratis',
    features: [
      { text: '1 vCPU Core', included: true },
      { text: '1 GB RAM', included: true },
      { text: '20 GB NVMe SSD', included: true },
      { text: '500 GB Bandwidth', included: true },
      { text: 'Proteksi DDoS Basic', included: true },
      { text: 'Support via Ticket', included: true },
      { text: 'Dedicated IP', included: false },
      { text: 'Backup Otomatis', included: false },
      { text: 'SLA 99.9%', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Paling Populer',
    price: 75000,
    period: '/bulan',
    description: 'Performa terbaik untuk bisnis dan aplikasi produksi.',
    highlighted: true,
    cta: 'Pilih Pro',
    features: [
      { text: '4 vCPU Core', included: true },
      { text: '4 GB RAM', included: true },
      { text: '80 GB NVMe SSD', included: true },
      { text: '2 TB Bandwidth', included: true },
      { text: 'Proteksi DDoS Advanced', included: true },
      { text: 'Support Prioritas 24/7', included: true },
      { text: 'Dedicated IP', included: true },
      { text: 'Backup Otomatis', included: true },
      { text: 'SLA 99.9%', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 200000,
    period: '/bulan',
    description: 'Skalabilitas penuh untuk perusahaan dan traffic tinggi.',
    highlighted: false,
    cta: 'Hubungi Kami',
    features: [
      { text: '8 vCPU Core', included: true },
      { text: '16 GB RAM', included: true },
      { text: '320 GB NVMe SSD', included: true },
      { text: 'Unlimited Bandwidth', included: true },
      { text: 'Proteksi DDoS Enterprise', included: true },
      { text: 'Dedicated Account Manager', included: true },
      { text: 'Dedicated IP', included: true },
      { text: 'Backup Otomatis Harian', included: true },
      { text: 'SLA 99.9% Garansi', included: true },
    ],
  },
]

const billingCycle = ref<'monthly' | 'yearly'>('monthly')

// Carousel state — default ke Pro (index 1) karena highlighted
const activeIndex = ref(1)

const trackStyle = computed(() => ({
  transform: `translateX(-${activeIndex.value * 100}%)`,
}))

function goTo(index: number) {
  activeIndex.value = Math.max(0, Math.min(plans.length - 1, index))
}

function prev() { goTo(activeIndex.value - 1) }
function next() { goTo(activeIndex.value + 1) }

// Touch swipe support
let touchStartX = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0]?.clientX ?? 0
}

function onTouchEnd(e: TouchEvent) {
  const diff = touchStartX - (e.changedTouches[0]?.clientX ?? 0)
  if (diff > 50) next()
  else if (diff < -50) prev()
}

function formatPrice(price: number): string {
  const val = billingCycle.value === 'yearly' ? Math.floor(price * 0.8) : price
  return new Intl.NumberFormat('id-ID').format(val)
}
</script>

<template>
  <section id="pricing" class="section pricing-section" aria-labelledby="pricing-title">
    <div class="section-label" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="3" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M4 3V2a2 2 0 014 0v1" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      Pricing
    </div>

    <h2 id="pricing-title" class="section-title">
      Harga Transparan,<br>Tanpa Biaya Tersembunyi
    </h2>
    <p class="section-subtitle">
      Pilih paket yang sesuai kebutuhan. Upgrade atau downgrade kapan saja tanpa penalti.
    </p>

    <!-- Billing toggle -->
    <div class="billing-toggle" role="group" aria-label="Pilih siklus pembayaran">
      <button
        class="toggle-btn"
        :class="{ active: billingCycle === 'monthly' }"
        @click="billingCycle = 'monthly'"
        :aria-pressed="billingCycle === 'monthly'"
      >
        Bulanan
      </button>
      <button
        class="toggle-btn"
        :class="{ active: billingCycle === 'yearly' }"
        @click="billingCycle = 'yearly'"
        :aria-pressed="billingCycle === 'yearly'"
      >
        Tahunan
        <span class="toggle-discount" aria-label="Hemat 20 persen">-20%</span>
      </button>
    </div>

    <!-- Carousel -->
    <div
      class="carousel"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
      role="region"
      aria-label="Daftar paket harga"
    >
      <!-- Track -->
      <div class="carousel-track" :style="trackStyle" role="list">
        <article
          v-for="(plan, i) in plans"
          :key="plan.id"
          class="plan-card"
          :class="{ highlighted: plan.highlighted, active: activeIndex === i }"
          :aria-hidden="activeIndex !== i"
          :aria-label="`Paket ${plan.name}`"
          role="listitem"
        >
          <!-- Popular badge -->
          <div v-if="plan.badge" class="plan-badge" aria-label="Paling populer">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 1l1.2 2.5L9 4l-2 1.9.5 2.6L5 7.2 2.5 8.5 3 5.9 1 4l2.8-.5L5 1z" fill="currentColor"/>
            </svg>
            {{ plan.badge }}
          </div>

          <div class="plan-header">
            <h3 class="plan-name">{{ plan.name }}</h3>
            <p class="plan-desc">{{ plan.description }}</p>
          </div>

          <div class="plan-price" :aria-label="`Harga Rp ${formatPrice(plan.price)} per bulan`">
            <span class="price-currency">Rp</span>
            <span class="price-amount">{{ formatPrice(plan.price) }}</span>
            <span class="price-period">{{ plan.period }}</span>
          </div>

          <div v-if="billingCycle === 'yearly'" class="price-saving">
            Hemat Rp {{ new Intl.NumberFormat('id-ID').format(Math.floor(plan.price * 0.2 * 12)) }}/tahun
          </div>

          <button
            class="plan-cta"
            :class="{ primary: plan.highlighted }"
            :aria-label="`${plan.cta} paket ${plan.name}`"
            :tabindex="activeIndex === i ? 0 : -1"
            @click="navigateToLogin"
          >
            {{ plan.cta }}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <ul class="plan-features" aria-label="Fitur yang tersedia">
            <li
              v-for="feature in plan.features"
              :key="feature.text"
              class="feature-item"
              :class="{ excluded: !feature.included }"
            >
              <span class="feature-icon" aria-hidden="true">
                <svg v-if="feature.included" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="#10b981" fill-opacity="0.15"/>
                  <path d="M4 7l2 2 4-4" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="rgba(255,255,255,0.04)"/>
                  <path d="M5 5l4 4M9 5l-4 4" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>
              <span :class="{ 'text-muted': !feature.included }">{{ feature.text }}</span>
              <span class="sr-only">{{ feature.included ? '(tersedia)' : '(tidak tersedia)' }}</span>
            </li>
          </ul>
        </article>
      </div>

      <!-- Prev / Next buttons -->
      <button
        class="carousel-btn carousel-btn-prev"
        @click="prev"
        :disabled="activeIndex === 0"
        aria-label="Paket sebelumnya"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button
        class="carousel-btn carousel-btn-next"
        @click="next"
        :disabled="activeIndex === plans.length - 1"
        aria-label="Paket berikutnya"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Dot indicators -->
    <div class="carousel-dots" role="tablist" aria-label="Pilih paket">
      <button
        v-for="(plan, i) in plans"
        :key="plan.id"
        class="dot"
        :class="{ active: activeIndex === i }"
        @click="goTo(i)"
        role="tab"
        :aria-selected="activeIndex === i"
        :aria-label="`Lihat paket ${plan.name}`"
      ></button>
    </div>

    <!-- Plan name indicator -->
    <p class="carousel-label" aria-live="polite">
      {{ plans[activeIndex]?.name }}
      <span v-if="plans[activeIndex]?.badge" class="carousel-label-badge">{{ plans[activeIndex]?.badge }}</span>
    </p>

    <!-- Money back guarantee -->
    <div class="guarantee fade-in fade-in-delay-4">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-.5L8 2z" stroke="#f59e0b" stroke-width="1.2" fill="#f59e0b" fill-opacity="0.2"/>
      </svg>
      <span>Garansi uang kembali 7 hari — tanpa pertanyaan</span>
    </div>
  </section>
</template>

<style scoped>
.pricing-section {
  padding-top: var(--space-14);
  padding-bottom: var(--space-14);
}

/* Billing toggle */
.billing-toggle {
  display: flex;
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-lg);
  padding: 3px;
  margin-bottom: var(--space-7);
  width: fit-content;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  border-radius: var(--radius-lg);
  transition: background var(--duration-instant), color var(--duration-instant);
}

.toggle-btn.active {
  background: var(--color-surface-strong);
  color: var(--color-text-tertiary);
}

.toggle-discount {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
  border-radius: var(--radius-lg);
  padding: 1px 6px;
}

/* Carousel wrapper */
.carousel {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-5);
  padding-top: 14px;
}

/* Track — flex row, geser pakai transform */
.carousel-track {
  display: flex;
  transition: transform var(--duration-fast) var(--ease-default);
  will-change: transform;
}

/* Setiap card mengisi tepat 100% lebar carousel */
.plan-card {
  flex: 0 0 100%;
  min-width: 0;
  width: 100%;
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-sizing: border-box;
  transition: border-color var(--duration-fast);
}

.plan-card.highlighted {
  border-color: var(--color-border-accent);
  box-shadow: var(--shadow-glow);
  background: linear-gradient(160deg, rgba(59,130,246,0.07) 0%, var(--color-surface-card) 60%);
}

/* Badge */
.plan-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-blue);
  background: var(--color-accent-blue-muted);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-lg);
  padding: 3px 10px;
  margin-bottom: var(--space-4);
}

.plan-header {
  margin-bottom: var(--space-5);
}

.plan-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-1);
}

.plan-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

/* Price */
.plan-price {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-bottom: var(--space-2);
}

.price-currency {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.price-amount {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-tertiary);
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.price-period {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.price-saving {
  font-size: var(--font-size-xs);
  color: var(--color-success);
  margin-bottom: var(--space-5);
}

/* CTA */
.plan-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-4) var(--space-5);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: var(--color-surface-strong);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  margin: var(--space-5) 0;
  transition:
    background var(--duration-instant),
    color var(--duration-instant),
    box-shadow var(--duration-instant),
    transform var(--duration-instant);
}

.plan-cta:hover {
  background: var(--color-surface-card-hover);
  color: var(--color-text-primary);
  transform: translateY(-1px);
}

.plan-cta.primary {
  background: var(--color-accent-blue);
  color: #fff;
  border-color: transparent;
}

.plan-cta.primary:hover {
  background: var(--color-accent-blue-hover);
  box-shadow: var(--shadow-glow);
}

/* Features */
.plan-features {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-muted);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.feature-item.excluded { color: var(--color-text-muted); }
.text-muted { color: var(--color-text-muted); }
.feature-icon { flex-shrink: 0; display: flex; align-items: center; }

/* Carousel prev/next buttons */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: 50%;
  color: var(--color-text-secondary);
  z-index: 2;
  transition:
    background var(--duration-instant),
    color var(--duration-instant),
    opacity var(--duration-instant);
}

.carousel-btn:hover:not(:disabled) {
  background: var(--color-surface-card-hover);
  color: var(--color-accent-blue);
  border-color: var(--color-border-accent);
}

.carousel-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-btn-prev { left: 4px; }
.carousel-btn-next { right: 4px; }

/* Dot indicators */
.carousel-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border-subtle);
  transition:
    background var(--duration-fast),
    width var(--duration-fast),
    border-radius var(--duration-fast);
}

.dot.active {
  width: 24px;
  border-radius: var(--radius-lg);
  background: var(--color-accent-blue);
}

/* Label di bawah dots */
.carousel-label {
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.carousel-label-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-blue);
  background: var(--color-accent-blue-muted);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-lg);
  padding: 1px 8px;
}

/* Guarantee */
.guarantee {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border-width: 0;
}
</style>
