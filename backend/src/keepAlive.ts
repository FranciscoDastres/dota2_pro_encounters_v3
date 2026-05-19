import { env } from './config/env'
import { logger } from './config/logger'

const PING_INTERVAL_MS = 14 * 60 * 1000 // 14 minutes — Render spins down after 15 min

export function startKeepAlive(): void {
  if (!env.isProduction) return

  const backendUrl = process.env.RENDER_EXTERNAL_URL
  if (!backendUrl) {
    logger.warn('RENDER_EXTERNAL_URL not set — keep-alive disabled')
    return
  }

  const healthUrl = `${backendUrl}/api/health`

  setInterval(async () => {
    try {
      const res = await fetch(healthUrl)
      logger.info('keep-alive ping', { status: res.status, url: healthUrl })
    } catch (err) {
      logger.error('keep-alive ping failed', { url: healthUrl, err })
    }
  }, PING_INTERVAL_MS)

  logger.info('keep-alive started', { url: healthUrl, intervalMs: PING_INTERVAL_MS })
}
