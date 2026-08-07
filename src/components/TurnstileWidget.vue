<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { TURNSTILE_SITE_KEY, waitForTurnstile } from '../utils/turnstile'

const props = defineProps<{
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
}>()

const emit = defineEmits<{
  (e: 'success', token: string): void
  (e: 'expired'): void
}>()

const container = ref<HTMLElement | null>(null)
let widgetId: string | null = null

onMounted(async () => {
  if (!TURNSTILE_SITE_KEY) {
    emit('expired')
    return
  }
  const turnstile = await waitForTurnstile()
  if (!turnstile || !container.value) {
    emit('expired')
    return
  }
  widgetId = turnstile.render(container.value, {
    sitekey: TURNSTILE_SITE_KEY,
    theme: props.theme ?? 'dark',
    size: props.size ?? 'normal',
    callback: (token: string) => emit('success', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('expired'),
  })
})

onBeforeUnmount(() => {
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId)
    widgetId = null
  }
})

defineExpose({
  reset: () => {
    if (window.turnstile && widgetId) window.turnstile.reset(widgetId)
  },
})
</script>

<template>
  <div ref="container" class="turnstile-widget"></div>
</template>

<style scoped>
.turnstile-widget {
  display: flex;
  justify-content: center;
  min-height: 65px;
}

.turnstile-widget iframe {
  margin: 0 auto;
}
</style>
