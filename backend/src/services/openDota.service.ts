import axios, { AxiosError } from 'axios'
import { env } from '../config/env'
import { logger } from '../config/logger'
import type { OpenDotaProEncounter, SharedMatch } from '../types'

const client = axios.create({
  baseURL: env.OPENDOTA_API_URL,
  timeout: 15_000,
  params: env.OPENDOTA_API_KEY ? { api_key: env.OPENDOTA_API_KEY } : {},
})

const dotaconstantsClient = axios.create({
  baseURL: 'https://unpkg.com',
  timeout: 15_000,
})

// ─── Retry with exponential backoff ──────────────────────────────────────────

const MAX_RETRIES = 2        // era 3 — con 2 el tiempo máximo baja de ~16s a ~2s
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
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isRetryable(err) || attempt === MAX_RETRIES) break
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

const breaker = new CircuitBreaker()

function withResilience<T>(label: string, fn: () => Promise<T>): Promise<T> {
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
  const filterParam =
    filter === 'with' ? { with_account_id: proAccountId } :
      filter === 'against' ? { against_account_id: proAccountId } :
        { included_account_id: proAccountId }

  const { data } = await withResilience('getSharedMatches', () =>
    client.get<SharedMatch[]>(`/players/${accountId}/matches`, {
      params: { ...filterParam, limit },
    }),
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
 * Returns percentile benchmarks for a hero.
 * Endpoint: GET /benchmarks?hero_id={hero_id}
 */
export async function getHeroBenchmarks(heroId: number): Promise<unknown> {
  const { data } = await withResilience('getHeroBenchmarks', () =>
    client.get('/benchmarks', {
      params: { hero_id: heroId },
    }),
  )
  return data
}

/**
 * Returns the public hero list with id and internal hero name.
 * Endpoint: GET /heroes
 */
export async function getHeroes(): Promise<unknown> {
  const { data } = await withResilience('getHeroes', () =>
    client.get('/heroes'),
  )
  return data
}

/**
 * Returns the public items table with names and icon paths.
 * Endpoint: GET /constants/items
 */
export async function getItems(): Promise<unknown> {
  const { data } = await withResilience('getItems', () =>
    client.get('/constants/items'),
  )
  return data
}

/**
 * Returns the public constants table for all abilities and talents.
 * Endpoint: GET /constants/abilities
 */
export async function getAbilityConstants(): Promise<unknown> {
  const { data } = await withResilience('getAbilityConstants', () =>
    client.get('/constants/abilities'),
  )
  return data
}

/**
 * Returns the mapping from numeric ability upgrade IDs to internal ability keys.
 * Source: dotaconstants build artifacts.
 */
export async function getAbilityIds(): Promise<unknown> {
  const { data } = await withResilience('getAbilityIds', () =>
    dotaconstantsClient.get('/dotaconstants@10.8.0/build/ability_ids.json'),
  )
  return data
}

/**
 * Returns hero ability/talent metadata keyed by hero internal name.
 * Source: dotaconstants build artifacts.
 */
export async function getHeroAbilityData(): Promise<unknown> {
  const { data } = await withResilience('getHeroAbilityData', () =>
    dotaconstantsClient.get('/dotaconstants@10.8.0/build/hero_abilities.json'),
  )
  return data
}
