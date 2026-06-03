/** One pro player entry as returned by /players/{accountId}/pros */
export interface ProEncounter {
  account_id: number
  name?: string | null       // Professional/scene name (e.g. "Miracle-", "N0tail")
  avatarfull: string
  profileurl: string
  personaname: string        // Current Steam display name (can change)
  team_name: string | null
  last_match_time: string | null // ISO date string
  games: number
  win: number
  country_code: string | null
  with_games?: number        // Games played on same team as this pro
  with_win?: number
  against_games?: number     // Games played against this pro
  against_win?: number
}

export type MatchFilter = 'all' | 'with' | 'against'

export interface ProEncountersResponse {
  account_id: number
  pros: ProEncounter[]
}

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

/** One shared match entry returned by /api/pro-matches/:accountId/:proAccountId */
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

export interface Hero {
  id: number
  name: string
  localized_name: string
}

export interface HeroesResponse {
  heroes: Hero[]
}

export interface RecentMatch {
  match_id: number
  player_slot: number
  radiant_win: boolean
  hero_id: number
  start_time: number
  duration: number
  kills: number
  deaths: number
  assists: number
}

export interface TopHero {
  heroId: number
  games: number
  wins: number
  winRate: number
}

export interface PlayerProfileData {
  personaname: string
  avatarfull: string
  profileurl: string
  rankTier: number | null
  countryCode: string | null
  totalGames: number
  totalWins: number
  topHeroes: TopHero[]
  recentMatches: RecentMatch[]
}

export interface PlayerProfileResponse {
  account_id: number
  profile: PlayerProfileData | null
}

export interface CarryComparisonMetric {
  key:
  | 'gold_per_min'
  | 'xp_per_min'
  | 'last_hits_per_10'
  | 'hero_damage'
  | 'tower_damage'
  | 'assists'
  | 'hero_healing'
  | 'stuns'
  | 'observer_wards_placed'
  | 'sentry_wards_placed'
  label: string
  value: number
  benchmark: number
  percentile: number
  ratio: number
}

export interface CarryItemTimingComparison {
  itemKey: string
  itemName: string
  iconUrl: string
  description: string | null
  userMinute: number | null
  completedMinute: number | null
  timingSource: 'purchase_log' | 'unavailable'
  proMinute: number
  differenceMinutes: number | null
  status: 'on_time' | 'late' | 'missing' | 'snapshot'
}

export interface CarryPurchaseTrailEntry {
  timeMinute: number | null
  itemKey: string
  itemName: string
  iconUrl: string
  slotLabel: string | null
  description: string | null
}

export interface CarryCoreItemEntry {
  itemKey: string
  itemName: string
  iconUrl: string
  description: string | null
  slotLabel: string
  completedMinute: number | null
  timingSource: 'purchase_log' | 'unavailable'
}

export interface CarrySkillBuildEntry {
  level: number
  abilityId: number
  abilityKey: string
  abilityName: string
  iconUrl: string
  isTalent: boolean
  hotkey: 'Q' | 'W' | 'E' | 'R' | 'D' | 'F' | null
}

export interface CarryTalentOption {
  abilityKey: string
  abilityName: string
  branch: 'left' | 'right' | null
  selected: boolean
}

export interface CarryTalentChoice {
  level: 10 | 15 | 20 | 25
  abilityId: number | null
  abilityKey: string | null
  abilityName: string
  iconUrl: string
  branch: 'left' | 'right' | null
  alternativeName: string | null
  alternativeKey: string | null
  options: CarryTalentOption[]
}

export interface CarryNeutralItemHistoryEntry {
  tier: 1 | 2 | 3 | 4 | 5
  itemKey: string
  itemName: string
  iconUrl: string
  acquiredMinute: number | null
  enhancementKey: string | null
  enhancementName: string | null
}

export interface CarryComparisonResponse {
  account_id: number
  match_id: number
  hero_id: number
  benchmark_percentile: 95 | 99
  scenario: 'stomp' | 'comeback'
  fulfilled_role: boolean
  role_info: {
    position: 1 | 2 | 3 | 4 | 5
    label: string
    title: string
  }
  efficiency_gap: {
    score: number
    gpmRatio: number
    lh10Ratio: number
    feedback: string
  }
  metrics: CarryComparisonMetric[]
  item_timings: CarryItemTimingComparison[]
  core_items: CarryCoreItemEntry[]
  purchase_trail: CarryPurchaseTrailEntry[]
  progression: {
    skill_build: CarrySkillBuildEntry[]
    talents: CarryTalentChoice[]
    neutral_items: CarryNeutralItemHistoryEntry[]
  }
  match_parse: {
    status: 'not_needed' | 'requested' | 'already_requested'
    purchase_log_available: boolean
  }
  hero_name: string | null
  raw_user: {
    kills: number
    deaths: number
    assists: number
    gold_per_min: number
    xp_per_min: number
    last_hits: number
    net_worth: number | null
    hero_damage: number
    tower_damage: number
    obs_placed: number
    sen_placed: number
    ability_upgrades_arr: number[]
    neutral_item_history: Array<{
      time: number
      item_neutral: string
      item_neutral_enhancement?: string | null
    }>
    purchase_log: Array<{
      time: number
      key: string
    }>
  }
}
