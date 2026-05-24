import { getHeroBenchmarks, getHeroes, getMatchDetails } from './openDota.service'
import {
  openDotaBenchmarksSchema,
  openDotaHeroesSchema,
  openDotaMatchSchema,
} from './carryComparison.schemas'
import { ROLE_METADATA } from './carryComparison.constants'
import {
  loadAbilityConstants,
  loadAbilityIds,
  loadHeroAbilityData,
  loadItemConstants,
} from './dotaConstants.service'
import {
  buildNeutralItems,
  buildPurchaseTrail,
  buildSkillProgression,
  buildTalentChoices,
  compareItemTimings,
} from './carryProgression.service'
import { computeRoleMetrics, detectPosition, round } from './carryMetrics.service'
import type {
  BenchmarkPercentile,
  CarryComparisonResponse,
  CarrySkillBuildEntry,
  HeroAbilityMetadata,
  ResolvedAbilityConstant,
  ResolvedItemConstant,
} from './carryComparison.types'
import type {
  OpenDotaBenchmarks,
  OpenDotaMatch,
  OpenDotaMatchPlayer,
} from './carryComparison.schemas'

export * from './carryComparison.schemas'
export type * from './carryComparison.types'

export function comparePositionPerformance(params: {
  accountId: number
  match: OpenDotaMatch
  player: OpenDotaMatchPlayer
  benchmarks: OpenDotaBenchmarks
  skillBuild?: CarrySkillBuildEntry[]
  heroName?: string | null
  heroAbilityData?: Record<string, HeroAbilityMetadata>
  abilityConstants?: ResolvedAbilityConstant[]
  itemConstants?: ResolvedItemConstant[]
  percentile?: BenchmarkPercentile
}): CarryComparisonResponse {
  const percentile = params.percentile ?? 95
  const durationMinutes = params.match.duration / 60
  const position = detectPosition(params.player, params.match.players)
  const roleMeta = ROLE_METADATA[position] || ROLE_METADATA[1]
  const itemConstants = params.itemConstants ?? []

  const metrics = computeRoleMetrics(position, params.player, params.benchmarks, percentile, durationMinutes)
  const itemTimings = compareItemTimings(params.player.hero_id, params.player.purchase_log, itemConstants)
  const gpmMetric = metrics.find((metric) => metric.key === 'gold_per_min')
  const lh10Metric = metrics.find((metric) => metric.key === 'last_hits_per_10')
  const gpmRatio = gpmMetric?.ratio ?? 1
  const lh10Ratio = lh10Metric?.ratio ?? 1
  const deathsBeforeMinute10 = params.player.deaths_log.filter((death) => death.time <= 600).length
  const scenario: CarryComparisonResponse['scenario'] = deathsBeforeMinute10 > 2 ? 'comeback' : 'stomp'
  const timingPenalty = itemTimings.some((timing) => timing.status !== 'on_time') ? 0.08 : 0
  const score = Math.max(0, Math.min(1, (gpmRatio * 0.55) + (lh10Ratio * 0.35) + ((1 - timingPenalty) * 0.1)))
  const fulfilledRole = gpmRatio >= 0.8 &&
    (position >= 4 || lh10Ratio >= 0.75) &&
    itemTimings.every((timing) => timing.status !== 'missing')
  const feedback = gpmRatio < 0.8 ? roleMeta.feedback_fail : roleMeta.feedback_ok

  return {
    account_id: params.accountId,
    match_id: params.match.match_id,
    hero_id: params.player.hero_id,
    benchmark_percentile: percentile,
    scenario,
    fulfilled_role: fulfilledRole,
    role_info: {
      position,
      label: roleMeta.label,
      title: roleMeta.title,
    },
    efficiency_gap: {
      score: round(score, 3),
      gpmRatio: round(gpmRatio, 3),
      lh10Ratio: round(lh10Ratio, 3),
      feedback,
    },
    metrics,
    item_timings: itemTimings,
    purchase_trail: buildPurchaseTrail(params.player, itemConstants),
    progression: {
      skill_build: params.skillBuild ?? [],
      talents: buildTalentChoices(
        params.skillBuild ?? [],
        params.heroName ?? null,
        params.heroAbilityData ?? {},
        params.abilityConstants ?? [],
      ),
      neutral_items: buildNeutralItems(params.player.neutral_item_history),
    },
    hero_name: params.heroName ?? null,
    raw_user: {
      kills: params.player.kills,
      deaths: params.player.deaths,
      assists: params.player.assists,
      gold_per_min: params.player.gold_per_min,
      xp_per_min: params.player.xp_per_min,
      last_hits: params.player.last_hits,
      net_worth: params.player.net_worth ?? null,
      hero_damage: params.player.hero_damage,
      tower_damage: params.player.tower_damage,
      obs_placed: params.player.obs_placed ?? 0,
      sen_placed: params.player.sen_placed ?? 0,
      ability_upgrades_arr: params.player.ability_upgrades_arr,
      neutral_item_history: params.player.neutral_item_history,
      purchase_log: params.player.purchase_log,
    },
  }
}

export async function getPositionComparison(params: {
  accountId: number
  matchId: number
  heroId: number
  percentile?: BenchmarkPercentile
}): Promise<CarryComparisonResponse> {
  const percentile = params.percentile ?? 95
  const match = openDotaMatchSchema.parse(await getMatchDetails(params.matchId))

  if (match.match_id !== params.matchId) {
    throw new Error('OpenDota match payload did not match the requested matchId.')
  }

  const player = match.players.find((entry) => entry.account_id === params.accountId)

  if (!player) {
    throw new Error('The account was not found in the parsed OpenDota match payload.')
  }

  if (player.hero_id !== params.heroId) {
    throw new Error('The requested heroId does not match the hero used in the selected match.')
  }

  const benchmarks = openDotaBenchmarksSchema.parse(await getHeroBenchmarks(params.heroId))
  const abilityConstants = await loadAbilityConstants()
  const abilityIds = await loadAbilityIds()
  const heroAbilityData = await loadHeroAbilityData()
  const heroes = openDotaHeroesSchema.parse(await getHeroes())
  const itemConstants = await loadItemConstants()
  const heroName = heroes.find((entry) => entry.id === params.heroId)?.name ?? null
  const skillBuild = buildSkillProgression(player.ability_upgrades_arr, abilityConstants, abilityIds, heroName, heroAbilityData)

  return comparePositionPerformance({
    accountId: params.accountId,
    match,
    player,
    benchmarks,
    skillBuild,
    heroName,
    heroAbilityData,
    abilityConstants,
    itemConstants,
    percentile,
  })
}
