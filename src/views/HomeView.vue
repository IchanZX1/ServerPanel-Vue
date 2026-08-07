<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '../stores/theme'
import AppNavbar from '../components/AppNavbar.vue'
import HeroSection from '../components/sections/HeroSection.vue'
import StatisticsSection from '../components/sections/StatisticsSection.vue'
import PricingSection from '../components/sections/PricingSection.vue'
import WhyChooseSection from '../components/sections/WhyChooseSection.vue'
import FaqSection from '../components/sections/FaqSection.vue'
import AppFooter from '../components/AppFooter.vue'

// Inisialisasi theme store supaya class dark/light ter-apply ke <html>
useThemeStore()

// Global fade-in observer untuk .fade-in elements
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.12 }
  )
  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el))
})
</script>

<template>
  <div class="landing-page">
    <AppNavbar />
    <main id="main-content">
      <HeroSection />
      <StatisticsSection />
      <PricingSection />
      <WhyChooseSection />
      <FaqSection />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.landing-page {
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-surface-base, #000000);
  color: var(--color-text-primary, #e2e8f0);
}
</style>
