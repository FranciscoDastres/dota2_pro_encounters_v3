import type { CarryComparisonResponse, ProEncountersResponse, SharedMatchesResponse } from '../types'
import {
  carryComparisonResponseSchema,
  proEncountersResponseSchema,
  sharedMatchesResponseSchema,
} from './apiSchemas'

const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
const API_BASE_URL = configuredApiUrl ?? (import.meta.env.DEV ? 'http://localhost:3000' : '')

// ---------- Retry with exponential backoff ----------

const MAX_RETRIES = 3
const RETRY_BASE_MS = 500

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options)
      if (!response.ok && isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * 2 ** (attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      return response
    } catch (err) {
      // Network-level error (offline, DNS failure, etc.)
      lastError = err
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * 2 ** (attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError ?? new Error('Request failed after retries')
}

// ---------- API functions ----------

export async function fetchProEncounters(steamId: string): Promise<ProEncountersResponse> {
  const trimmed = steamId.trim()
  if (!trimmed) throw new Error('Steam ID is required')

  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/pro-encounters/${encodeURIComponent(trimmed)}`,
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
): Promise<SharedMatchesResponse> {
  const base = `${API_BASE_URL}/api/pro-matches/${encodeURIComponent(accountId)}/${encodeURIComponent(proAccountId)}`
  const url = filter ? `${base}?filter=${filter}` : base
  const response = await fetchWithRetry(url)

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
): Promise<CarryComparisonResponse> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/carry-comparison/${encodeURIComponent(accountId)}/${encodeURIComponent(matchId)}/${encodeURIComponent(heroId)}?percentile=${percentile}`,
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `HTTP Error ${response.status}`)
  }

  const data: unknown = await response.json()
  return carryComparisonResponseSchema.parse(data)
}

export const fetchCarryComparison = fetchPositionComparison
