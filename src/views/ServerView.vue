<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProductCard from '../components/server/ProductCard.vue'
import OrderModal from '../components/server/OrderModal.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import { useServerStore } from '../stores/server'
import type { ProductItem } from '../data/dummyData'

const serverStore = useServerStore()

const isModalOpen = ref(false)
const selectedProduct = ref<ProductItem | null>(null)

const handleOpenOrderModal = (product: ProductItem) => {
  selectedProduct.value = product
  isModalOpen.value = true
}

const handleCloseModal = () => {
  isModalOpen.value = false
}

const handleProvisioned = () => {
  serverStore.fetchProducts()
}

onMounted(() => serverStore.fetchProducts())
</script>

<template>
  <div class="server-products-page">
    <div class="page-header">
      <h2 class="header-title">Order New Products</h2>
      <p class="header-subtitle">
        Select a product, then specify the node, egg, and intended use for your server.
      </p>
    </div>

    <div class="products-grid">
      <template v-if="serverStore.loading">
        <div v-for="i in 4" :key="i" class="product-skeleton">
          <Skeleton width="100%" height="200px" radius="16px" />
        </div>
      </template>
      <template v-else>
        <ProductCard
          v-for="product in serverStore.products"
          :key="product.id"
          :product="product"
          @buy="handleOpenOrderModal(product)"
        />
      </template>
    </div>

    <!-- Empty state -->
    <div v-if="!serverStore.loading && serverStore.productsEmpty" class="empty-state">
      <p>Tidak ada produk tersedia saat ini.</p>
    </div>

    <!-- Modal Order Pop-up -->
    <OrderModal
      :is-open="isModalOpen"
      :product="selectedProduct"
      @close="handleCloseModal"
      @provisioned="handleProvisioned"
    />
  </div>
</template>

<style scoped>
.server-products-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
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
  letter-spacing: -0.3px;
}

.header-subtitle {
  font-size: 14px;
  color: var(--panel-text-faint);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.product-skeleton {
  display: flex;
}

@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
