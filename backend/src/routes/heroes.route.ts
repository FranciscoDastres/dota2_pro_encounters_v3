import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import type { AppError } from '../middleware/errorHandler'
import { openDotaHeroesSchema } from '../services/carryComparison.schemas'
import { getHeroes } from '../services/openDota.service'

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const heroes = openDotaHeroesSchema
      .parse(await getHeroes())
      .filter((hero): hero is typeof hero & { localized_name: string } => Boolean(hero.localized_name))

    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    res.json({ heroes })
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const appErr = new Error('Could not connect to the OpenDota API.') as AppError
      appErr.status = 503
      res.set('Retry-After', '30')
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
