// ─── OpenDota API shapes ────────────────────────────────────────────────────

/**
 * Shape returned by GET /players/{account_id}/pros
 * Each item is a pro player the user has played with/against.
 */
export interface OpenDotaProEncounter {
  account_id: number
  name?: string | null       // Professional/scene name (e.g. "Miracle-", "N0tail")
  avatarfull: string
  profileurl: string
  personaname: string        // Current Steam display name (can change)
  team_name: string | null
  last_match_time: string | null // ISO date string e.g. "2024-01-15T20:00:00.000Z"
  games: number
  win: number
  country_code: string | null
  // Ally/enemy breakdown — same fields returned by /players/{id}/pros
  with_games?: number
  with_win?: number
  against_games?: number
  against_win?: number
}

// ─── App response shapes ─────────────────────────────────────────────────────

export interface ProEncountersResponse {
  account_id: number
  pros: OpenDotaProEncounter[]
}

export interface ApiErrorResponse {
  error: string
  status: number
}

// ─── Shared match shapes ──────────────────────────────────────────────────────

/**
 * Subset of fields returned by GET /players/{account_id}/matches
 * when filtered with included_account_id={pro_account_id}.
 */
export interface SharedMatch {
  match_id: number
  start_time: number     // Unix timestamp (seconds)
  radiant_win: boolean
  player_slot: number    // 0-4 = radiant, 128-132 = dire
  hero_id: number
  kills: number
  deaths: number
  assists: number
  duration: number       // seconds
}

export interface SharedMatchesResponse {
  account_id: number
  pro_account_id: number
  matches: SharedMatch[]
}
