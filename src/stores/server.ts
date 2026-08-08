import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'
import { formatMB, formatCPU } from '../utils/formatSpecs'
import type { ProductItem } from '../data/dummyData'

export const useServerStore = defineStore('server', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const products = ref<ProductItem[]>([])
  const productsEmpty = ref(false)

  async function fetchProducts() {
    loading.value = true
    error.value = null
    productsEmpty.value = false
    try {
      const { data } = await api.post('/api/server/list')
      if (data.data?.productsEmpty) {
        productsEmpty.value = true
        products.value = []
      } else {
        products.value = (data.data?.products ?? []).map((p: Record<string, unknown>) => ({
          id: p['id'],
          name: p['name'],
          badge: p['badge'] ?? '',
          price: String(p['price'] ?? '0'),
          period: p['billingPeriod'] ?? 'monthly',
          specs: {
            cpu: formatCPU(Number(p['cpuAlloc'] ?? 0)),
            ram: formatMB(Number(p['ramAlloc'] ?? 0)),
            storage: formatMB(Number(p['storageAlloc'] ?? 0)),
            bandwidth: String(p['bandwidthAlloc'] ?? 'Unlimited'),
          },
        }))
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { loading, error, products, productsEmpty, fetchProducts }
})
