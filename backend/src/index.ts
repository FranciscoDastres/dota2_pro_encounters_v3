import app from './app'
import { env } from './config/env'
import { logger } from './config/logger'
import { warmDotaConstantsCaches } from './services/dotaConstants.service'
import { getHeroes } from './services/openDota.service'

app.listen(env.PORT, '0.0.0.0', () => {
  logger.info('server started', { port: env.PORT, env: env.NODE_ENV })

  if (env.isProduction) {
    void Promise.all([warmDotaConstantsCaches(), getHeroes()])
      .then(() => logger.info('Dota reference data warmed'))
      .catch((err) => logger.warn('Dota reference data warmup failed', { err }))
  }
})
