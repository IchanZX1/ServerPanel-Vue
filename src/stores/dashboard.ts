import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'
import type { StatItem, ServerItem } from '../data/dummyData'

export const useDashboardStore = defineStore('dashboard', () => {
  const loading = ref(true)
  const error = ref<string | null>(null)

  const userName = ref('')
  const stats = ref<StatItem[]>([])
  const servers = ref<ServerItem[]>([])

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post('/api/dashboard')
      const d = data.data

      userName.value = d.user?.name ?? ''
      const s = d.stats ?? {}

      stats.value = [
        {
          id: 'active-servers',
          title: 'Server Aktif',
          value: s.activeServers ?? 0,
          color: 'green',
          iconName: 'Server',
          trendIcon: 'TrendingUp',
        },
        {
          id: 'suspended-servers',
          title: 'Server Suspended',
          value: s.suspendedServers ?? 0,
          color: 'red',
          iconName: 'Disc',
          trendIcon: 'BarChart2',
        },
        {
          id: 'total-transactions',
          title: 'Transaction Total',
          value: s.totalTransactions ?? 0,
          color: 'purple',
          iconName: 'CreditCard',
          trendIcon: 'TrendingUp',
        },
        {
          id: 'joined-since',
          title: 'Bergabung sejak',
          value: s.joinedSince ?? '-',
          color: 'blue',
          iconName: 'Calendar',
          trendIcon: 'TrendingUp',
        },
      ]

      servers.value = (d.servers ?? []).map((s: Record<string, unknown>) => ({
        id: s['id'],
        name: s['name'],
        status: s['status'],
        nodeVersion: s['nodeVersion'] ?? 'NodeJS 22',
        storageType: s['storageType'] ?? 'NVMe SSD',
        activeUntil: s['activeUntil'] ?? '-',
        createdDate: s['createdDate'] ?? '-',
        ipAddress: s['ipAddress'] ?? undefined,
        panelUsername: s['panelUsername'] ?? undefined,
        panelPassword: s['panelPassword'] ?? undefined,
        specs: s['specs'] ?? undefined,
      }))
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { loading, error, userName, stats, servers, fetch }
})
