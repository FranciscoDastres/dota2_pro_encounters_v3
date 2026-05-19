import app from './app'
import { env } from './config/env'
import { logger } from './config/logger'
import { startKeepAlive } from './keepAlive'
import https from 'https';
// Solución al Warning de TLS Socket Memory Leak
// Incrementa el límite de listeners permitidos o reutiliza conexiones de forma segura
https.globalAgent.setMaxListeners(50);
app.listen(env.PORT, '0.0.0.0', () => {
  logger.info('server started', { port: env.PORT, env: env.NODE_ENV })
  startKeepAlive()
})
