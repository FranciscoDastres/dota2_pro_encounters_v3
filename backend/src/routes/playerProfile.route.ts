import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import type { AppError } from '../middleware/errorHandler'
import { validateParams } from '../middleware/validate'
import { proEncountersParamsSchema } from '../schemas/params.schema'
import { getPlayerProfileSummary } from '../services/playerProfile.service'

const router = Router()

router.get('/:accountId', validateParams(proEncountersParamsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = parseInt(req.params.accountId, 10)
    const profile = await getPlayerProfileSummary(accountId)

    res.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=900')
    res.json({ account_id: accountId, profile })
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
