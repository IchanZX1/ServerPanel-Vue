<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-vue-next'
import api from '../../api'
import { useAdminHeaders } from '../../composables/useAdminHeaders'

const { getHeaders } = useAdminHeaders()

interface Voucher {
  id: string; code: string; type: 'percentage' | 'fixed'; value: number
  min_purchase: number; usage_count: number; usage_limit: number | null
  is_active: number; valid_from: string; valid_until: string
}

const vouchers = ref<Voucher[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showForm = ref(false)

const form = ref({ code: '', type: 'fixed' as 'fixed' | 'percentage', value: 0, minPurchase: 0, maxDiscount: 0, usageLimit: 0, validFrom: '', validUntil: '' })

async function fetchVouchers() {
  loading.value = true; error.value = null
  try {
    const { data } = await api.get('/api/admin/vouchers', { headers: getHeaders() })
    vouchers.value = Array.isArray(data.data) ? data.data : []
  } catch { error.value = 'Gagal memuat vouchers.' }
  finally { loading.value = false }
}

async function submitForm() {
  try {
    await api.post('/api/admin/vouchers', {
      ...form.value,
      maxDiscount: form.value.maxDiscount || null,
      usageLimit: form.value.usageLimit || null,
    }, { headers: getHeaders() })
    showForm.value = false; fetchVouchers()
  } catch { alert('Gagal membuat voucher.') }
}

async function toggleVoucher(id: string) {
  try {
    await api.patch(`/api/admin/vouchers/${id}/toggle`, {}, { headers: getHeaders() })
    fetchVouchers()
  } catch { alert('Gagal mengubah status voucher.') }
}

async function deleteVoucher(id: string) {
  if (!confirm('Hapus voucher ini?')) return
  try {
    await api.delete(`/api/admin/vouchers/${id}`, { headers: getHeaders() })
    fetchVouchers()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menghapus voucher.'
    alert(msg)
  }
}

onMounted(fetchVouchers)
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">Vouchers</h2>
      <button class="btn-primary" @click="showForm = !showForm"><Plus :size="16" /> Buat Voucher</button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="form-card">
      <h3 class="form-title">Buat Voucher Baru</h3>
      <div class="form-grid">
        <input v-model="form.code" placeholder="Kode voucher (misal: HEMAT50)" class="form-input" style="text-transform:uppercase" />
        <select v-model="form.type" class="form-input">
          <option value="fixed">Fixed (Rp)</option>
          <option value="percentage">Persentase (%)</option>
        </select>
        <input v-model.number="form.value" type="number" placeholder="Nilai diskon" class="form-input" />
        <input v-model.number="form.minPurchase" type="number" placeholder="Min. pembelian (0 = tidak ada)" class="form-input" />
        <input v-model.number="form.maxDiscount" type="number" placeholder="Maks. diskon (0 = tidak ada)" class="form-input" />
        <input v-model.number="form.usageLimit" type="number" placeholder="Limit pemakaian (0 = unlimited)" class="form-input" />
        <div class="form-group-full">
          <label class="form-label">Berlaku Dari</label>
          <input v-model="form.validFrom" type="datetime-local" class="form-input" />
        </div>
        <div class="form-group-full">
          <label class="form-label">Berlaku Hingga</label>
          <input v-model="form.validUntil" type="datetime-local" class="form-input" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" @click="submitForm">Simpan</button>
        <button class="btn-secondary" @click="showForm = false">Batal</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Memuat...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Kode</th><th>Tipe</th><th>Nilai</th><th>Min. Beli</th><th>Terpakai</th><th>Status</th><th>Berlaku Hingga</th><th>Aksi</th></tr></thead>
        <tbody>
          <tr v-for="v in vouchers" :key="v.id">
            <td class="code">{{ v.code }}</td>
            <td class="muted">{{ v.type === 'percentage' ? '%' : 'Fixed' }}</td>
            <td>{{ v.type === 'percentage' ? v.value + '%' : 'Rp' + v.value.toLocaleString('id-ID') }}</td>
            <td class="muted">{{ v.min_purchase > 0 ? 'Rp' + v.min_purchase.toLocaleString('id-ID') : '-' }}</td>
            <td class="muted">{{ v.usage_count }}{{ v.usage_limit ? '/' + v.usage_limit : '' }}</td>
            <td><span class="badge" :class="v.is_active ? 'active' : 'inactive'">{{ v.is_active ? 'Aktif' : 'Nonaktif' }}</span></td>
            <td class="muted">{{ new Date(v.valid_until).toLocaleDateString('id-ID') }}</td>
            <td class="actions">
              <button class="action-btn toggle" @click="toggleVoucher(v.id)" :title="v.is_active ? 'Nonaktifkan' : 'Aktifkan'">
                <component :is="v.is_active ? ToggleRight : ToggleLeft" :size="16" />
              </button>
              <button class="action-btn danger" @click="deleteVoucher(v.id)"><Trash2 :size="14" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.admin-page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.page-title { font-size: 20px; font-weight: 700; color: #f1f5f9; }
.btn-primary { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #3b82f6; color: #fff; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: background 0.15s; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { padding: 8px 14px; background: #334155; color: #f1f5f9; border-radius: 8px; font-size: 13px; cursor: pointer; border: none; }
.form-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
.form-title { font-size: 15px; font-weight: 600; color: #f1f5f9; margin-bottom: 16px; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
.form-group-full { grid-column: span 1; display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 12px; color: #94a3b8; }
.form-input { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #f1f5f9; font-size: 13px; outline: none; }
.form-input:focus { border-color: #3b82f6; }
.form-actions { display: flex; gap: 10px; }
.loading, .error-msg { font-size: 14px; }
.loading { color: #94a3b8; }
.error-msg { color: #f87171; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #1e293b; color: #94a3b8; font-weight: 500; padding: 10px 14px; text-align: left; border-bottom: 1px solid #334155; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #e2e8f0; }
.data-table tr:hover td { background: #1e293b; }
.muted { color: #64748b; }
.code { font-family: monospace; font-weight: 600; color: #a78bfa; }
.badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
.badge.active { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
.badge.inactive { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.actions { display: flex; gap: 6px; }
.action-btn { background: none; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; cursor: pointer; transition: all 0.15s; }
.action-btn.toggle { color: #3b82f6; border-color: rgba(59,130,246,0.3); }
.action-btn.toggle:hover { background: rgba(59,130,246,0.1); }
.action-btn.danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
.action-btn.danger:hover { background: rgba(239,68,68,0.1); }
</style>
