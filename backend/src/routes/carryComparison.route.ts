import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { getCarryComparison } from '../services/carryComparison.service'
import type { AppError } from '../middleware/errorHandler'
import { validateParams } from '../middleware/validate'
import { carryComparisonParamsSchema } from '../schemas/params.schema'

const router = Router()

/**
 * GET /api/carry-comparison/:accountId/:matchId/:heroId?percentile=95|99
 * Compares the selected match against OpenDota hero benchmarks for carry KPIs.
 */
router.get('/:accountId/:matchId/:heroId', validateParams(carryComparisonParamsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, matchId, heroId } = req.params
    const percentile = req.query.percentile === '99' ? 99 : 95
    const comparison = await getCarryComparison({
      accountId: parseInt(accountId, 10),
      matchId: parseInt(matchId, 10),
      heroId: parseInt(heroId, 10),
      percentile,
    })

    res.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=900')
    res.json(comparison)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      const appErr = new Error(
        status === 429
          ? 'OpenDota rate limit reached. Please try again in a few seconds.'
          : 'Could not connect to the OpenDota API.',
      ) as AppError
      appErr.status = status === 429 ? 429 : 503
      if (appErr.status === 503) res.set('Retry-After', '30')
      return next(appErr)
    }

    if (err instanceof Error && err.message.includes('circuit open')) {
      const appErr = new Error('Could not connect to the OpenDota API.') as AppError
      appErr.status = 503
      res.set('Retry-After', '30')
      return next(appErr)
    }
    next(err)
  }
})

export default router
