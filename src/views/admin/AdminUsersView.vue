<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, Trash2 } from 'lucide-vue-next'
import api from '../../api'
import { useAdminHeaders } from '../../composables/useAdminHeaders'
import TableSkeleton from '../../components/ui/TableSkeleton.vue'

const { getHeaders } = useAdminHeaders()

interface User {
  id: string; name: string; username: string; email: string
  is_active: number; created_at: string
}

const users = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const search = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchUsers() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/api/admin/users', {
      headers: getHeaders(),
      params: { page: page.value, limit: 20, search: search.value || undefined },
    })
    users.value = Array.isArray(data.data?.users) ? data.data.users : []
    total.value = data.data?.total ?? 0
  } catch { error.value = 'Gagal memuat users.' }
  finally { loading.value = false }
}

async function deleteUser(id: string) {
  if (!confirm('Hapus user ini?')) return
  try {
    await api.delete(`/api/admin/users/${id}`, { headers: getHeaders() })
    fetchUsers()
  } catch { alert('Gagal menghapus user.') }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">Users</h2>
      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input v-model="search" @input="page = 1; fetchUsers()" placeholder="Cari email / nama..." class="search-input" />
      </div>
    </div>

    <div v-if="loading" class="table-wrap"><TableSkeleton :rows="6" /></div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Nama</th><th>Username</th><th>Email</th><th>Status</th><th>Bergabung</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.name }}</td>
            <td class="muted">{{ u.username }}</td>
            <td>{{ u.email }}</td>
            <td><span class="badge" :class="u.is_active ? 'active' : 'inactive'">{{ u.is_active ? 'Aktif' : 'Nonaktif' }}</span></td>
            <td class="muted">{{ new Date(u.created_at).toLocaleDateString('id-ID') }}</td>
            <td>
              <button class="action-btn danger" @click="deleteUser(u.id)"><Trash2 :size="14" /></button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="total-info">Total: {{ total }} users</p>
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
.loading, .error-msg { color: #94a3b8; font-size: 14px; }
.error-msg { color: #f87171; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #1e293b; color: #94a3b8; font-weight: 500; padding: 10px 14px; text-align: left; border-bottom: 1px solid #334155; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #e2e8f0; }
.data-table tr:hover td { background: #1e293b; }
.muted { color: #64748b; }
.badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
.badge.active { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
.badge.inactive { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.action-btn { background: none; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; cursor: pointer; transition: all 0.15s; }
.action-btn.danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
.action-btn.danger:hover { background: rgba(239,68,68,0.1); }
.total-info { font-size: 12px; color: #64748b; margin-top: 12px; }
</style>
