import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'
import { env } from '../config/env.js'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err, path: req.path, method: req.method }, '[errorHandler] unhandled error')

  // Jangan kirim stack trace atau pesan internal ke client di production
  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message

  res.status(500).json({
    success: false,
    message,
    code: 'INTERNAL_ERROR',
  })
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} tidak ditemukan`,
    code: 'NOT_FOUND',
  })
}
