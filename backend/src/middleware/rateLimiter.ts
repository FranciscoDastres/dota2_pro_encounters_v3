import rateLimit from 'express-rate-limit'

export function isHealthCheckPath(path: string): boolean {
  return path === '/health' || path === '/health/deep'
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isHealthCheckPath(req.path),
  message: { error: 'Too many requests. Please try again in a few minutes.', status: 429 },
})
