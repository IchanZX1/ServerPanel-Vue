<script setup lang="ts">
const currentYear = new Date().getFullYear()

const links = [
  { label: 'Network & Quality', anchor: 'statistics' },
  { label: 'Pricing', anchor: 'pricing' },
  { label: 'Why Choose Us', anchor: 'why-choose' },
  { label: 'FAQ', anchor: 'faq' },
]

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <footer class="footer" role="contentinfo">
    <div class="footer-inner">
      <!-- Logo & tagline -->
      <div class="footer-brand">
        <a href="#" class="footer-logo" @click.prevent="scrollToSection('hero')" aria-label="ZXcoderID Cloud — Kembali ke atas">
          <div class="logo-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#3b82f6" fill-opacity="0.15"/>
              <path d="M7 10L14 7L21 10V18L14 21L7 18V10Z" stroke="#3b82f6" stroke-width="1.5" fill="none"/>
              <circle cx="14" cy="14" r="3" fill="#3b82f6"/>
            </svg>
          </div>
          <span class="logo-text">ZXcoder<span class="logo-accent">ID</span> Cloud</span>
        </a>
        <p class="footer-tagline">
          Infrastruktur cloud enterprise-grade untuk bisnis modern. Cepat, aman, dan selalu online.
        </p>
      </div>

      <!-- Quick links -->
      <nav class="footer-nav" aria-label="Navigasi footer">
        <span class="footer-nav-title">Navigasi</span>
        <ul>
          <li v-for="link in links" :key="link.anchor">
            <button class="footer-link" @click="scrollToSection(link.anchor)">
              {{ link.label }}
            </button>
          </li>
        </ul>
      </nav>

      <!-- Divider -->
      <div class="footer-divider" role="separator" aria-hidden="true"></div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <span class="footer-copy">
          &copy; {{ currentYear }} ZXcoderID Cloud. Hak cipta dilindungi.
        </span>
        <div class="footer-status" role="status" aria-label="Status sistem">
          <span class="status-dot" aria-hidden="true"></span>
          <span>Semua sistem normal</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border-muted);
  padding: var(--space-10) var(--space-5) var(--space-8);
  background: rgba(255, 255, 255, 0.02);
}

.footer-inner {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

/* Brand */
.footer-brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.footer-logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: fit-content;
  transition: opacity var(--duration-instant);
}

.footer-logo:hover { opacity: 0.8; }

.logo-text {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  letter-spacing: -0.01em;
}

.logo-accent { color: var(--color-accent-blue); }

.footer-tagline {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
  max-width: 300px;
}

/* Nav */
.footer-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.footer-nav-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.footer-nav ul {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.footer-link {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: left;
  padding: var(--space-1) 0;
  transition: color var(--duration-instant);
}

.footer-link:hover { color: var(--color-text-tertiary); }

/* Divider */
.footer-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border-muted), transparent);
}

/* Bottom */
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.footer-copy {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.footer-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-success);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
</style>
