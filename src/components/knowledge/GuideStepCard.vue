<script setup lang="ts">
import type { GuideStep } from '../../data/dummyData'

defineProps<{
  guide: GuideStep
}>()
</script>

<template>
  <div class="guide-step-card">
    <div class="step-header">
      <div class="step-number">{{ guide.step }}</div>
      <h3 class="step-title">{{ guide.title }}</h3>
    </div>
    <p class="step-description">{{ guide.description }}</p>
  </div>
</template>

<style scoped>
.guide-step-card {
  background-color: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: var(--transition-fast);
}

.guide-step-card:hover {
  border-color: rgba(0, 163, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.step-number {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #0d47a1;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(13, 71, 161, 0.4);
}

.step-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--panel-text-title);
}

.step-description {
  font-size: 13px;
  line-height: 1.6;
  color: var(--panel-text-muted);
}
</style>
