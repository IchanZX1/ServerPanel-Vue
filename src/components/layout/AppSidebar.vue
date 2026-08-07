<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  LayoutGrid,
  Server,
  CreditCard,
  Headphones,
  BookOpen,
  Box,
  X
} from 'lucide-vue-next'

defineProps<{
  isOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
  { name: 'Server',    path: '/server',    icon: Server },
  { name: 'Invoice',   path: '/invoice',   icon: CreditCard },
  { name: 'Contact',   path: '/contact',   icon: Headphones },
  { name: 'Knowledge', path: '/knowledge', icon: BookOpen },
]

const isActive = (path: string) => {
  if (path === '/dashboard' && route.path === '/dashboard') return true
  return route.path === path
}
</script>

<template>
  <!-- Mobile overlay -->
  <Transition name="overlay-fade">
    <div
      v-if="isOpen"
      class="sidebar-overlay"
      @click="emit('close')"
      aria-hidden="true"
    ></div>
  </Transition>

  <aside
    class="panel-sidebar"
    :class="{ 'is-open': isOpen }"
    aria-label="Panel navigation"
  >
    <!-- Brand -->
    <div class="sidebar-header">
      <div class="brand-logo">
        <div class="logo-icon-box" aria-hidden="true">
          <Box :size="20" />
        </div>
        <span class="brand-name">
          <span class="text-white">ZXcoder</span><span class="text-blue">ID</span>
        </span>
      </div>
      <button
        class="mobile-close-btn"
        @click="emit('close')"
        aria-label="Close sidebar"
      >
        <X :size="20" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav" aria-label="Main navigation">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="emit('close')"
      >
        <component :is="item.icon" class="nav-icon" :size="20" aria-hidden="true" />
        <span class="nav-label">{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
/* ── Sidebar shell ── */
.panel-sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  background-color: var(--panel-bg-sidebar);
  border-right: 1px solid var(--panel-border-card);
  display: flex;
  flex-direction: column;
  transition:
    transform var(--transition-normal),
    background-color var(--transition-normal),
    border-color var(--transition-normal);
}

/* ── Header ── */
.sidebar-header {
  height: var(--topbar-height);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--panel-border-card);
  flex-shrink: 0;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  flex-shrink: 0;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.text-white {
  color: var(--panel-text-title);
}

.text-blue {
  color: #3b82f6;
}

.mobile-close-btn {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  color: var(--panel-text-muted);
  transition: var(--transition-fast);
}

.mobile-close-btn:hover {
  color: var(--panel-text-main);
  background: var(--panel-nav-hover-bg);
}

/* ── Nav ── */
.sidebar-nav {
  flex: 1;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--panel-text-muted);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: var(--transition-fast);
  border-left: 3px solid transparent;
}

.nav-item:hover {
  color: var(--panel-icon-hover);
  background: var(--panel-nav-hover-bg);
}

.nav-item.active {
  color: var(--panel-nav-active-text);
  background: var(--panel-nav-active-bg);
  border-left-color: #3b82f6;
  font-weight: 600;
}

.nav-icon {
  color: var(--panel-icon-color);
  flex-shrink: 0;
  transition: var(--transition-fast);
}

.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  color: inherit;
}

/* ── Overlay ── */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: var(--panel-overlay-bg);
  backdrop-filter: blur(4px);
  z-index: 99;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* ── Mobile responsive ── */
@media (max-width: 991px) {
  .panel-sidebar {
    transform: translateX(-100%);
  }

  .panel-sidebar.is-open {
    transform: translateX(0);
  }

  .mobile-close-btn {
    display: flex;
  }
}
</style>
