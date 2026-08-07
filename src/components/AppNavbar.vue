<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '../stores/theme'

const isScrolled = ref(false)
const isMenuOpen = ref(false)
const themeStore = useThemeStore()
const router = useRouter()

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function scrollToSection(id: string) {
  closeMenu()
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function navigateToLogin() {
  closeMenu()
  router.push('/login')
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<template>
  <header class="navbar" :class="{ scrolled: isScrolled }" role="banner">
    <div class="navbar-inner">
      <!-- Logo -->
      <a href="#" class="navbar-logo" aria-label="ZXcoderID Cloud — Halaman Utama" @click.prevent="scrollToSection('hero')">
        <div class="logo-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#3b82f6" fill-opacity="0.15"/>
            <path d="M7 10L14 7L21 10V18L14 21L7 18V10Z" stroke="#3b82f6" stroke-width="1.5" fill="none"/>
            <circle cx="14" cy="14" r="3" fill="#3b82f6"/>
          </svg>
        </div>
        <span class="logo-text">ZXcoder<span class="logo-accent">ID</span></span>
      </a>

      <!-- Desktop Nav -->
      <nav class="navbar-nav" aria-label="Navigasi utama">
        <button class="nav-link" @click="scrollToSection('statistics')">Network</button>
        <button class="nav-link" @click="scrollToSection('pricing')">Pricing</button>
        <button class="nav-link" @click="scrollToSection('why-choose')">Why Us</button>
        <button class="nav-link" @click="scrollToSection('faq')">FAQ</button>
      </nav>

      <!-- Actions -->
      <div class="navbar-actions">
        <button class="btn-cta" @click="navigateToLogin" aria-label="Mulai sekarang">
          Get Started
        </button>

        <!-- Theme Toggle -->
        <button
          class="theme-toggle"
          @click="themeStore.toggleTheme()"
          :aria-label="themeStore.theme === 'dark' ? 'Ganti ke light mode' : 'Ganti ke dark mode'"
          :title="themeStore.theme === 'dark' ? 'Light mode' : 'Dark mode'"
        >
          <svg v-if="themeStore.theme === 'dark'" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.9 11.9l1.06 1.06M11.9 3.05l-1.06 1.06M3.05 11.9l1.06 1.06" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13.5 10A6 6 0 016 2.5a6 6 0 100 11 6 6 0 007.5-3.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Hamburger -->
        <button
          class="hamburger"
          :class="{ open: isMenuOpen }"
          @click="toggleMenu"
          :aria-expanded="isMenuOpen"
          aria-controls="mobile-drawer"
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile drawer overlay -->
  <Transition name="overlay-fade">
    <div
      v-if="isMenuOpen"
      class="mobile-overlay"
      @click="closeMenu"
      aria-hidden="true"
    ></div>
  </Transition>

  <!-- Mobile drawer — slide in dari kiri -->
  <Transition name="drawer-slide">
    <div
      v-if="isMenuOpen"
      id="mobile-drawer"
      class="mobile-drawer"
      role="dialog"
      aria-label="Menu navigasi mobile"
    >
      <!-- Drawer header -->
      <div class="drawer-header">
        <div class="drawer-logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="#3b82f6" fill-opacity="0.15"/>
            <path d="M7 10L14 7L21 10V18L14 21L7 18V10Z" stroke="#3b82f6" stroke-width="1.5" fill="none"/>
            <circle cx="14" cy="14" r="3" fill="#3b82f6"/>
          </svg>
          <span class="drawer-brand">ZXcoder<span class="logo-accent">ID</span></span>
        </div>
        <button class="drawer-close" @click="closeMenu" aria-label="Tutup menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Drawer nav -->
      <nav class="drawer-nav" aria-label="Navigasi mobile">
        <button class="drawer-nav-link" @click="scrollToSection('statistics')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 12L6 7L10 9L14 4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Network & Quality
        </button>
        <button class="drawer-nav-link" @click="scrollToSection('pricing')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="4" width="12" height="9" rx="2" stroke="#3b82f6" stroke-width="1.5"/>
            <path d="M5 4V3a3 3 0 016 0v1" stroke="#3b82f6" stroke-width="1.5"/>
          </svg>
          Pricing
        </button>
        <button class="drawer-nav-link" @click="scrollToSection('why-choose')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="#3b82f6" stroke-width="1.5"/>
            <path d="M5 8l2 2 4-4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Why Choose Us
        </button>
        <button class="drawer-nav-link" @click="scrollToSection('faq')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="#3b82f6" stroke-width="1.5"/>
            <path d="M8 9V8c1.5 0 2-1 1-2S6 5.5 6 7" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="8" cy="11" r="0.5" fill="#3b82f6"/>
          </svg>
          FAQ
        </button>
      </nav>

      <!-- Drawer footer CTA -->
      <div class="drawer-footer">
        <button class="drawer-cta" @click="navigateToLogin">Get Started — Free</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Navbar ── */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: var(--color-navbar-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border-muted);
  transition:
    background var(--duration-fast) var(--ease-default),
    border-color var(--duration-fast) var(--ease-default);
}

.navbar.scrolled {
  border-color: var(--color-border-subtle);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  max-width: 480px;
  margin: 0 auto;
  height: 60px;
}

/* ── Logo ── */
.navbar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  transition: opacity var(--duration-instant) var(--ease-default);
}

.navbar-logo:hover { opacity: 0.85; }

.logo-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  letter-spacing: -0.02em;
}

.logo-accent { color: var(--color-accent-blue); }

/* ── Desktop nav — hidden on mobile ── */
.navbar-nav { display: none; }

/* ── Actions ── */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.btn-cta {
  display: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-accent-blue);
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-5);
  transition:
    background var(--duration-instant) var(--ease-default),
    box-shadow var(--duration-instant) var(--ease-default);
}

.btn-cta:hover {
  background: var(--color-accent-blue-hover);
  box-shadow: var(--shadow-glow);
}

/* ── Theme toggle ── */
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-xs);
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  color: var(--color-text-secondary);
  transition:
    background var(--duration-instant),
    color var(--duration-instant),
    border-color var(--duration-instant);
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: var(--color-surface-card-hover);
  color: var(--color-accent-blue);
  border-color: var(--color-border-accent);
}

/* ── Hamburger ── */
.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-xs);
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  padding: 0 8px;
  transition: background var(--duration-instant);
}

.hamburger:hover { background: var(--color-surface-card-hover); }

.hamburger span {
  display: block;
  height: 1.5px;
  width: 100%;
  background: var(--color-text-primary);
  border-radius: 2px;
  transition:
    transform var(--duration-fast) var(--ease-default),
    opacity var(--duration-fast) var(--ease-default);
  transform-origin: center;
}

.hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

/* ── Mobile overlay ── */
.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 290;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* ── Mobile drawer (slide from left) ── */
.mobile-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 300;
  width: 280px;
  background: var(--color-surface-base);
  border-right: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-5);
  height: 64px;
  border-bottom: 1px solid var(--color-border-muted);
  flex-shrink: 0;
}

.drawer-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.drawer-brand {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  letter-spacing: -0.02em;
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-xs);
  color: var(--color-text-secondary);
  transition: background var(--duration-instant), color var(--duration-instant);
}

.drawer-close:hover {
  background: var(--color-surface-card);
  color: var(--color-text-tertiary);
}

.drawer-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-3);
  overflow-y: auto;
}

.drawer-nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  text-align: left;
  transition: background var(--duration-instant), color var(--duration-instant);
}

.drawer-nav-link:hover {
  background: var(--color-surface-card);
  color: var(--color-text-tertiary);
}

.drawer-footer {
  padding: var(--space-5);
  border-top: 1px solid var(--color-border-muted);
}

.drawer-cta {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-accent-blue);
  border-radius: var(--radius-md);
  transition: background var(--duration-instant), box-shadow var(--duration-instant);
  text-align: center;
}

.drawer-cta:hover {
  background: var(--color-accent-blue-hover);
  box-shadow: var(--shadow-glow);
}

/* ── Drawer transition ── */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform var(--duration-normal) var(--ease-default);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(-100%);
}

/* ── Overlay transition ── */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* ── Desktop breakpoint ── */
@media (min-width: 768px) {
  .navbar-inner {
    max-width: 100%;
    padding: var(--space-4) var(--space-8);
  }

  .btn-cta { display: block; }

  .navbar-nav {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .nav-link {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-navbar-text);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-xs);
    transition: color var(--duration-instant), background var(--duration-instant);
  }

  .nav-link:hover {
    color: var(--color-navbar-text-hover);
    background: var(--color-surface-card);
  }

  .hamburger { display: none; }
  .mobile-drawer { display: none !important; }
  .mobile-overlay { display: none !important; }
}
</style>
