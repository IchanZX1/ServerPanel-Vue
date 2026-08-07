<script setup lang="ts">
import { Server, Check } from 'lucide-vue-next'
import type { ProductItem } from '../../data/dummyData'

defineProps<{
  product: ProductItem
}>()

const emit = defineEmits<{
  (e: 'buy', product: ProductItem): void
}>()
</script>

<template>
  <div class="product-card">
    <!-- Header with Icon & Badge -->
    <div class="card-top">
      <div class="product-icon-box">
        <Server :size="22" />
      </div>
      <span class="product-badge">{{ product.badge }}</span>
    </div>

    <!-- Product Title & Price -->
    <div class="product-main-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <div class="product-price">
        <span class="price-amount">{{ product.price }}</span>
        <span class="price-period">{{ product.period }}</span>
      </div>
    </div>

    <!-- Specifications Divider -->
    <div class="spec-divider">
      <span class="spec-label">specifications</span>
    </div>

    <!-- Specs List -->
    <ul class="specs-list">
      <li class="spec-item">
        <Check :size="16" class="check-icon" />
        <span>{{ product.specs.cpu }}</span>
      </li>
      <li class="spec-item">
        <Check :size="16" class="check-icon" />
        <span>{{ product.specs.ram }}</span>
      </li>
      <li class="spec-item">
        <Check :size="16" class="check-icon" />
        <span>{{ product.specs.storage }}</span>
      </li>
      <li class="spec-item">
        <Check :size="16" class="check-icon" />
        <span>{{ product.specs.bandwidth }}</span>
      </li>
    </ul>

    <!-- Action Button -->
    <div class="card-action">
      <button class="buy-button" @click="emit('buy', product)">BUY NOW</button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background-color: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  transition: var(--transition-fast);
}

.product-card:hover {
  border-color: rgba(0, 163, 255, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(0, 230, 118, 0.12);
  border: 1px solid rgba(0, 230, 118, 0.25);
  color: var(--color-accent-green);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(0, 230, 118, 0.15);
  color: var(--color-accent-green);
  border: 1px solid rgba(0, 230, 118, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-main-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--panel-text-title);
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-amount {
  font-size: 18px;
  font-weight: 800;
  color: var(--panel-text-title);
}

.price-period {
  font-size: 13px;
  color: var(--panel-text-muted);
}

.spec-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 4px 0;
}

.spec-divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--panel-border-card);
}

.spec-label {
  position: relative;
  background-color: var(--panel-bg-card);
  padding: 0 10px;
  font-size: 11px;
  color: var(--panel-text-faint);
  text-transform: lowercase;
  letter-spacing: 0.5px;
}

.specs-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--panel-text-muted);
}

.check-icon {
  color: var(--color-accent-green);
  flex-shrink: 0;
}

.card-action {
  margin-top: 8px;
}

.buy-button {
  width: 100%;
  padding: 12px;
  border-radius: 20px;
  background: #0d47a1;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: var(--transition-fast);
}

.buy-button:hover {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(13, 71, 161, 0.4);
}
</style>
