<script setup lang="ts">
defineOptions({ name: 'SkeletonLoader' })

withDefaults(defineProps<{
  width?: string
  height?: string
  radius?: string
  circle?: boolean
}>(), {
  width: '100%',
  height: '16px',
  radius: '8px',
  circle: false,
})
</script>

<template>
  <div
    class="skeleton"
    :class="{ circle }"
    :style="{
      width,
      height: circle ? width : height,
      borderRadius: circle ? '50%' : radius,
    }"
  />
</template>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, #16203a 25%, #223152 37%, #16203a 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
  flex-shrink: 0;
}

@keyframes skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
</style>
