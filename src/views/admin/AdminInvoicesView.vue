<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircle } from 'lucide-vue-next'
import api from '../../api'
import { useAdminHeaders } from '../../composables/useAdminHeaders'
import TableSkeleton from '../../components/ui/TableSkeleton.vue'

const { getHeaders } = useAdminHeaders()

interface Invoice {
  id: string; invoice_number: string; status: string; total: number
  user_name: string; user_email: string; server_name: string | null
  created_at: string; paid_at: string | null; type: string
}

const invoices = ref<Invoice[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchInvoices() {
  loading.value = true; error.value = null
  try {
    const { data } = await api.get('/api/admin/invoices', { headers: getHeaders(), params: { page: page.value, limit: 20 } })
    invoices.value = Array.isArray(data.data?.invoices) ? data.data.invoices : []
    total.value = data.data?.total ?? 0
  } catch { error.value = 'Gagal memuat invoices.' }
  finally { loading.value = false }
}

async function confirmInvoice(id: string) {
  if (!confirm('Konfirmasi invoice ini sebagai PAID?')) return
  try {
    await api.post(`/api/admin/invoices/${id}/confirm`, {}, { headers: getHeaders() })
    fetchInvoices()
  } catch { alert('Gagal konfirmasi invoice.') }
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

onMounted(fetchInvoices)
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">Invoices</h2>
    </div>

    <div v-if="loading" class="table-wrap"><TableSkeleton :rows="6" /></div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead><tr><th>No. Invoice</th><th>User</th><th>Server</th><th>Total</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead>
        <tbody>
          <tr v-for="inv in invoices" :key="inv.id">
            <td>{{ inv.invoice_number }}</td>
            <td class="muted">{{ inv.user_email }}</td>
            <td class="muted">{{ inv.server_name ?? '-' }}</td>
            <td>{{ formatRupiah(inv.total) }}</td>
            <td><span class="badge" :class="inv.status">{{ inv.status }}</span></td>
            <td class="muted">{{ new Date(inv.created_at).toLocaleDateString('id-ID') }}</td>
            <td>
              <button v-if="inv.status === 'pending'" class="action-btn success" title="Konfirmasi Paid" @click="confirmInvoice(inv.id)">
                <CheckCircle :size="14" />
              </button>
              <span v-else class="muted">-</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="total-info">Total: {{ total }} invoices</p>
    </div>
  </div>
</template>

<style scoped>
.admin-page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-title { font-size: 20px; font-weight: 700; color: #f1f5f9; }
.loading { color: #94a3b8; font-size: 14px; }
.error-msg { color: #f87171; font-size: 14px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #1e293b; color: #94a3b8; font-weight: 500; padding: 10px 14px; text-align: left; border-bottom: 1px solid #334155; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #e2e8f0; }
.data-table tr:hover td { background: #1e293b; }
.muted { color: #64748b; }
.badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; text-transform: capitalize; }
.badge.paid { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
.badge.pending { background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.3); }
.badge.failed,.badge.expired { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.action-btn { background: none; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; cursor: pointer; transition: all 0.15s; }
.action-btn.success { color: #22c55e; border-color: rgba(34,197,94,0.3); }
.action-btn.success:hover { background: rgba(34,197,94,0.1); }
.total-info { font-size: 12px; color: #64748b; margin-top: 12px; }
</style>
