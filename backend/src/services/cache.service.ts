import { supabase } from './supabase.service'
import { getPlayerPros } from './openDota.service'
import { logger } from '../config/logger'
import type { OpenDotaProEncounter } from '../types'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// In-memory layer to skip Supabase on hot queries within the same process
const memCache = new Map<number, { pros: OpenDotaProEncounter[]; ts: number }>()

export function clearPlayerProsMemoryCache(): void {
  memCache.clear()
}

export async function getPlayerProsWithCache(accountId: number): Promise<OpenDotaProEncounter[]> {
  const mem = memCache.get(accountId)
  if (mem && Date.now() - mem.ts < CACHE_TTL_MS) return mem.pros

  const { data: cached } = await supabase
    .from('match_cache')
    .select('pros, cached_at')
    .eq('steam_id', accountId)
    .single()

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
  supabase
    .from('match_cache')
    .upsert(
      { steam_id: accountId, pros, cached_at: new Date().toISOString() },
      { onConflict: 'steam_id' },
    )
    .then(({ error }) => { if (error) logger.warn('cache upsert failed', { error }) })

  return pros
}
