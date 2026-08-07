<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Ban, Power } from 'lucide-vue-next'
import api from '../../api'
import { useAdminHeaders } from '../../composables/useAdminHeaders'

const { getHeaders } = useAdminHeaders()

interface Product {
  id: string; name: string; badge: string | null; price: number
  billing_period: string; cpu_alloc: number; ram_alloc: number
  storage_alloc: number; bandwidth_alloc: string; is_available: number
  node_version: string | null; storage_type: string | null; sort_order: number
}

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showForm = ref(false)
const editId = ref<string | null>(null)

const form = ref({
  name: '',
  badge: '',
  price: 0,
  billingPeriod: 'monthly',
  cpuAlloc: 0,
  ramAlloc: 0,
  storageAlloc: 0,
  bandwidthAlloc: 'Unlimited',
  nodeVersion: 'NodeJS 22',
  storageType: 'NVMe SSD',
  sortOrder: 0,
})

function allocLabel(val: number, unit: string): string {
  return val === 0 ? 'Unlimited' : `${val} ${unit}`
}

async function fetchProducts() {
  loading.value = true; error.value = null
  try {
    const { data } = await api.get('/api/admin/products', { headers: getHeaders() })
    products.value = Array.isArray(data.data) ? data.data : []
  } catch { error.value = 'Gagal memuat produk.' }
  finally { loading.value = false }
}

function openCreate() {
  editId.value = null
  form.value = {
    name: '', badge: '', price: 0, billingPeriod: 'monthly',
    cpuAlloc: 0, ramAlloc: 0, storageAlloc: 0,
    bandwidthAlloc: 'Unlimited', nodeVersion: 'NodeJS 22',
    storageType: 'NVMe SSD', sortOrder: 0,
  }
  showForm.value = true
}

function openEdit(p: Product) {
  editId.value = p.id
  form.value = {
    name: p.name, badge: p.badge ?? '', price: p.price,
    billingPeriod: p.billing_period,
    cpuAlloc: p.cpu_alloc, ramAlloc: p.ram_alloc, storageAlloc: p.storage_alloc,
    bandwidthAlloc: p.bandwidth_alloc,
    nodeVersion: p.node_version ?? 'NodeJS 22',
    storageType: p.storage_type ?? 'NVMe SSD',
    sortOrder: p.sort_order,
  }
  showForm.value = true
}

async function submitForm() {
  if (!form.value.name.trim()) { alert('Nama produk wajib diisi.'); return }
  if (form.value.price <= 0) { alert('Harga harus lebih dari 0.'); return }
  try {
    const payload = {
      name: form.value.name.trim(),
      badge: form.value.badge.trim() || null,
      price: form.value.price,
      billingPeriod: form.value.billingPeriod,
      cpuAlloc: form.value.cpuAlloc,
      ramAlloc: form.value.ramAlloc,
      storageAlloc: form.value.storageAlloc,
      bandwidthAlloc: form.value.bandwidthAlloc.trim() || 'Unlimited',
      nodeVersion: form.value.nodeVersion.trim(),
      storageType: form.value.storageType.trim(),
      sortOrder: form.value.sortOrder,
    }
    if (editId.value) {
      await api.patch(`/api/admin/products/${editId.value}`, payload, { headers: getHeaders() })
    } else {
      await api.post('/api/admin/products', payload, { headers: getHeaders() })
    }
    showForm.value = false
    fetchProducts()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menyimpan produk.'
    alert(msg)
  }
}

async function setAvailability(id: string, isAvailable: number) {
  try {
    await api.patch(`/api/admin/products/${id}`, { isAvailable }, { headers: getHeaders() })
    fetchProducts()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal mengubah status produk.'
    alert(msg)
  }
}

async function permanentlyDeleteProduct(id: string) {
  if (!confirm('Hapus produk secara PERMANEN? Tindakan ini tidak dapat dibatalkan.')) return
  try {
    await api.delete(`/api/admin/products/${id}`, { headers: getHeaders() })
    fetchProducts()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menghapus produk.'
    alert(msg)
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">Products</h2>
      <button class="btn-primary" @click="openCreate"><Plus :size="16" /> Tambah Produk</button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="form-card">
      <h3 class="form-title">{{ editId ? 'Edit Produk' : 'Tambah Produk' }}</h3>
      <div class="form-grid">
        <div class="form-group span-2">
          <label class="form-label">Nama Produk *</label>
          <input v-model="form.name" placeholder="misal: NodeJS Starter" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Badge</label>
          <input v-model="form.badge" placeholder="POPULAR / NEW (kosongkan jika tidak ada)" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Harga (Rp) *</label>
          <input v-model.number="form.price" type="number" min="0" placeholder="25000" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Periode Billing</label>
          <select v-model="form.billingPeriod" class="form-input">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Sort Order</label>
          <input v-model.number="form.sortOrder" type="number" min="0" placeholder="0" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">CPU (% integer, 0 = Unlimited)</label>
          <input v-model.number="form.cpuAlloc" type="number" min="0" max="100" placeholder="30" class="form-input" />
          <span class="form-hint">{{ form.cpuAlloc === 0 ? 'Unlimited' : `${form.cpuAlloc}% CPU` }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">RAM (MB integer, 0 = Unlimited)</label>
          <input v-model.number="form.ramAlloc" type="number" min="0" placeholder="1024" class="form-input" />
          <span class="form-hint">{{ form.ramAlloc === 0 ? 'Unlimited' : `${form.ramAlloc} MB RAM` }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Storage (MB integer, 0 = Unlimited)</label>
          <input v-model.number="form.storageAlloc" type="number" min="0" placeholder="20480" class="form-input" />
          <span class="form-hint">{{ form.storageAlloc === 0 ? 'Unlimited' : `${form.storageAlloc} MB` }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Bandwidth</label>
          <input v-model="form.bandwidthAlloc" placeholder="Unlimited" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Node Version</label>
          <input v-model="form.nodeVersion" placeholder="NodeJS 22" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Storage Type</label>
          <input v-model="form.storageType" placeholder="NVMe SSD" class="form-input" />
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
        <thead>
          <tr>
            <th>Nama</th><th>Badge</th><th>Harga</th>
            <th>CPU</th><th>RAM</th><th>Storage</th>
            <th>Disk Type</th><th>Status</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>{{ p.name }}</td>
            <td><span v-if="p.badge" class="badge-label">{{ p.badge }}</span></td>
            <td>{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.price) }}</td>
            <td class="muted">{{ allocLabel(p.cpu_alloc, '% CPU') }}</td>
            <td class="muted">{{ allocLabel(p.ram_alloc, 'MB') }}</td>
            <td class="muted">{{ allocLabel(p.storage_alloc, 'MB') }}</td>
            <td class="muted">{{ p.storage_type ?? '-' }}</td>
            <td><span class="badge" :class="p.is_available ? 'active' : 'inactive'">{{ p.is_available ? 'Aktif' : 'Nonaktif' }}</span></td>
            <td class="actions">
              <button class="action-btn edit" @click="openEdit(p)" title="Edit"><Pencil :size="14" /></button>
              <button
                v-if="p.is_available"
                class="action-btn warn"
                @click="setAvailability(p.id, 0)"
                title="Nonaktifkan"
              >
                <Ban :size="14" />
              </button>
              <button
                v-else
                class="action-btn activate"
                @click="setAvailability(p.id, 1)"
                title="Aktifkan"
              >
                <Power :size="14" />
              </button>
              <button
                class="action-btn danger"
                @click="permanentlyDeleteProduct(p.id)"
                title="Hapus permanen"
              >
                <Trash2 :size="14" />
              </button>
            </td>
          </tr>
          <tr v-if="products.length === 0">
            <td colspan="9" style="text-align:center; color:#64748b; padding: 24px;">Belum ada produk.</td>
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
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group.span-2 { grid-column: span 2; }
.form-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
.form-hint { font-size: 11px; color: #3b82f6; margin-top: 2px; }
.form-input { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #f1f5f9; font-size: 13px; outline: none; }
.form-input:focus { border-color: #3b82f6; }
.form-actions { display: flex; gap: 10px; }
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
.badge-label { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
.actions { display: flex; gap: 6px; }
.action-btn { background: none; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; cursor: pointer; transition: all 0.15s; }
.action-btn.edit { color: #3b82f6; border-color: rgba(59,130,246,0.3); }
.action-btn.edit:hover { background: rgba(59,130,246,0.1); }
.action-btn.warn { color: #f59e0b; border-color: rgba(245,158,11,0.3); }
.action-btn.warn:hover { background: rgba(245,158,11,0.1); }
.action-btn.activate { color: #22c55e; border-color: rgba(34,197,94,0.3); }
.action-btn.activate:hover { background: rgba(34,197,94,0.1); }
.action-btn.danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
.action-btn.danger:hover { background: rgba(239,68,68,0.1); }
</style>
