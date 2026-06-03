import { query } from './database.service'
import { getPlayerPros } from './openDota.service'
import { logger } from '../config/logger'
import type { OpenDotaProEncounter } from '../types'
import { AsyncTtlCache } from './asyncTtlCache.service'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// In-memory layer to skip Postgres on hot queries within the same process
const memCache = new AsyncTtlCache<number, OpenDotaProEncounter[]>(CACHE_TTL_MS, 2_000)
const inflight = new Map<number, Promise<OpenDotaProEncounter[]>>()

type CachedProsRow = {
  pros: OpenDotaProEncounter[]
  cached_at: Date | string
}

export function clearPlayerProsMemoryCache(): void {
  memCache.clear()
  inflight.clear()
}

export async function getPlayerProsWithCache(accountId: number): Promise<OpenDotaProEncounter[]> {
  const mem = memCache.get(accountId)
  if (mem) return mem

  const pending = inflight.get(accountId)
  if (pending) return pending

  const request = (async () => {
    const cached = await readCachedPros(accountId)

    if (cached) {
      const age = Date.now() - new Date(cached.cached_at as string).getTime()
      if (age < CACHE_TTL_MS) {
        const pros = cached.pros as OpenDotaProEncounter[]
        memCache.set(accountId, pros, CACHE_TTL_MS - age)
        return pros
      }
    }

    const pros = await getPlayerPros(accountId)
    memCache.set(accountId, pros)

    // fire-and-forget: don't block the response waiting for the write
    writeCachedPros(accountId, pros).catch((err) => {
      logger.warn('cache upsert failed', { err })
    })

    return pros
  })().finally(() => {
    inflight.delete(accountId)
  })

  inflight.set(accountId, request)
  return request
}

async function readCachedPros(accountId: number): Promise<CachedProsRow | null> {
  try {
    const result = await query<CachedProsRow>(
      'select pros, cached_at from match_cache where steam_id = $1 limit 1',
      [accountId],
    )

    return result.rows[0] ?? null
  } catch (err) {
    logger.warn('cache read failed', { err })
    return null
  }
}

async function writeCachedPros(accountId: number, pros: OpenDotaProEncounter[]): Promise<void> {
  await query(
    `
      insert into match_cache (steam_id, pros, cached_at)
      values ($1, $2::jsonb, now())
      on conflict (steam_id)
      do update set pros = excluded.pros, cached_at = excluded.cached_at
    `,
    [accountId, JSON.stringify(pros)],
  )
}
