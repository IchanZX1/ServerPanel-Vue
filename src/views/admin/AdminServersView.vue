<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, PauseCircle, PlayCircle, Trash2 } from 'lucide-vue-next'
import api from '../../api'
import { useAdminHeaders } from '../../composables/useAdminHeaders'
import TableSkeleton from '../../components/ui/TableSkeleton.vue'

const { getHeaders } = useAdminHeaders()

interface ServerRow {
  id: string; name: string; status: string; active_until: string
  user_name: string; user_email: string; product_name: string
  ip_address: string | null; suspend_reason: string | null
}

const servers = ref<ServerRow[]>([])
const total = ref(0)
const page = ref(1)
const search = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchServers() {
  loading.value = true; error.value = null
  try {
    const { data } = await api.get('/api/admin/servers', { headers: getHeaders(), params: { page: page.value, limit: 20, search: search.value || undefined } })
    servers.value = Array.isArray(data.data?.servers) ? data.data.servers : []
    total.value = data.data?.total ?? 0
  } catch { error.value = 'Gagal memuat servers.' }
  finally { loading.value = false }
}

async function suspendServer(id: string) {
  const reason = prompt('Alasan suspend (opsional):') ?? ''
  try {
    await api.post(`/api/admin/servers/${id}/suspend`, { reason }, { headers: getHeaders() })
    fetchServers()
  } catch { alert('Gagal suspend server.') }
}

async function unsuspendServer(id: string) {
  try {
    await api.post(`/api/admin/servers/${id}/unsuspend`, {}, { headers: getHeaders() })
    fetchServers()
  } catch { alert('Gagal unsuspend server.') }
}

async function deleteServer(id: string) {
  if (!confirm('Hapus server ini permanen?')) return
  try {
    await api.delete(`/api/admin/servers/${id}`, { headers: getHeaders() })
    fetchServers()
  } catch { alert('Gagal menghapus server.') }
}

onMounted(fetchServers)
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">Servers</h2>
      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input v-model="search" @input="page=1;fetchServers()" placeholder="Cari nama / email..." class="search-input" />
      </div>
    </div>

    <div v-if="loading" class="table-wrap"><TableSkeleton :rows="6" /></div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Nama</th><th>User</th><th>Produk</th><th>Status</th><th>Aktif Hingga</th><th>Aksi</th></tr></thead>
        <tbody>
          <tr v-for="s in servers" :key="s.id">
            <td>{{ s.name }}</td>
            <td class="muted">{{ s.user_email }}</td>
            <td class="muted">{{ s.product_name }}</td>
            <td><span class="badge" :class="s.status">{{ s.status }}</span></td>
            <td class="muted">{{ new Date(s.active_until).toLocaleDateString('id-ID') }}</td>
            <td class="actions">
              <button v-if="s.status === 'active'" class="action-btn warn" title="Suspend" @click="suspendServer(s.id)"><PauseCircle :size="14" /></button>
              <button v-if="s.status === 'suspended'" class="action-btn success" title="Unsuspend" @click="unsuspendServer(s.id)"><PlayCircle :size="14" /></button>
              <button class="action-btn danger" title="Hapus" @click="deleteServer(s.id)"><Trash2 :size="14" /></button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="total-info">Total: {{ total }} servers</p>
    </div>
  </div>
</template>

<style scoped>
.admin-page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-size: 20px; font-weight: 700; color: #f1f5f9; }
.search-box { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 10px; color: #64748b; }
.search-input { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px 8px 32px; color: #f1f5f9; font-size: 13px; outline: none; width: 240px; }
.loading { color: #94a3b8; font-size: 14px; }
.error-msg { color: #f87171; font-size: 14px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #1e293b; color: #94a3b8; font-weight: 500; padding: 10px 14px; text-align: left; border-bottom: 1px solid #334155; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #e2e8f0; }
.data-table tr:hover td { background: #1e293b; }
.muted { color: #64748b; }
.badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; text-transform: capitalize; }
.badge.active { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
.badge.suspended { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.badge.terminated { background: rgba(100,116,139,0.15); color: #64748b; border: 1px solid rgba(100,116,139,0.3); }
.actions { display: flex; gap: 6px; }
.action-btn { background: none; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; cursor: pointer; transition: all 0.15s; }
.action-btn.warn { color: #eab308; border-color: rgba(234,179,8,0.3); }
.action-btn.warn:hover { background: rgba(234,179,8,0.1); }
.action-btn.success { color: #22c55e; border-color: rgba(34,197,94,0.3); }
.action-btn.success:hover { background: rgba(34,197,94,0.1); }
.action-btn.danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
.action-btn.danger:hover { background: rgba(239,68,68,0.1); }
.total-info { font-size: 12px; color: #64748b; margin-top: 12px; }
</style>
