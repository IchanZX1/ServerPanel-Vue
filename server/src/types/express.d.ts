import type { Request } from 'express'

export interface UserPayload {
  sub: string           // user ID (UUID)
  email: string
  role: 'customer' | 'admin'
  iat: number
  exp: number
}

// Augment Express Request — req.user hanya ada setelah authenticate middleware
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload
    }
  }
}

export type {}
