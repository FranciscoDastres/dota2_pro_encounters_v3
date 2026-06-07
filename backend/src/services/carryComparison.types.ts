import type {
  OpenDotaNeutralItemHistory,
  OpenDotaPurchaseLog,
} from './carryComparison.schemas'

export type ComparisonPosition = 1 | 2 | 3 | 4 | 5
export type BenchmarkPercentile = 95 | 99
export type TimingStatus = 'on_time' | 'late' | 'missing' | 'snapshot'
export type ItemTimingSource = 'purchase_log' | 'unavailable'
export type MatchParseRequestStatus = 'not_needed' | 'requested' | 'already_requested'

export interface CoreItemTimingTarget {
  label: string
  optimalMinute: number
  graceMinutes: number
}

export interface RoleMetadata {
  title: string
  label: string
  feedback_ok: string
  feedback_fail: string
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
  timingSource: ItemTimingSource
  proMinute: number
  differenceMinutes: number | null
  status: TimingStatus
}

export interface CarryPurchaseTrailEntry {
  timeMinute: number | null
  itemKey: string
  itemName: string
  iconUrl: string
  slotLabel: string | null
  description: string | null
}

export interface RankedPurchaseReference {
  accountId: number
  playerName: string
  rankingScore: number
  rankTier: number | null
  matchId: number
  startTime: number
  patchId: number
  patchName: string
  withinLast14Days: boolean
  purchaseTrail: CarryPurchaseTrailEntry[]
}

export interface RankedPurchaseComparisonItem {
  itemKey: string
  itemName: string
  iconUrl: string
  userMinute: number | null
  referenceMinute: number
  differenceMinutes: number | null
  status: 'ahead' | 'close' | 'behind' | 'missing'
}

export interface RankedPurchaseEvaluation {
  status: 'ahead' | 'close' | 'behind' | 'insufficient'
  summary: string
  improvements: string[]
  aheadCount: number
  closeCount: number
  behindCount: number
  missingCount: number
}

export interface RankedPurchaseComparison {
  items: RankedPurchaseComparisonItem[]
  evaluation: RankedPurchaseEvaluation
}

export interface CarryCoreItemEntry {
  itemKey: string
  itemName: string
  iconUrl: string
  description: string | null
  slotLabel: string
  completedMinute: number | null
  timingSource: ItemTimingSource
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
  benchmark_percentile: BenchmarkPercentile
  scenario: 'stomp' | 'comeback'
  fulfilled_role: boolean
  role_info: {
    position: ComparisonPosition
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
  ranked_purchase_reference: RankedPurchaseReference | null
  ranked_purchase_comparison: RankedPurchaseComparison | null
  progression: {
    skill_build: CarrySkillBuildEntry[]
    talents: CarryTalentChoice[]
    neutral_items: CarryNeutralItemHistoryEntry[]
  }
  match_parse: {
    status: MatchParseRequestStatus
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
    neutral_item_history: OpenDotaNeutralItemHistory[]
    purchase_log: OpenDotaPurchaseLog[]
  }
}

export interface ResolvedAbilityConstant {
  key: string
  dname: string
  iconUrl: string
  isTalent: boolean
}

export interface ResolvedItemConstant {
  id: number
  key: string
  dname: string
  iconUrl: string
  description: string | null
  components: string[]
}

export interface HeroAbilityMetadata {
  abilities: string[]
  talents: Array<{ name: string; level: number }>
}
