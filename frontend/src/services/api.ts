import type {
  CarryComparisonResponse,
  HeroesResponse,
  PlayerProfileResponse,
  ProEncountersResponse,
  SharedMatchesResponse,
} from '../types'
import {
  carryComparisonResponseSchema,
  heroesResponseSchema,
  playerProfileResponseSchema,
  proEncountersResponseSchema,
  sharedMatchesResponseSchema,
} from './apiSchemas'

const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
const API_BASE_URL = configuredApiUrl ?? (import.meta.env.DEV ? 'http://localhost:3000' : '')

// ---------- Retry with exponential backoff ----------

const MAX_ATTEMPTS = 2
const RETRY_BASE_MS = 500
const REQUEST_TIMEOUT_MS = 18_000

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      const signal = options?.signal
        ? AbortSignal.any([options.signal, timeoutSignal])
        : timeoutSignal
      const response = await fetch(url, { ...options, signal })
      const retryAfter = response.headers.get('Retry-After')
      if (!response.ok && isRetryableStatus(response.status) && !retryAfter && attempt < MAX_ATTEMPTS) {
        const delay = RETRY_BASE_MS * 2 ** (attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      return response
    } catch (err) {
      // Network-level error (offline, DNS failure, etc.)
      lastError = err
      if (options?.signal?.aborted) throw err
      if (attempt < MAX_ATTEMPTS) {
        const delay = RETRY_BASE_MS * 2 ** (attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError ?? new Error('Request failed after retries')
}

// ---------- API functions ----------

export async function fetchProEncounters(steamId: string, signal?: AbortSignal): Promise<ProEncountersResponse> {
  const trimmed = steamId.trim()
  if (!trimmed) throw new Error('Steam ID is required')

  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/pro-encounters/${encodeURIComponent(trimmed)}`,
    { signal },
  )

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Error HTTP ${response.status}`)
  }

  const data: unknown = await response.json()
  return proEncountersResponseSchema.parse(data)
}

export async function fetchSharedMatches(
  accountId: number,
  proAccountId: number,
  filter?: 'with' | 'against',
  signal?: AbortSignal,
): Promise<SharedMatchesResponse> {
  const base = `${API_BASE_URL}/api/pro-matches/${encodeURIComponent(accountId)}/${encodeURIComponent(proAccountId)}`
  const url = filter ? `${base}?filter=${filter}` : base
  const response = await fetchWithRetry(url, { signal })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `HTTP Error ${response.status}`)
  }

  const data: unknown = await response.json()
  return sharedMatchesResponseSchema.parse(data)
}

export async function fetchPositionComparison(
  accountId: number,
  matchId: number,
  heroId: number,
  percentile: 95 | 99 = 95,
  signal?: AbortSignal,
): Promise<CarryComparisonResponse> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/carry-comparison/${encodeURIComponent(accountId)}/${encodeURIComponent(matchId)}/${encodeURIComponent(heroId)}?percentile=${percentile}`,
    { signal },
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `HTTP Error ${response.status}`)
  }

  const data: unknown = await response.json()
  return carryComparisonResponseSchema.parse(data)
}

export async function fetchPlayerProfile(accountId: number, signal?: AbortSignal): Promise<PlayerProfileResponse> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/player-profile/${encodeURIComponent(accountId)}`,
    { signal },
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `HTTP Error ${response.status}`)
  }

  const data: unknown = await response.json()
  return playerProfileResponseSchema.parse(data)
}

export async function fetchHeroes(signal?: AbortSignal): Promise<HeroesResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/heroes`, { signal })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `HTTP Error ${response.status}`)
  }

  const data: unknown = await response.json()
  return heroesResponseSchema.parse(data)
}

export const fetchCarryComparison = fetchPositionComparison
