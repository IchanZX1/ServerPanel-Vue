<script setup lang="ts">
import { Server } from 'lucide-vue-next'
import type { ServerItem } from '../../data/dummyData'

defineProps<{
  server: ServerItem
}>()

const emit = defineEmits<{
  (e: 'select', server: ServerItem): void
}>()
</script>

<template>
  <div class="server-card" :class="`status-${server.status}`" @click="emit('select', server)">
    <div class="server-icon-box">
      <Server :size="24" class="server-icon" />
    </div>

    <div class="server-info">
      <div class="server-header">
        <h3 class="server-name">{{ server.name }}</h3>
        <span class="status-badge" :class="server.status">
          <span class="badge-dot"></span>
          {{ server.status === 'active' ? 'Active' : 'Suspended' }}
        </span>
      </div>

      <div class="server-details">
        <p class="detail-line">Aktif hingga {{ server.activeUntil }}</p>
        <p class="detail-line tech-specs">{{ server.nodeVersion }} • {{ server.storageType }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.server-card {
  background-color: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.server-card:hover {
  background-color: var(--panel-bg-card-hover);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.server-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-active .server-icon-box {
  background: rgba(0, 230, 118, 0.12);
  color: var(--color-accent-green);
  border: 1px solid rgba(0, 230, 118, 0.25);
}

.status-suspended .server-icon-box {
  background: rgba(255, 77, 77, 0.12);
  color: var(--color-accent-red);
  border: 1px solid rgba(255, 77, 77, 0.25);
}

.server-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.server-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.server-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--panel-text-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: capitalize;
}

.status-badge.active {
  background: rgba(0, 230, 118, 0.15);
  color: var(--color-accent-green);
  border: 1px solid rgba(0, 230, 118, 0.3);
}

.status-badge.suspended {
  background: rgba(255, 77, 77, 0.15);
  color: var(--color-accent-red);
  border: 1px solid rgba(255, 77, 77, 0.3);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.server-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-line {
  font-size: 12px;
  color: var(--panel-text-muted);
}

.tech-specs {
  color: var(--panel-text-faint);
}
</style>
