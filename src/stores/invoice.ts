import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export interface InvoiceItem {
  id: string
  invoiceNumber: string
  type: string
  status: 'pending' | 'paid' | 'failed' | 'expired'
  total: number
  createdAt: string
  paidAt: string | null
  serverName: string | null
}

export const useInvoiceStore = defineStore('invoice', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const invoices = ref<InvoiceItem[]>([])

  async function fetchInvoices() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/api/invoice/list')
      invoices.value = data.data?.invoices ?? []
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { loading, error, invoices, fetchInvoices }
})
