export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

export interface TurnstileApi {
  render: (el: HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId?: string) => void
  getResponse: (widgetId?: string) => string | undefined
  remove: (widgetId: string) => void
}

export interface TurnstileRenderOptions {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

function getTurnstile(): TurnstileApi | undefined {
  return typeof window !== 'undefined' ? window.turnstile : undefined
}

/**
 * Tunggu sampai script Turnstile (async/defer) selesai dimuat.
 * Polling tiap 100ms, timeout 10 detik.
 */
export function waitForTurnstile(timeoutMs = 10000): Promise<TurnstileApi | undefined> {
  return new Promise((resolve) => {
    const existing = getTurnstile()
    if (existing) {
      resolve(existing)
      return
    }
    const start = Date.now()
    const timer = setInterval(() => {
      const api = getTurnstile()
      if (api) {
        clearInterval(timer)
        resolve(api)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer)
        resolve(undefined)
      }
    }, 100)
  })
}
