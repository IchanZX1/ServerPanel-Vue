import { env } from '../../config/env.js'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
}

/**
 * Verifikasi token Cloudflare Turnstile.
 * Jika TURNSTILE_SECRET_KEY kosong: production menolak, development di-skip
 * (agar tetap bisa develop tanpa harus mengisi secret).
 */
export async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  if (!env.TURNSTILE_SECRET_KEY) {
    return env.NODE_ENV !== 'production'
  }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  })

  const res = await fetch(SITEVERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) return false

  const data = (await res.json()) as TurnstileVerifyResponse
  return data.success
}
