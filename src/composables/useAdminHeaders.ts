import { computed } from 'vue'
import { useAdminAuthStore } from '../stores/adminAuth'

/**
 * Returns a reactive computed headers object with the current admin JWT token.
 * Use `headers.value` when passing to axios config directly.
 */
export function useAdminHeaders() {
  const adminAuth = useAdminAuthStore()
  const headers = computed(() => ({
    Authorization: `Bearer ${adminAuth.accessToken ?? ''}`,
  }))

  /** Convenience: get plain headers object for use in axios config */
  function getHeaders() {
    return headers.value
  }

  return { headers, getHeaders }
}
