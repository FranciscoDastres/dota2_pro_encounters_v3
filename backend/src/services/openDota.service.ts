import axios, { AxiosError } from 'axios'
import { env } from '../config/env'
import { logger } from '../config/logger'
import type { OpenDotaProEncounter, SharedMatch } from '../types'
import { AsyncTtlCache } from './asyncTtlCache.service'

const client = axios.create({
  baseURL: env.OPENDOTA_API_URL,
  timeout: 8_000,
  params: env.OPENDOTA_API_KEY ? { api_key: env.OPENDOTA_API_KEY } : {},
})

const dotaconstantsClient = axios.create({
  baseURL: 'https://unpkg.com',
  timeout: 8_000,
})

const DOTACONSTANTS_VERSION = '10.8.0'
const PARSE_REQUEST_TTL_MS = 30 * 60 * 1000
const parseRequests = new AsyncTtlCache<number, 'requested' | 'failed'>(PARSE_REQUEST_TTL_MS, 2_000)
const sharedMatchesCache = new AsyncTtlCache<string, SharedMatch[]>(5 * 60 * 1000, 2_000)
const heroBenchmarksCache = new AsyncTtlCache<number, unknown>(6 * 60 * 60 * 1000, 200)
const heroRankingsCache = new AsyncTtlCache<number, unknown>(6 * 60 * 60 * 1000, 200)
const heroesCache = new AsyncTtlCache<'heroes', unknown>(24 * 60 * 60 * 1000, 1)
const patchesCache = new AsyncTtlCache<'patches', unknown>(24 * 60 * 60 * 1000, 1)

// ─── Retry with exponential backoff ──────────────────────────────────────────

const MAX_ATTEMPTS = 2
const RETRY_BASE_MS = 500

function isRetryable(err: unknown): boolean {
  if (err instanceof AxiosError) {
    if (!err.response) return true        // network / timeout error
    return err.response.status >= 500     // 5xx server error
  }
  return false
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) break
      const delay = RETRY_BASE_MS * 2 ** (attempt - 1)
      logger.warn(`[${label}] attempt ${attempt} failed — retrying in ${delay}ms`, {
        status: err instanceof AxiosError ? err.response?.status : undefined,
      })
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

// ─── Circuit Breaker ──────────────────────────────────────────────────────────

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

const FAILURE_THRESHOLD = 3  // era 5 — abre antes para proteger usuarios
const RESET_TIMEOUT_MS = 30_000

class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures = 0
  private openedAt = 0
  private probing = false    // evita múltiples probes simultáneos en HALF_OPEN

  async run<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt >= RESET_TIMEOUT_MS) {
        // Solo un request prueba en HALF_OPEN, el resto falla rápido
        if (this.probing) {
          throw new Error('OpenDota service temporarily unavailable (circuit open)')
        }
        this.state = 'HALF_OPEN'
        this.probing = true
        logger.info(`[CircuitBreaker:${label}] HALF_OPEN — probing`)
      } else {
        throw new Error('OpenDota service temporarily unavailable (circuit open)')
      }
    }

    try {
      const result = await fn()
      this.onSuccess(label)
      return result
    } catch (err) {
      this.onFailure(label)
      throw err
    } finally {
      if (this.state !== 'HALF_OPEN') {
        this.probing = false
      }
    }
  }

  private onSuccess(label: string): void {
    if (this.state !== 'CLOSED') {
      logger.info(`[CircuitBreaker:${label}] CLOSED — recovered`)
    }
    this.failures = 0
    this.state = 'CLOSED'
    this.probing = false
  }

  private onFailure(label: string): void {
    this.failures++
    if (this.failures >= FAILURE_THRESHOLD) {
      this.state = 'OPEN'
      this.openedAt = Date.now()
      this.probing = false
      logger.error(`[CircuitBreaker:${label}] OPEN after ${this.failures} failures`)
    }
  }
}

const breakers = new Map<string, CircuitBreaker>()

function withResilience<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let breaker = breakers.get(label)
  if (!breaker) {
    breaker = new CircuitBreaker()
    breakers.set(label, breaker)
  }
  return breaker.run(label, () => withRetry(label, fn))
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Returns all pro players a given account has played with/against.
 * Endpoint: GET /players/{account_id}/pros
 */
export async function getPlayerPros(accountId: number): Promise<OpenDotaProEncounter[]> {
  const { data } = await withResilience('getPlayerPros', () =>
    client.get<OpenDotaProEncounter[]>(`/players/${accountId}/pros`),
  )
  return data
}

/**
 * Returns matches where both the user and a specific pro appeared.
 * - filter 'with'    → same team only    (with_account_id)
 * - filter 'against' → opposing team only (against_account_id)
 * - filter undefined → all shared matches (included_account_id)
 */
export async function getSharedMatches(
  accountId: number,
  proAccountId: number,
  limit = 20,
  filter?: 'with' | 'against',
): Promise<SharedMatch[]> {
  const cacheKey = `${accountId}:${proAccountId}:${limit}:${filter ?? 'all'}`
  const filterParam =
    filter === 'with' ? { with_account_id: proAccountId } :
      filter === 'against' ? { against_account_id: proAccountId } :
        { included_account_id: proAccountId }

  return sharedMatchesCache.getOrLoad(cacheKey, async () => {
    const { data } = await withResilience('getSharedMatches', () =>
      client.get<SharedMatch[]>(`/players/${accountId}/matches`, {
        params: { ...filterParam, limit },
      }),
    )
    return data
  })
}

export function clearOpenDotaResponseCaches(): void {
  sharedMatchesCache.clear()
  heroBenchmarksCache.clear()
  heroRankingsCache.clear()
  heroesCache.clear()
  patchesCache.clear()
}

/**
 * Returns the public player profile and rank data.
 * Endpoint: GET /players/{account_id}
 */
export async function getPlayerProfile(accountId: number): Promise<unknown> {
  const { data } = await withResilience('getPlayerProfile', () =>
    client.get(`/players/${accountId}`),
  )
  return data
}

/**
 * Returns aggregate hero statistics for a player.
 * Endpoint: GET /players/{account_id}/heroes
 */
export async function getPlayerHeroes(accountId: number): Promise<unknown> {
  const { data } = await withResilience('getPlayerHeroes', () =>
    client.get(`/players/${accountId}/heroes`),
  )
  return data
}

/**
 * Returns recent matches for a player.
 * Endpoint: GET /players/{account_id}/recentMatches
 */
export async function getRecentMatches(accountId: number): Promise<unknown> {
  const { data } = await withResilience('getRecentMatches', () =>
    client.get(`/players/${accountId}/recentMatches`),
  )
  return data
}

/**
 * Returns the latest public matches for a player.
 * Endpoint: GET /players/{account_id}/matches
 */
export async function getLatestPlayerMatches(accountId: number, limit = 1): Promise<unknown> {
  const { data } = await withResilience('getLatestPlayerMatches', () =>
    client.get(`/players/${accountId}/matches`, {
      params: { limit },
    }),
  )
  return data
}

/**
 * Returns parsed match details, including the players array and purchase logs.
 * Endpoint: GET /matches/{match_id}
 */
export async function getMatchDetails(matchId: number): Promise<unknown> {
  const { data } = await withResilience('getMatchDetails', () =>
    client.get(`/matches/${matchId}`),
  )
  return data
}

/**
 * Asks OpenDota to parse a match replay so parsed fields such as purchase_log
 * may become available on a later /matches/{match_id} request.
 * Endpoint: POST /request/{match_id}
 */
export async function requestMatchParse(matchId: number): Promise<unknown> {
  const { data } = await withResilience('requestMatchParse', () =>
    client.post(`/request/${matchId}`),
  )
  return data
}

export function queueMatchParseRequest(matchId: number): 'requested' | 'already_requested' {
  if (parseRequests.get(matchId)) return 'already_requested'

  parseRequests.set(matchId, 'requested')
  void requestMatchParse(matchId)
    .catch((err) => {
      parseRequests.set(matchId, 'failed')
      logger.warn('[requestMatchParse] failed', {
        matchId,
        status: err instanceof AxiosError ? err.response?.status : undefined,
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    })

  return 'requested'
}

export function clearQueuedMatchParseRequests(): void {
  parseRequests.clear()
}

/**
 * Returns percentile benchmarks for a hero.
 * Endpoint: GET /benchmarks?hero_id={hero_id}
 */
export async function getHeroBenchmarks(heroId: number): Promise<unknown> {
  return heroBenchmarksCache.getOrLoad(heroId, async () => {
    const { data } = await withResilience('getHeroBenchmarks', () =>
      client.get('/benchmarks', {
        params: { hero_id: heroId },
      }),
    )
    return data
  })
}

/**
 * Returns the highest-ranked players for a hero.
 * Endpoint: GET /rankings?hero_id={hero_id}
 */
export async function getHeroRankings(heroId: number): Promise<unknown> {
  return heroRankingsCache.getOrLoad(heroId, async () => {
    const { data } = await withResilience('getHeroRankings', () =>
      client.get('/rankings', {
        params: { hero_id: heroId },
      }),
    )
    return data
  })
}

/**
 * Returns a player's matches for one hero and patch.
 * Endpoint: GET /players/{account_id}/matches
 */
export async function getPlayerMatchesByHeroPatch(
  accountId: number,
  heroId: number,
  patchId: number,
  limit = 3,
): Promise<unknown> {
  const { data } = await withResilience('getPlayerMatchesByHeroPatch', () =>
    client.get(`/players/${accountId}/matches`, {
      params: {
        hero_id: heroId,
        patch: patchId,
        limit,
      },
    }),
  )
  return data
}

/**
 * Returns Dota patch names, IDs, and release dates.
 * Endpoint: GET /constants/patch
 */
export async function getPatches(): Promise<unknown> {
  return patchesCache.getOrLoad('patches', async () => {
    const { data } = await withResilience('getPatches', () =>
      client.get('/constants/patch'),
    )
    return data
  })
}

/**
 * Returns the public hero list with id and internal hero name.
 * Endpoint: GET /heroes
 */
export async function getHeroes(): Promise<unknown> {
  return heroesCache.getOrLoad('heroes', async () => {
    const { data } = await withResilience('getHeroes', () =>
      client.get('/heroes'),
    )
    return data
  })
}

/**
 * Returns the public items table with names, descriptions, and icon paths.
 * Source: dotaconstants build artifacts, which use the same item keys as the
 * Dota React CDN assets (for example `bfury`, not `battlefury`).
 */
export async function getItems(): Promise<unknown> {
  const { data } = await withResilience('getItems', () =>
    dotaconstantsClient.get(`/dotaconstants@${DOTACONSTANTS_VERSION}/build/items.json`),
  )
  return data
}

/**
 * Returns the public constants table for all abilities and talents.
 * Source: dotaconstants build artifacts.
 */
export async function getAbilityConstants(): Promise<unknown> {
  const { data } = await withResilience('getAbilityConstants', () =>
    dotaconstantsClient.get(`/dotaconstants@${DOTACONSTANTS_VERSION}/build/abilities.json`),
  )
  return data
}

/**
 * Returns the mapping from numeric ability upgrade IDs to internal ability keys.
 * Source: dotaconstants build artifacts.
 */
export async function getAbilityIds(): Promise<unknown> {
  const { data } = await withResilience('getAbilityIds', () =>
    dotaconstantsClient.get(`/dotaconstants@${DOTACONSTANTS_VERSION}/build/ability_ids.json`),
  )
  return data
}

/**
 * Returns hero ability/talent metadata keyed by hero internal name.
 * Source: dotaconstants build artifacts.
 */
export async function getHeroAbilityData(): Promise<unknown> {
  const { data } = await withResilience('getHeroAbilityData', () =>
    dotaconstantsClient.get(`/dotaconstants@${DOTACONSTANTS_VERSION}/build/hero_abilities.json`),
  )
  return data
}
