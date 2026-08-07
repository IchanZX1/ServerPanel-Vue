import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/token.js'
import { isTokenBlacklisted } from '../utils/tokenBlacklist.js'
import { unauthorized } from '../utils/responseBuilder.js'

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    unauthorized(res)
    return
  }

  const token = authHeader.slice(7)

  // Cek blacklist (token yang sudah di-logout)
  if (await isTokenBlacklisted(token)) {
    unauthorized(res, 'Token tidak valid')
    return
  }

  // Verify signature & expiry
  const payload = verifyToken(token)
  if (!payload) {
    unauthorized(res, 'Token tidak valid atau expired')
    return
  }

  // Attach ke req.user — TIDAK pernah dikirim langsung ke response
  req.user = payload
  next()
}

export function requireRole(role: 'customer' | 'admin') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res)
      return
    }
    if (req.user.role !== role) {
      res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' })
      return
    }
    next()
  }
}
