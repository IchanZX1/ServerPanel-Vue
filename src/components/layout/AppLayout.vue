<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import { useThemeStore } from '../../stores/theme'

const route = useRoute()
const isSidebarOpen = ref(false)

// Inisialisasi theme store supaya dark/light class ter-apply ke <html>
useThemeStore()

const isStandalonePage = computed(() => {
  return route.path === '/' || route.path === '/login' || route.path === '/register' || route.path.startsWith('/admin')
})

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<template>
  <div v-if="isStandalonePage" class="standalone-wrapper">
    <RouterView />
  </div>

  <div v-else class="panel-layout">
    <AppSidebar :is-open="isSidebarOpen" @close="closeSidebar" />
    <div class="panel-main-wrapper">
      <AppTopbar @toggle-sidebar="toggleSidebar" />
      <main class="panel-main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.standalone-wrapper {
  min-height: 100vh;
  width: 100%;
}

.panel-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--panel-bg-main);
}

.panel-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-normal);
}

.panel-main-content {
  flex: 1;
  padding: 32px;
  max-width: 1400px;
  width: 100%;
}

@media (max-width: 991px) {
  .panel-main-wrapper {
    margin-left: 0;
  }
  .panel-main-content {
    padding: 20px 16px;
  }
}
</style>
