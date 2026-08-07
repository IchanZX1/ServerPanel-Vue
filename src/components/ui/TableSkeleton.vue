<script setup lang="ts">
import Skeleton from './Skeleton.vue'

withDefaults(defineProps<{ rows?: number }>(), { rows: 6 })
</script>

<template>
  <div class="skeleton-table">
    <div v-for="r in rows" :key="r" class="skeleton-row">
      <Skeleton v-for="c in 6" :key="c" class="cell" height="14px" radius="6px" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-table {
  display: flex;
  flex-direction: column;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
}

.skeleton-row {
  display: flex;
  gap: 24px;
  padding: 14px 16px;
  border-bottom: 1px solid #1e293b;
}

.skeleton-row:last-child {
  border-bottom: none;
}

.cell {
  flex: 1;
}

.skeleton-row .cell:nth-child(1) { max-width: 120px; }
.skeleton-row .cell:nth-child(2) { max-width: 200px; }
.skeleton-row .cell:nth-child(3) { max-width: 160px; }
.skeleton-row .cell:nth-child(4) { max-width: 100px; }
.skeleton-row .cell:nth-child(5) { max-width: 140px; }
.skeleton-row .cell:nth-child(6) { max-width: 90px; }
</style>
