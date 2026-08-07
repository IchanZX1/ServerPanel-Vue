<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'
import { useAdminHeaders } from '../../composables/useAdminHeaders'
import Skeleton from '../../components/ui/Skeleton.vue'

const { getHeaders } = useAdminHeaders()

interface Stats {
  totalUsers: number
  activeServers: number
  suspendedServers: number
  totalRevenue: number
  pendingInvoices: number
  openTickets: number
}

const stats = ref<Stats | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function fetchStats() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/api/admin/dashboard', {
      headers: getHeaders(),
    })
    stats.value = data.data
  } catch {
    error.value = 'Gagal memuat statistik.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<template>
  <div class="admin-dashboard">
    <h2 class="page-title">Dashboard Overview</h2>

    <div v-if="loading" class="stats-grid">
      <div v-for="i in 6" :key="i" class="stat-card">
        <Skeleton width="90px" height="13px" radius="6px" />
        <div class="stat-skeleton-gap" />
        <Skeleton width="70px" height="26px" radius="8px" />
      </div>
    </div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else-if="stats" class="stats-grid">
      <div class="stat-card green">
        <p class="stat-label">Total Users</p>
        <p class="stat-value">{{ stats.totalUsers }}</p>
      </div>
      <div class="stat-card blue">
        <p class="stat-label">Active Servers</p>
        <p class="stat-value">{{ stats.activeServers }}</p>
      </div>
      <div class="stat-card red">
        <p class="stat-label">Suspended Servers</p>
        <p class="stat-value">{{ stats.suspendedServers }}</p>
      </div>
      <div class="stat-card purple">
        <p class="stat-label">Total Revenue</p>
        <p class="stat-value">{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.totalRevenue) }}</p>
      </div>
      <div class="stat-card yellow">
        <p class="stat-label">Pending Invoices</p>
        <p class="stat-value">{{ stats.pendingInvoices }}</p>
      </div>
      <div class="stat-card orange">
        <p class="stat-label">Open Tickets</p>
        <p class="stat-value">{{ stats.openTickets }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title { font-size: 20px; font-weight: 700; color: #f1f5f9; margin-bottom: 24px; }
.loading, .error-msg { color: #94a3b8; font-size: 14px; }
.error-msg { color: #f87171; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
.stat-label { font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }
.stat-skeleton-gap { height: 10px; }
.stat-card.green { border-left: 3px solid #22c55e; }
.stat-card.blue { border-left: 3px solid #3b82f6; }
.stat-card.red { border-left: 3px solid #ef4444; }
.stat-card.purple { border-left: 3px solid #a855f7; }
.stat-card.yellow { border-left: 3px solid #eab308; }
.stat-card.orange { border-left: 3px solid #f97316; }
@media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
</style>
