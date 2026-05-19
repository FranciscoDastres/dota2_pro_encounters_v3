import type { Request, Response, NextFunction } from 'express'
import { logger } from '../config/logger'

export interface AppError extends Error {
  status?: number
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status ?? 500
  const message = err.message ?? 'Internal server error'

  if (status >= 500) {
    logger.error(message, { status, stack: err.stack })
  }

  // Never expose internal details for server errors
  const clientMessage = status >= 500 ? 'Internal server error' : message

  res.status(status).json({ error: clientMessage, status })
}
