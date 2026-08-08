<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import StatCard from '../components/dashboard/StatCard.vue'
import ServerCard from '../components/dashboard/ServerCard.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import OrderModal from '../components/server/OrderModal.vue'
import ServerDetailsModal from '../components/dashboard/ServerDetailsModal.vue'
import { useDashboardStore } from '../stores/dashboard'
import { useServerStore } from '../stores/server'
import type { ProductItem, ServerItem } from '../data/dummyData'

const dashboardStore = useDashboardStore()
const serverStore = useServerStore()

// Create Order Modal State
const isOrderModalOpen = ref(false)
const selectedProduct = ref<ProductItem | null>(null)

// Server Details Modal State
const isDetailsModalOpen = ref(false)
const selectedServer = ref<ServerItem | null>(null)

const handleOpenCreateServer = () => {
  selectedProduct.value = serverStore.products[0] ?? null
  isOrderModalOpen.value = true
}

const handleSelectServer = (server: ServerItem) => {
  selectedServer.value = server
  isDetailsModalOpen.value = true
}

const handleCloseOrderModal = () => {
  isOrderModalOpen.value = false
}

const handleCloseDetailsModal = () => {
  isDetailsModalOpen.value = false
}

const handleProvisioned = () => {
  dashboardStore.fetch()
}

onMounted(async () => {
  await Promise.all([dashboardStore.fetch(), serverStore.fetchProducts()])
  selectedProduct.value = serverStore.products[0] ?? null
})
</script>

<template>
  <div class="dashboard-page">
    <!-- Welcome Header -->
    <div class="dashboard-header">
      <h2 class="welcome-title">Welcome back, {{ dashboardStore.userName }}</h2>
      <p class="welcome-subtitle">Here's what's happening with your servers today.</p>
    </div>

    <!-- Statistic Cards Grid (4 columns) -->
    <div class="stats-grid">
      <template v-if="dashboardStore.loading">
        <div v-for="i in 4" :key="i" class="stat-skeleton-card">
          <Skeleton width="110px" height="13px" radius="6px" />
          <div class="stat-skeleton-gap" />
          <Skeleton width="80px" height="28px" radius="8px" />
        </div>
      </template>
      <template v-else>
        <StatCard
          v-for="stat in dashboardStore.stats"
          :key="stat.id"
          :stat="stat"
        />
      </template>
    </div>

    <!-- My Server Section -->
    <div class="my-server-section">
      <div class="section-header">
        <h3 class="section-title">My Server</h3>
        <button class="create-server-btn" @click="handleOpenCreateServer">
          <Plus :size="16" />
          <span>Create New Server</span>
        </button>
      </div>

      <div class="servers-grid">
        <template v-if="dashboardStore.loading">
          <div v-for="i in 2" :key="i" class="server-skeleton-card">
            <Skeleton width="100%" height="150px" radius="16px" />
          </div>
        </template>
        <template v-else>
          <ServerCard
            v-for="server in dashboardStore.servers"
            :key="server.id"
            :server="server"
            @select="handleSelectServer"
          />
        </template>
      </div>
    </div>

    <!-- Modal Order Pop-up -->
    <OrderModal
      :is-open="isOrderModalOpen"
      :product="selectedProduct"
      @close="handleCloseOrderModal"
      @provisioned="handleProvisioned"
    />

    <!-- Server Details & Credentials Modal -->
    <ServerDetailsModal
      :is-open="isDetailsModalOpen"
      :server="selectedServer"
      @close="handleCloseDetailsModal"
      @renewed="handleProvisioned"
    />
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.welcome-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--panel-text-title);
  letter-spacing: -0.3px;
}

.welcome-subtitle {
  font-size: 14px;
  color: var(--panel-text-faint);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.my-server-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--panel-text-title);
}

.create-server-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  background: #00875a;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  transition: var(--transition-fast);
  box-shadow: 0 4px 12px rgba(0, 135, 90, 0.3);
}

.create-server-btn:hover {
  background: #00a36c;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 163, 108, 0.4);
}

.servers-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-skeleton-card {
  background: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.stat-skeleton-gap {
  height: 10px;
}

.server-skeleton-card {
  display: flex;
}

/* Responsive Grid Breakpoints */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .servers-grid {
    grid-template-columns: 1fr;
  }
}
</style>
