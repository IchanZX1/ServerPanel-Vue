<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, Sun, Moon, ChevronDown, Menu, LogOut } from 'lucide-vue-next'
import { useThemeStore } from '../../stores/theme'
import { useAuthStore } from '../../stores/auth'
import { dashboardData } from '../../data/dummyData'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const isProfileOpen = ref(false)
const profileWrap = ref<HTMLElement | null>(null)

const pageTitle = computed(() => {
  switch (route.path) {
    case '/server':    return 'Product Server'
    case '/invoice':   return 'Invoice'
    case '/contact':   return 'Contact Support'
    case '/knowledge': return 'Knowledge Base'
    case '/dashboard':
    default:           return 'Dashboard'
  }
})

const profileName = computed(() => authStore.user?.name ?? dashboardData.user.name)
const profileUsername = computed(() => authStore.user?.username ?? dashboardData.user.username)
const profileEmail = computed(() => authStore.user?.email ?? dashboardData.user.email)
const profileAvatar = computed(() => (authStore.user?.name ?? dashboardData.user.name).charAt(0).toUpperCase())

function toggleProfile() {
  isProfileOpen.value = !isProfileOpen.value
}

async function handleLogout() {
  isProfileOpen.value = false
  await authStore.logout()
  router.push('/login')
}

function handleClickOutside(e: MouseEvent) {
  if (profileWrap.value && !profileWrap.value.contains(e.target as Node)) {
    isProfileOpen.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') isProfileOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <header class="panel-topbar">
    <div class="topbar-left">
      <!-- Hamburger — visible on mobile only -->
      <button
        class="sidebar-toggle-btn"
        @click="$emit('toggle-sidebar')"
        aria-label="Toggle Sidebar"
      >
        <Menu :size="20" />
      </button>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <div class="topbar-right">
      <!-- Notification -->
      <button class="topbar-icon-btn" title="Notifications" aria-label="Notifications">
        <Bell :size="18" />
        <span class="notification-badge" aria-hidden="true"></span>
      </button>

      <!-- Theme Toggle -->
      <button
        class="topbar-icon-btn"
        @click="themeStore.toggleTheme()"
        :title="themeStore.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        :aria-label="themeStore.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <Sun v-if="themeStore.theme === 'dark'" :size="18" />
        <Moon v-else :size="18" />
      </button>

      <!-- User Profile -->
      <div ref="profileWrap" class="user-profile-wrap">
        <div
          class="user-profile-widget"
          role="button"
          tabindex="0"
          :aria-expanded="isProfileOpen"
          aria-haspopup="menu"
          aria-label="User profile"
          @click="toggleProfile"
          @keydown.enter="toggleProfile"
        >
          <div class="user-avatar" aria-hidden="true">
            <span>{{ profileAvatar }}</span>
          </div>
          <span class="user-name">{{ profileUsername }}</span>
          <ChevronDown :size="16" class="chevron-icon" aria-hidden="true" />
        </div>

        <Transition name="dropdown">
          <div v-if="isProfileOpen" class="user-dropdown" role="menu">
            <div class="dropdown-header">
              <div class="dropdown-avatar" aria-hidden="true">{{ profileAvatar }}</div>
              <div class="dropdown-identity">
                <span class="dropdown-name">{{ profileName }}</span>
                <span class="dropdown-email">{{ profileEmail }}</span>
              </div>
            </div>
            <div class="dropdown-separator"></div>
            <button class="dropdown-logout" role="menuitem" @click="handleLogout">
              <LogOut :size="16" />
              <span>Logout</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.panel-topbar {
  height: var(--topbar-height);
  background-color: var(--panel-bg-topbar);
  border-bottom: 1px solid var(--panel-border-card);
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 90;
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle-btn {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  color: var(--panel-text-muted);
  background: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  transition: var(--transition-fast);
}

.sidebar-toggle-btn:hover {
  color: var(--panel-text-main);
  background: var(--panel-bg-card-hover);
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--panel-text-title);
  letter-spacing: -0.01em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--panel-text-muted);
  background: transparent;
  border: 1px solid transparent;
  transition: var(--transition-fast);
}

.topbar-icon-btn:hover {
  color: var(--panel-text-main);
  background: var(--panel-bg-card);
  border-color: var(--panel-border-card);
}

.notification-badge {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-accent-blue-panel);
  border: 2px solid var(--panel-bg-topbar);
}

.user-profile-widget {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 20px;
  cursor: pointer;
  transition: var(--transition-fast);
  margin-left: 4px;
}

.user-profile-widget:hover {
  background: var(--panel-user-profile-hover);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name {
  color: var(--panel-text-main);
  font-size: 14px;
  font-weight: 500;
}

.chevron-icon {
  color: var(--panel-text-faint);
}

.user-profile-wrap {
  position: relative;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 240px;
  z-index: 100;
  background: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  padding: 8px;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
}

.dropdown-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
}

.dropdown-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--panel-text-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-email {
  font-size: 12px;
  color: var(--panel-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-separator {
  height: 1px;
  background: var(--panel-border-card);
  margin: 6px 0;
}

.dropdown-logout {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition-fast);
}

.dropdown-logout:hover {
  background: rgba(239, 68, 68, 0.16);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default), transform var(--duration-fast) var(--ease-default);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Mobile */
@media (max-width: 991px) {
  .panel-topbar {
    padding: 0 16px;
  }

  .sidebar-toggle-btn {
    display: flex;
  }

  .user-name {
    display: none;
  }

  .chevron-icon {
    display: none;
  }
}
</style>
