import type { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = (result.error as ZodError).flatten().fieldErrors
      res.status(422).json({
        success: false,
        message: 'Validasi input gagal',
        code: 'VALIDATION_ERROR',
        errors,
      })
      return
    }
    req.body = result.data
    next()
  }
}
