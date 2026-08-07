import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'dark' | 'light'

export const useThemeStore = defineStore('theme', () => {
  // Baca preferensi tersimpan, fallback ke system preference, default dark
  const stored = localStorage.getItem('zxcoder-theme') as Theme | null
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const initial: Theme = stored ?? (systemPrefersDark ? 'dark' : 'light')

  const theme = ref<Theme>(initial)

  function applyTheme(t: Theme) {
    const html = document.documentElement
    html.classList.remove('dark', 'light')
    html.classList.add(t)
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(t: Theme) {
    theme.value = t
  }

  // Persist ke localStorage & apply ke <html> setiap kali berubah
  watch(
    theme,
    (t) => {
      localStorage.setItem('zxcoder-theme', t)
      applyTheme(t)
    },
    { immediate: true }
  )

  return { theme, toggleTheme, setTheme }
})
