import { query } from './database.service'
import { getPlayerPros } from './openDota.service'
import { logger } from '../config/logger'
import type { OpenDotaProEncounter } from '../types'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// In-memory layer to skip Postgres on hot queries within the same process
const memCache = new Map<number, { pros: OpenDotaProEncounter[]; ts: number }>()

type CachedProsRow = {
  pros: OpenDotaProEncounter[]
  cached_at: Date | string
}

export function clearPlayerProsMemoryCache(): void {
  memCache.clear()
}

export async function getPlayerProsWithCache(accountId: number): Promise<OpenDotaProEncounter[]> {
  const mem = memCache.get(accountId)
  if (mem && Date.now() - mem.ts < CACHE_TTL_MS) return mem.pros

  const cached = await readCachedPros(accountId)

  if (cached) {
    const age = Date.now() - new Date(cached.cached_at as string).getTime()
    if (age < CACHE_TTL_MS) {
      const pros = cached.pros as OpenDotaProEncounter[]
      memCache.set(accountId, { pros, ts: Date.now() - age })
      return pros
    }
  }

  const pros = await getPlayerPros(accountId)
  memCache.set(accountId, { pros, ts: Date.now() })

  // fire-and-forget: don't block the response waiting for the write
  writeCachedPros(accountId, pros).catch((err) => {
    logger.warn('cache upsert failed', { err })
  })

  return pros
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
