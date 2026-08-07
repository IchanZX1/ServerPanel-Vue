<script setup lang="ts">
import { computed } from 'vue'
import {
  Server,
  Disc,
  CreditCard,
  Calendar,
  TrendingUp,
  BarChart2
} from 'lucide-vue-next'
import type { StatItem } from '../../data/dummyData'

const props = defineProps<{
  stat: StatItem
}>()

const iconComponent = computed(() => {
  switch (props.stat.iconName) {
    case 'Server': return Server
    case 'Disc': return Disc
    case 'CreditCard': return CreditCard
    case 'Calendar': return Calendar
    default: return Server
  }
})

const trendComponent = computed(() => {
  switch (props.stat.trendIcon) {
    case 'BarChart2': return BarChart2
    case 'TrendingUp':
    default: return TrendingUp
  }
})
</script>

<template>
  <div class="stat-card" :class="`color-${stat.color}`">
    <div class="stat-top">
      <div class="main-icon-wrapper">
        <component :is="iconComponent" :size="22" class="main-icon" />
      </div>
      <div class="trend-icon-wrapper">
        <component :is="trendComponent" :size="14" class="trend-icon" />
      </div>
    </div>

    <div class="stat-content">
      <span class="stat-title">{{ stat.title }}</span>
      <div class="stat-value">{{ stat.value }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background-color: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
  transition: var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.15);
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.main-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trend-icon-wrapper {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 163, 255, 0.15);
  color: #00a3ff;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--panel-text-muted);
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* Color Variations matching reference image glows */
.color-green {
  border-bottom: 2px solid var(--color-accent-green);
}
.color-green .main-icon-wrapper {
  background: rgba(0, 230, 118, 0.15);
  color: var(--color-accent-green);

}
.color-green .stat-value {
  color: var(--color-accent-green);
}

.color-red {
  border-bottom: 2px solid var(--color-accent-red);
}
.color-red .main-icon-wrapper {
  background: rgba(255, 77, 77, 0.15);
  color: var(--color-accent-red);
}
.color-red .stat-value {
  color: var(--color-accent-red);
}
.color-red .trend-icon-wrapper {
  background: rgba(255, 77, 77, 0.15);
  color: var(--color-accent-red);
}

.color-purple {
  border-bottom: 2px solid var(--color-accent-purple);
}
.color-purple .main-icon-wrapper {
  background: rgba(179, 87, 255, 0.15);
  color: var(--color-accent-purple);
}
.color-purple .stat-value {
  color: var(--color-accent-purple);
}

.color-blue {
  border-bottom: 2px solid var(--color-accent-blue);
}
.color-blue .main-icon-wrapper {
  background: rgba(0, 163, 255, 0.15);
  color: var(--color-accent-blue);
}
.color-blue .stat-value {
  color: var(--color-accent-blue);
  font-size: 22px;
}
</style>
