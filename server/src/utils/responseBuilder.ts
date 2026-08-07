import type { Response } from 'express'

export interface ApiSuccess<T> {
  success: true
  data: T
  meta: { timestamp: string }
}

export interface ApiError {
  success: false
  message: string
  code?: string
}

export function ok<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
    meta: { timestamp: new Date().toISOString() },
  } satisfies ApiSuccess<T>)
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, 201)
}

export function fail(res: Response, message: string, statusCode = 400, code?: string): void {
  res.status(statusCode).json({
    success: false,
    message,
    ...(code ? { code } : {}),
  } satisfies ApiError)
}

export function unauthorized(res: Response, message = 'Unauthorized'): void {
  fail(res, message, 401, 'UNAUTHORIZED')
}

export function forbidden(res: Response, message = 'Forbidden'): void {
  fail(res, message, 403, 'FORBIDDEN')
}

export function notFound(res: Response, message = 'Not found'): void {
  fail(res, message, 404, 'NOT_FOUND')
}

export function serverError(res: Response, message = 'Internal server error'): void {
  fail(res, message, 500, 'INTERNAL_ERROR')
}
