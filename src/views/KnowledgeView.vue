<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import GuideStepCard from '../components/knowledge/GuideStepCard.vue'
import { guideStepsData } from '../data/dummyData'
</script>

<template>
  <div class="knowledge-page">
    <div class="page-header">
      <h2 class="header-title">Server Usage Guide</h2>
      <p class="header-subtitle">Choose the guide that suits your needs.</p>
    </div>

    <!-- 2x2 Steps Grid -->
    <div class="guides-grid">
      <GuideStepCard
        v-for="guide in guideStepsData"
        :key="guide.step"
        :guide="guide"
      />
    </div>

    <!-- Support Banner -->
    <div class="support-alert-banner">
      <div class="alert-icon-box">
        <Info :size="18" />
      </div>
      <p class="alert-text">
        Still answer encountering error during installation? Contact our team via the
        <router-link to="/contact" class="alert-link">Contact page</router-link>.
      </p>
    </div>
  </div>
</template>

<style scoped>
.knowledge-page {
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

.guides-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.support-alert-banner {
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 600px;
}

.alert-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(124, 58, 237, 0.25);
  color: #a78bfa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-text {
  font-size: 13px;
  color: var(--panel-text-muted);
  line-height: 1.5;
}

.alert-link {
  color: #a78bfa;
  font-weight: 600;
  text-decoration: underline;
}

.alert-link:hover {
  color: #c4b5fd;
}

@media (max-width: 768px) {
  .guides-grid {
    grid-template-columns: 1fr;
  }
}
</style>
