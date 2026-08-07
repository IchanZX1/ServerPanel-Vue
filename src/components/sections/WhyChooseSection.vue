<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Feature {
  icon: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: 'nvme',
    title: 'NVMe SSD Storage',
    description: 'Penyimpanan NVMe 10x lebih cepat dari HDD konvensional. I/O performa tinggi untuk database dan aplikasi berat.',
  },
  {
    icon: 'ddos',
    title: 'Proteksi DDoS',
    description: 'Mitigasi serangan DDoS otomatis hingga 10 Tbps. Infrastruktur Anda tetap online bahkan saat diserang.',
  },
  {
    icon: 'uptime',
    title: '99.9% Uptime SLA',
    description: 'Garansi uptime tertulis dengan kompensasi jika tidak tercapai. Monitoring 24/7 dengan alerting real-time.',
  },
  {
    icon: 'support',
    title: 'Support 24/7',
    description: 'Tim teknis berpengalaman siap membantu kapan saja. Respons ticket rata-rata di bawah 15 menit.',
  },
  {
    icon: 'network',
    title: 'Jaringan Global',
    description: 'Tersambung ke IIX, APNIC, dan backbone internasional. Latency rendah ke seluruh penjuru Indonesia dan dunia.',
  },
  {
    icon: 'panel',
    title: 'Panel Mudah Digunakan',
    description: 'Control panel intuitif untuk deploy, monitor, dan kelola server. Tidak butuh keahlian teknis yang mendalam.',
  },
]

const sectionRef = ref<HTMLElement | null>(null)
const visibleCards = ref<Set<number>>(new Set())

function scrollToPricing() {
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  const cards = sectionRef.value?.querySelectorAll('.why-card')
  if (!cards) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const idx = parseInt((entry.target as HTMLElement).dataset.idx ?? '0')
        if (entry.isIntersecting) visibleCards.value.add(idx)
      })
    },
    { threshold: 0.15 }
  )

  cards.forEach((card) => observer?.observe(card))
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <section id="why-choose" class="section why-section" ref="sectionRef" aria-labelledby="why-title">
    <div class="section-label" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M4 6l1.5 1.5 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Why Choose Us
    </div>

    <h2 id="why-title" class="section-title">
      Kenapa Pilih<br>ZXcoderID Cloud?
    </h2>
    <p class="section-subtitle">
      Lebih dari sekadar hosting — kami menyediakan platform cloud yang dirancang untuk performa, keamanan, dan kemudahan.
    </p>

    <div class="features-grid" role="list">
      <article
        v-for="(feature, i) in features"
        :key="feature.title"
        class="why-card"
        :class="{ visible: visibleCards.has(i) }"
        :data-idx="i"
        :style="{ transitionDelay: `${i * 80}ms` }"
        role="listitem"
      >
        <div class="feature-icon-wrap" aria-hidden="true">
          <!-- NVMe -->
          <svg v-if="feature.icon === 'nvme'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2" y="7" width="18" height="8" rx="2" stroke="#3b82f6" stroke-width="1.5"/>
            <circle cx="16" cy="11" r="1.5" fill="#3b82f6"/>
            <path d="M5 11h7" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M6 9v4M9 9v4" stroke="#3b82f6" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
          </svg>
          <!-- DDoS -->
          <svg v-else-if="feature.icon === 'ddos'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 3l8 4v5c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7l8-4z" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M8 11l2 2 4-4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <!-- Uptime -->
          <svg v-else-if="feature.icon === 'uptime'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#3b82f6" stroke-width="1.5"/>
            <path d="M11 7v4l2.5 2.5" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="11" cy="4" r="1" fill="#3b82f6"/>
          </svg>
          <!-- Support -->
          <svg v-else-if="feature.icon === 'support'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M5 9c0-3.3 2.7-6 6-6s6 2.7 6 6v2" stroke="#3b82f6" stroke-width="1.5"/>
            <rect x="3" y="9" width="3" height="5" rx="1.5" fill="#3b82f6" fill-opacity="0.2" stroke="#3b82f6" stroke-width="1.5"/>
            <rect x="16" y="9" width="3" height="5" rx="1.5" fill="#3b82f6" fill-opacity="0.2" stroke="#3b82f6" stroke-width="1.5"/>
            <path d="M19 14v1a3 3 0 01-3 3h-2" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <rect x="12" y="17" width="4" height="2.5" rx="1" stroke="#3b82f6" stroke-width="1.5"/>
          </svg>
          <!-- Network -->
          <svg v-else-if="feature.icon === 'network'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#3b82f6" stroke-width="1.5"/>
            <path d="M11 3c-2.5 2-4 4.7-4 8s1.5 6 4 8" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M11 3c2.5 2 4 4.7 4 8s-1.5 6-4 8" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M3 11h16" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <!-- Panel -->
          <svg v-else-if="feature.icon === 'panel'" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2" y="3" width="18" height="16" rx="2" stroke="#3b82f6" stroke-width="1.5"/>
            <path d="M2 8h18" stroke="#3b82f6" stroke-width="1.5"/>
            <circle cx="5.5" cy="5.5" r="1" fill="#3b82f6"/>
            <circle cx="8.5" cy="5.5" r="1" fill="#3b82f6"/>
            <path d="M6 13h10M6 16h6" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="feature-content">
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.description }}</p>
        </div>
      </article>
    </div>

    <!-- Bottom CTA -->
    <div class="why-cta fade-in fade-in-delay-4">
      <div class="cta-text">
        <span class="cta-heading">Siap memulai?</span>
        <span class="cta-sub">Bergabung dengan 2.000+ bisnis yang sudah mempercayai ZXcoderID Cloud.</span>
      </div>
      <a href="#pricing" @click.prevent="scrollToPricing" class="cta-btn" aria-label="Lihat paket harga kami">
        Lihat Paket
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </a>
    </div>
  </section>
</template>

<style scoped>
.why-section {
  padding-top: var(--space-14);
  padding-bottom: var(--space-14);
}

.features-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.why-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  opacity: 0;
  transform: translateX(-16px);
  transition:
    opacity var(--duration-normal) var(--ease-default),
    transform var(--duration-normal) var(--ease-default),
    background var(--duration-fast) var(--ease-default),
    border-color var(--duration-fast) var(--ease-default);
}

.why-card.visible {
  opacity: 1;
  transform: translateX(0);
}

.why-card:hover {
  background: var(--color-surface-card-hover);
  border-color: var(--color-border-accent);
}

.feature-icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  background: var(--color-accent-blue-muted);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-content {
  flex: 1;
  min-width: 0;
}

.feature-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
}

.feature-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

/* Bottom CTA */
.why-cta {
  background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.05) 100%);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  align-items: flex-start;
}

.cta-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.cta-heading {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
}

.cta-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-accent-blue);
  border-radius: var(--radius-md);
  transition:
    background var(--duration-instant),
    box-shadow var(--duration-instant),
    transform var(--duration-instant);
}

.cta-btn:hover {
  background: var(--color-accent-blue-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}
</style>
