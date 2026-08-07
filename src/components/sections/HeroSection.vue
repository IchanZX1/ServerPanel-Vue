<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { initParticles, tsParticles, defaultParticlesOptions } from '../../utils/particles'
import type { Container } from '@tsparticles/engine'

const router = useRouter()

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function navigateToLogin() {
  router.push('/login')
}

let particlesContainer: Container | undefined

onMounted(async () => {
  await initParticles()
  particlesContainer = await tsParticles.load({
    id: 'hero-particles',
    options: defaultParticlesOptions,
  })
})

onUnmounted(() => {
  particlesContainer?.destroy()
})
</script>

<template>
  <section id="hero" class="hero" aria-labelledby="hero-title">
    <!-- Particles background -->
    <div id="hero-particles" class="hero-particles" aria-hidden="true"></div>

    <!-- Background grid -->
    <div class="hero-bg" aria-hidden="true">
      <div class="bg-grid"></div>
      <div class="bg-glow-1"></div>
      <div class="bg-glow-2"></div>
    </div>

    <div class="hero-content">
      <!-- Badge -->
      <div class="hero-badge" role="note">
        <span class="badge-dot" aria-hidden="true"></span>
        <span>🚀 High Performance Server</span>
      </div>

      <!-- Headline -->
      <h1 id="hero-title" class="hero-title">
        Cloud Hosting
        <span class="title-gradient">Tercepat &amp;</span>
        <span class="title-white">Terpercaya</span>
      </h1>

      <!-- Subtext -->
      <p class="hero-sub">
        Infrastruktur cloud enterprise-grade dengan NVMe SSD, proteksi DDoS, dan jaringan global.
        Mulai dari <strong>Rp 25.000/bulan</strong>.
      </p>

      <!-- CTA Buttons -->
      <div class="hero-cta" role="group" aria-label="Aksi utama">
        <button class="btn-primary" @click="navigateToLogin" aria-label="Mulai sekarang">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Mulai Sekarang
        </button>
        <button class="btn-secondary" @click="scrollToSection('statistics')" aria-label="Lihat statistik jaringan">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 12L6 7L10 9L14 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Lihat Statistik
        </button>
      </div>

      <!-- Trust badges -->
      <div class="hero-trust" aria-label="Kepercayaan pelanggan">
        <div class="trust-item">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7l3 3 7-7" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Tanpa kontrak</span>
        </div>
        <div class="trust-sep" aria-hidden="true">·</div>
        <div class="trust-item">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7l3 3 7-7" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Setup instan</span>
        </div>
        <div class="trust-sep" aria-hidden="true">·</div>
        <div class="trust-item">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7l3 3 7-7" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Support 24/7</span>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <button class="scroll-indicator" @click="scrollToSection('statistics')" aria-label="Scroll ke bawah untuk melihat statistik">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px var(--space-5) var(--space-14);
  overflow: hidden;
}

/* Particles */
.hero-particles {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
}

/* Background */
.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
}

.bg-glow-1 {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.bg-glow-2 {
  position: absolute;
  bottom: 20%;
  right: -20%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
  border-radius: 50%;
}

/* Content */
.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 420px;
  width: 100%;
}

/* Badge */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.06em;
  color: var(--color-accent-blue);
  background: var(--color-accent-blue-muted);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-4);
  margin-bottom: var(--space-7);
  animation: fadeInDown var(--duration-normal) var(--ease-default) both;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent-blue);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

/* Title */
.hero-title {
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--line-height-tight);
  letter-spacing: -0.03em;
  margin-bottom: var(--space-6);
  animation: fadeInUp var(--duration-normal) var(--ease-default) 100ms both;
}

.title-gradient {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-white {
  color: var(--color-text-tertiary);
}

/* Sub */
.hero-sub {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-8);
  animation: fadeInUp var(--duration-normal) var(--ease-default) 200ms both;
}

.hero-sub strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

/* CTA */
.hero-cta {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  margin-bottom: var(--space-8);
  animation: fadeInUp var(--duration-normal) var(--ease-default) 300ms both;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-5) var(--space-6);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-accent-blue);
  border-radius: var(--radius-md);
  transition:
    background var(--duration-instant) var(--ease-default),
    box-shadow var(--duration-instant) var(--ease-default),
    transform var(--duration-instant) var(--ease-default);
}

.btn-primary:hover {
  background: var(--color-accent-blue-hover);
  box-shadow: var(--shadow-glow-strong);
  transform: translateY(-1px);
}

.btn-primary:active { transform: translateY(0); }

.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-5) var(--space-6);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  transition:
    background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default),
    border-color var(--duration-instant) var(--ease-default);
}

.btn-secondary:hover {
  background: var(--color-surface-card-hover);
  color: var(--color-text-primary);
  border-color: var(--color-border-subtle);
}

/* Trust */
.hero-trust {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  animation: fadeInUp var(--duration-normal) var(--ease-default) 400ms both;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.trust-sep {
  color: var(--color-border-subtle);
  font-size: var(--font-size-md);
}

/* Scroll indicator */
.scroll-indicator {
  position: absolute;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  color: var(--color-text-muted);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  animation: bounce 2s infinite var(--ease-default);
  transition: color var(--duration-instant), background var(--duration-instant);
}

.scroll-indicator:hover {
  color: var(--color-accent-blue);
  background: var(--color-accent-blue-muted);
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(5px); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
