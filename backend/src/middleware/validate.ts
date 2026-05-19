import type { Request, Response, NextFunction } from 'express'
import type { ZodTypeAny } from 'zod'
import type { AppError } from './errorHandler'

/**
 * Returns an Express middleware that validates req.params against a Zod schema.
 * Calls next(400 AppError) on failure, next() on success.
 */
export function validateParams(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      const err = new Error(result.error.issues[0].message) as AppError
      err.status = 400
      return next(err)
    }
    next()
  }
}
