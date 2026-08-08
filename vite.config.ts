import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [
      vue(),
      // Plugin devtools hanya untuk mode development, tidak ikut ke production build
      ...(isProd ? [] : [vueDevTools()]),
    ],
    define: {
      // Matikan Vue Devtools pada production build
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_DEVTOOLS_GLOBAL_HOOK__: false,
    },
    server: {
      allowedHosts: ['.ngrok-free.app', 'localhost'],
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
