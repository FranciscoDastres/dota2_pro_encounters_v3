import { z } from 'zod'
import type { CarryComparisonResponse, ProEncountersResponse, SharedMatchesResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// ---------- Zod schemas for API response validation ----------

const proEncounterSchema = z.object({
  account_id: z.number(),
  name: z.string().nullable().optional(),
  avatarfull: z.string(),
  profileurl: z.string(),
  personaname: z.string(),
  team_name: z.string().nullable(),
  last_match_time: z.string().nullable(),
  games: z.number(),
  win: z.number(),
  country_code: z.string().nullable(),
  with_games: z.number().optional(),
  with_win: z.number().optional(),
  against_games: z.number().optional(),
  against_win: z.number().optional(),
})

const proEncountersResponseSchema = z.object({
  account_id: z.number(),
  pros: z.array(proEncounterSchema),
})

const sharedMatchSchema = z.object({
  match_id: z.number(),
  start_time: z.number(),
  radiant_win: z.boolean(),
  player_slot: z.number().min(0).max(132),
  hero_id: z.number(),
  kills: z.number().nonnegative(),
  deaths: z.number().nonnegative(),
  assists: z.number().nonnegative(),
  duration: z.number().positive(),
})

const sharedMatchesResponseSchema = z.object({
  account_id: z.number(),
  pro_account_id: z.number(),
  matches: z.array(sharedMatchSchema),
})

const carryComparisonMetricSchema = z.object({
  key: z.enum([
    'gold_per_min',
    'xp_per_min',
    'last_hits_per_10',
    'hero_damage',
    'tower_damage',
    'assists',
    'hero_healing',
    'stuns',
    'observer_wards_placed',
    'sentry_wards_placed',
  ]),
  label: z.string(),
  value: z.number(),
  benchmark: z.number(),
  percentile: z.number(),
  ratio: z.number(),
})

const carryItemTimingComparisonSchema = z.object({
  itemKey: z.string(),
  itemName: z.string(),
  iconUrl: z.string(),
  userMinute: z.number().nullable(),
  proMinute: z.number(),
  differenceMinutes: z.number().nullable(),
  status: z.enum(['on_time', 'late', 'missing', 'snapshot']),
})

const carryPurchaseTrailEntrySchema = z.object({
  timeMinute: z.number().nullable(),
  itemKey: z.string(),
  itemName: z.string(),
  iconUrl: z.string(),
  slotLabel: z.string().nullable(),
  description: z.string().nullable(),
})

const carrySkillBuildEntrySchema = z.object({
  level: z.number(),
  abilityId: z.number(),
  abilityKey: z.string(),
  abilityName: z.string(),
  iconUrl: z.string(),
  isTalent: z.boolean(),
  hotkey: z.union([z.literal('Q'), z.literal('W'), z.literal('E'), z.literal('R'), z.literal('D'), z.literal('F')]).nullable(),
})

const carryTalentChoiceSchema = z.object({
  level: z.union([z.literal(10), z.literal(15), z.literal(20), z.literal(25)]),
  abilityId: z.number().nullable(),
  abilityKey: z.string().nullable(),
  abilityName: z.string(),
  iconUrl: z.string(),
  branch: z.union([z.literal('left'), z.literal('right')]).nullable(),
  alternativeName: z.string().nullable(),
  alternativeKey: z.string().nullable(),
})

const carryNeutralItemHistoryEntrySchema = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  itemKey: z.string(),
  itemName: z.string(),
  iconUrl: z.string(),
  acquiredMinute: z.number().nullable(),
  enhancementKey: z.string().nullable(),
  enhancementName: z.string().nullable(),
})

const carryComparisonResponseSchema = z.object({
  account_id: z.number(),
  match_id: z.number(),
  hero_id: z.number(),
  benchmark_percentile: z.union([z.literal(95), z.literal(99)]),
  scenario: z.enum(['stomp', 'comeback']),
  fulfilled_role: z.boolean(),
  role_info: z.object({
    position: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    label: z.string(),
    title: z.string(),
  }),
  efficiency_gap: z.object({
    score: z.number(),
    gpmRatio: z.number(),
    lh10Ratio: z.number(),
    feedback: z.string(),
  }),
  metrics: z.array(carryComparisonMetricSchema),
  item_timings: z.array(carryItemTimingComparisonSchema),
  purchase_trail: z.array(carryPurchaseTrailEntrySchema),
  progression: z.object({
    skill_build: z.array(carrySkillBuildEntrySchema),
    talents: z.array(carryTalentChoiceSchema),
    neutral_items: z.array(carryNeutralItemHistoryEntrySchema),
  }),
  hero_name: z.string().nullable(),
  raw_user: z.object({
    kills: z.number(),
    deaths: z.number(),
    assists: z.number(),
    gold_per_min: z.number(),
    xp_per_min: z.number(),
    last_hits: z.number(),
    net_worth: z.number().nullable(),
    hero_damage: z.number(),
    tower_damage: z.number(),
    ability_upgrades_arr: z.array(z.number()),
    neutral_item_history: z.array(z.object({
      time: z.number(),
      item_neutral: z.string(),
      item_neutral_enhancement: z.string().nullable().optional(),
    })),
    purchase_log: z.array(z.object({
      time: z.number(),
      key: z.string(),
    })),
  }),
})

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

export async function fetchCarryComparison(
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
