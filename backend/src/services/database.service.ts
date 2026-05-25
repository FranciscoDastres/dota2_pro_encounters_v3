import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { env } from '../config/env'
import { logger } from '../config/logger'

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  logger.error('unexpected database client error', { err })
})

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params)
}
