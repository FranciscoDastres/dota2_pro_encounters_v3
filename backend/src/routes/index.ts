import { Router } from 'express'
import axios from 'axios'
import { env } from '../config/env'
import { query } from '../services/database.service'
import proEncountersRouter from './proEncounters.route'
import proMatchesRouter from './proMatches.route'
import carryComparisonRouter from './carryComparison.route'

const router = Router()

router.use('/pro-encounters', proEncountersRouter)
router.use('/pro-matches', proMatchesRouter)
router.use('/carry-comparison', carryComparisonRouter)

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Deep health check: verifies database connectivity and OpenDota reachability.
// Used by uptime monitors / deployment pipelines.
router.get('/health/deep', async (_req, res) => {
  const checks: Record<string, 'ok' | 'error'> = {}

  await Promise.allSettled([
    (async () => {
      try {
        await query('select 1')
        checks.database = 'ok'
      } catch {
        checks.database = 'error'
      }
    })(),
    (async () => {
      try {
        const response = await axios.get(`${env.OPENDOTA_API_URL}/heroes`, {
          timeout: 5_000,
          params: env.OPENDOTA_API_KEY ? { api_key: env.OPENDOTA_API_KEY } : {},
        })
        checks.openDota = response.status < 500 ? 'ok' : 'error'
      } catch {
        checks.openDota = 'error'
      }
    })(),
  ])

  const allOk = Object.values(checks).every((v) => v === 'ok')

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  })
})

export default router
