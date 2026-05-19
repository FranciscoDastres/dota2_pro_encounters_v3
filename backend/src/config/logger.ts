import winston from 'winston'
import { env } from './env'

const { combine, timestamp, colorize, printf, json } = winston.format

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} [${level}] ${message}${metaStr}`
  }),
)

const prodFormat = combine(timestamp(), json())

export const logger = winston.createLogger({
  level: env.isDevelopment ? 'debug' : 'http',
  format: env.isDevelopment ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
})

// Stream para que Morgan escriba a través de Winston
export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
}
