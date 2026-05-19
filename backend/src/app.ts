import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { morganStream } from './config/logger'
import { apiLimiter } from './middleware/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import apiRouter from './routes'

const app = express()

// Render (and most PaaS) sit behind a reverse proxy — trust the first hop
// so express-rate-limit can read the real client IP from X-Forwarded-For
app.set('trust proxy', 1)

app.use(
  helmet({
    // Pure REST API — block all content sources and framing
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // HSTS: 1 year, include subdomains, opt-in to preload list
    hsts: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
  }),
)
app.use(morgan(env.isDevelopment ? 'dev' : 'combined', { stream: morganStream }))

const allowedOrigins = new Set([
  env.FRONTEND_URL,
  ...(env.isDevelopment ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : []),
])

const isPrivateIpv4 = (hostname: string) => {
  const parts = hostname.split('.').map(Number)

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }

  const [first, second] = parts

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    (first === 0 && second === 0)
  )
}

export const isAllowedCorsOrigin = (
  origin: string | undefined,
  allowLocalDevelopmentOrigins = env.isDevelopment,
) => {
  if (!origin || allowedOrigins.has(origin)) {
    return true
  }

  if (!allowLocalDevelopmentOrigins) {
    return false
  }

  try {
    const url = new URL(origin)
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
    const isLocalHostname =
      url.hostname === 'localhost' || url.hostname === '::1' || isPrivateIpv4(url.hostname)

    return isHttp && isLocalHostname
  } catch {
    return false
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no Origin header), configured origins, and local dev hosts.
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET'],
    optionsSuccessStatus: 200,
  }),
)

app.use(express.json({ limit: '100kb' }))

app.use('/api', apiLimiter)
app.use('/api', apiRouter)

// Must be registered last
app.use(errorHandler)

export default app
