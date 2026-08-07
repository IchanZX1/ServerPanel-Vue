<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Stat {
  value: number
  suffix: string
  label: string
  description: string
  icon: string
}

const stats: Stat[] = [
  { value: 99.9, suffix: '%', label: 'Uptime SLA', description: 'Garansi uptime enterprise', icon: 'uptime' },
  { value: 500, suffix: '+', label: 'Server Aktif', description: 'Di seluruh Indonesia', icon: 'server' },
  { value: 10, suffix: 'Gbps', label: 'Bandwidth', description: 'Jaringan ultra-cepat', icon: 'bandwidth' },
  { value: 5, suffix: 'ms', label: 'Latency', description: 'Response time rendah', icon: 'latency' },
  { value: 2000, suffix: '+', label: 'Pelanggan', description: 'Bisnis yang percaya kami', icon: 'users' },
  { value: 24, suffix: '/7', label: 'Support', description: 'Tim siap membantu', icon: 'support' },
]

const displayed = ref<number[]>(stats.map(() => 0))
const sectionRef = ref<HTMLElement | null>(null)
const hasAnimated = ref(false)

function animateCount(index: number, target: number, duration: number = 1800) {
  const start = performance.now()
  const isDecimal = target % 1 !== 0

  function step(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    displayed.value[index] = isDecimal
      ? parseFloat((ease * target).toFixed(1))
      : Math.floor(ease * target)
    if (progress < 1) requestAnimationFrame(step)
    else displayed.value[index] = target
  }

  requestAnimationFrame(step)
}

function startAnimation() {
  if (hasAnimated.value) return
  hasAnimated.value = true
  stats.forEach((stat, i) => {
    setTimeout(() => animateCount(i, stat.value, 1600), i * 80)
  })
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) startAnimation()
    },
    { threshold: 0.2 }
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <section id="statistics" class="section stats-section" ref="sectionRef" aria-labelledby="stats-title">
    <div class="section-label" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1 9L4 5.5L7.5 7L11 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Network & Quality
    </div>

    <h2 id="stats-title" class="section-title">
      Infrastruktur yang<br>Bisa Diandalkan
    </h2>
    <p class="section-subtitle">
      Dibangun di atas hardware enterprise dengan redundansi penuh dan monitoring real-time 24 jam.
    </p>

    <div class="stats-grid" role="list">
      <article
        v-for="(stat, i) in stats"
        :key="stat.label"
        class="stat-card fade-in"
        :class="`fade-in-delay-${(i % 4) + 1}`"
        :style="{ '--i': i }"
        role="listitem"
      >
        <div class="stat-icon" aria-hidden="true">
          <!-- Uptime -->
          <svg v-if="stat.icon === 'uptime'" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#3b82f6" stroke-width="1.5"/>
            <path d="M10 6v4l2.5 2.5" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <!-- Server -->
          <svg v-else-if="stat.icon === 'server'" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="16" height="5" rx="2" stroke="#3b82f6" stroke-width="1.5"/>
            <rect x="2" y="11" width="16" height="5" rx="2" stroke="#3b82f6" stroke-width="1.5"/>
            <circle cx="15" cy="6.5" r="1" fill="#3b82f6"/>
            <circle cx="15" cy="13.5" r="1" fill="#3b82f6"/>
          </svg>
          <!-- Bandwidth -->
          <svg v-else-if="stat.icon === 'bandwidth'" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 10c1.5-4 12.5-4 14 0" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M6 13c1-2.5 7-2.5 8 0" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="10" cy="16" r="1.5" fill="#3b82f6"/>
          </svg>
          <!-- Latency -->
          <svg v-else-if="stat.icon === 'latency'" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 10h3l2-5 3 10 2-5h4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Users -->
          <svg v-else-if="stat.icon === 'users'" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="8" cy="7" r="3" stroke="#3b82f6" stroke-width="1.5"/>
            <path d="M2 17c0-3 2.5-5 6-5s6 2 6 5" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M14 5c1.7 0 3 1.3 3 3s-1.3 3-3 3" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M16 17c0-1.5-1-3-2.5-4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <!-- Support -->
          <svg v-else-if="stat.icon === 'support'" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 8c0-3.3 2.7-6 6-6s6 2.7 6 6v2" stroke="#3b82f6" stroke-width="1.5"/>
            <rect x="2" y="8" width="3" height="5" rx="1.5" fill="#3b82f6" fill-opacity="0.3" stroke="#3b82f6" stroke-width="1.5"/>
            <rect x="15" y="8" width="3" height="5" rx="1.5" fill="#3b82f6" fill-opacity="0.3" stroke="#3b82f6" stroke-width="1.5"/>
          </svg>
        </div>

        <div class="stat-value" :aria-label="`${stat.value}${stat.suffix} ${stat.label}`">
          <span class="stat-number">{{ displayed[i] }}</span>
          <span class="stat-suffix">{{ stat.suffix }}</span>
        </div>
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-desc">{{ stat.description }}</div>
      </article>
    </div>

    <!-- Uptime bar -->
    <div class="uptime-bar-wrapper fade-in fade-in-delay-4">
      <div class="uptime-bar-header">
        <span class="uptime-bar-label">Status Jaringan Real-time</span>
        <span class="uptime-status">
          <span class="status-dot" aria-hidden="true"></span>
          Semua sistem berjalan normal
        </span>
      </div>
      <div class="uptime-bars" role="img" aria-label="Status uptime 90 hari terakhir — semua hijau">
        <div
          v-for="n in 60"
          :key="n"
          class="uptime-bar-block"
          :class="{ inactive: n === 8 || n === 23 || n === 47 }"
          :title="n === 8 || n === 23 || n === 47 ? 'Maintenance terjadwal' : 'Uptime 100%'"
        ></div>
      </div>
      <div class="uptime-bar-legend">
        <span>90 hari lalu</span>
        <span>Hari ini</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-section {
  padding-top: var(--space-14);
  padding-bottom: var(--space-14);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.stat-card {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition:
    background var(--duration-fast) var(--ease-default),
    border-color var(--duration-fast) var(--ease-default),
    transform var(--duration-fast) var(--ease-default);
}

.stat-card:hover {
  background: var(--color-surface-card-hover);
  border-color: var(--color-border-accent);
  transform: translateY(-2px);
}

.stat-icon {
  width: 36px;
  height: 36px;
  background: var(--color-accent-blue-muted);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-2);
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.stat-number {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-tertiary);
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.stat-suffix {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-blue);
}

.stat-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.stat-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
}

/* Uptime bar */
.uptime-bar-wrapper {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  padding: var(--space-5);
}

.uptime-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-2);
}

.uptime-bar-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.uptime-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-success);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse 2s infinite;
}

.uptime-bars {
  display: flex;
  gap: 3px;
  margin-bottom: var(--space-3);
  flex-wrap: nowrap;
  overflow: hidden;
}

.uptime-bar-block {
  flex: 1;
  height: 28px;
  border-radius: 3px;
  background: var(--color-success);
  opacity: 0.7;
  transition: opacity var(--duration-instant);
  min-width: 3px;
}

.uptime-bar-block:hover { opacity: 1; }
.uptime-bar-block.inactive { background: var(--color-warning); opacity: 0.6; }

.uptime-bar-legend {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
