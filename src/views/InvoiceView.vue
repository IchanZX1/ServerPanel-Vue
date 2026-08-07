<script setup lang="ts">
import { onMounted } from 'vue'
import { CreditCard } from 'lucide-vue-next'
import { useInvoiceStore } from '../stores/invoice'

const store = useInvoiceStore()

onMounted(() => store.fetchInvoices())

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

function statusLabel(status: string) {
  const map: Record<string, string> = { paid: 'Lunas', pending: 'Menunggu', failed: 'Gagal', expired: 'Kadaluarsa' }
  return map[status] ?? status
}
</script>

<template>
  <div class="invoice-page">
    <div class="page-header">
      <h2 class="header-title">Invoices</h2>
      <p class="header-subtitle">Riwayat pembayaran dan tagihan Anda.</p>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="empty-state-card">
      <p class="state-desc">Memuat data invoice...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="!store.invoices.length" class="empty-state-card">
      <div class="icon-box">
        <CreditCard :size="32" />
      </div>
      <h2 class="state-title">No Invoices Found</h2>
      <p class="state-desc">You do not have any active or past invoices yet.</p>
    </div>

    <!-- Invoice List -->
    <div v-else class="invoice-list">
      <div v-for="inv in store.invoices" :key="inv.id" class="invoice-row">
        <div class="inv-left">
          <span class="inv-number">{{ inv.invoiceNumber }}</span>
          <span class="inv-server">{{ inv.serverName ?? '-' }}</span>
        </div>
        <div class="inv-right">
          <span class="inv-amount">{{ formatRupiah(inv.total) }}</span>
          <span class="inv-status" :class="`status-${inv.status}`">{{ statusLabel(inv.status) }}</span>
          <span class="inv-date">{{ inv.createdAt }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invoice-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--panel-text-title);
}

.header-subtitle {
  font-size: 14px;
  color: var(--panel-text-faint);
}

.empty-state-card {
  background: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  border-radius: 16px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  max-width: 400px;
  margin: 0 auto;
}

.icon-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(0, 163, 255, 0.12);
  color: #00a3ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--panel-text-title);
}

.state-desc {
  font-size: 14px;
  color: var(--panel-text-faint);
}

.invoice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.invoice-row {
  background: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.inv-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inv-number {
  font-size: 14px;
  font-weight: 600;
  color: var(--panel-text-title);
}

.inv-server {
  font-size: 12px;
  color: var(--panel-text-muted);
}

.inv-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.inv-amount {
  font-size: 14px;
  font-weight: 700;
  color: var(--panel-text-title);
}

.inv-date {
  font-size: 12px;
  color: var(--panel-text-faint);
}

.inv-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.status-paid {
  background: rgba(0, 230, 118, 0.15);
  color: #00e676;
  border: 1px solid rgba(0, 230, 118, 0.3);
}

.status-pending {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.status-failed,
.status-expired {
  background: rgba(255, 77, 77, 0.15);
  color: #ff4d4d;
  border: 1px solid rgba(255, 77, 77, 0.3);
}

@media (max-width: 640px) {
  .invoice-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

