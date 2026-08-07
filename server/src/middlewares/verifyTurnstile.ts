import type { Request, Response, NextFunction } from 'express'
import { verifyTurnstileToken } from '../modules/turnstile/turnstile.service.js'
import { fail } from '../utils/responseBuilder.js'

export async function verifyTurnstile(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = (req.body as { turnstileToken?: string } | undefined)?.turnstileToken
  const ok = await verifyTurnstileToken(token)
  if (!ok) {
    fail(res, 'Verifikasi captcha gagal. Silakan coba lagi.', 400, 'CAPTCHA_FAILED')
    return
  }
  next()
}
