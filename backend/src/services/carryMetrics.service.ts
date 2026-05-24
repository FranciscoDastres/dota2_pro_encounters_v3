import type {
  BenchmarkValue,
  OpenDotaBenchmarks,
  OpenDotaMatchPlayer,
} from './carryComparison.schemas'
import type {
  BenchmarkPercentile,
  CarryComparisonMetric,
  ComparisonPosition,
} from './carryComparison.types'

export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function pickBenchmarkValue(values: BenchmarkValue[], target: BenchmarkPercentile): number {
  const sorted = [...values].sort((a, b) => a.percentile - b.percentile)
  return sorted.find((entry) => entry.percentile >= target)?.value ?? sorted.at(-1)?.value ?? 0
}

function buildMetric(
  key: CarryComparisonMetric['key'],
  label: string,
  userValue: number,
  proValue: number,
  percentile: BenchmarkPercentile,
): CarryComparisonMetric {
  const ratio = proValue > 0 ? userValue / proValue : 1

  return {
    key,
    label,
    value: round(userValue),
    benchmark: round(proValue),
    percentile,
    ratio: round(ratio, 3),
  }
}

export function detectPosition(
  player: OpenDotaMatchPlayer,
  allPlayers: OpenDotaMatchPlayer[],
): ComparisonPosition {
  const roster = allPlayers.some((entry) => (
    entry === player ||
    (player.account_id !== undefined && entry.account_id === player.account_id) ||
    (player.player_slot !== undefined && entry.player_slot === player.player_slot)
  ))
    ? allPlayers
    : [...allPlayers, player]
  const isRadiant = player.player_slot !== undefined ? player.player_slot < 128 : (player.isRadiant ?? true)
  const teammates = roster.filter((p) => {
    const pIsRadiant = p.player_slot !== undefined ? p.player_slot < 128 : (p.isRadiant ?? true)
    return pIsRadiant === isRadiant
  })

  const sortedByNw = [...teammates].sort((a, b) => (b.net_worth || 0) - (a.net_worth || 0))
  const nwRank = sortedByNw.findIndex((p) => p.hero_id === player.hero_id) + 1

  const pureSupports = [27]
  if (pureSupports.includes(player.hero_id)) {
    if (player.lane_role === 2) return 2
    if (player.lane_role === 1 && nwRank <= 2) return 1

    return nwRank >= 5 ? 5 : 4
  }

  if (player.lane_role === 2) return 2
  if (player.lane_role === 1) return nwRank <= 2 ? 1 : 5
  if (player.lane_role === 3) return nwRank <= 3 ? 3 : 4

  return (nwRank > 5 ? 5 : nwRank || 5) as ComparisonPosition
}

export function computeRoleMetrics(
  position: ComparisonPosition,
  player: OpenDotaMatchPlayer,
  benchmarks: OpenDotaBenchmarks,
  percentile: BenchmarkPercentile,
  durationMinutes: number,
): CarryComparisonMetric[] {
  const proGpm = pickBenchmarkValue(benchmarks.result.gold_per_min, percentile)
  const proLh10 = pickBenchmarkValue(benchmarks.result.last_hits_per_min, percentile) * 10
  const userLh10 = durationMinutes > 0 ? (player.last_hits / durationMinutes) * 10 : 0
  const proXp = benchmarks.result.xp_per_min ? pickBenchmarkValue(benchmarks.result.xp_per_min, percentile) : player.xp_per_min
  const proHeroDamage = benchmarks.result.hero_damage_per_min
    ? pickBenchmarkValue(benchmarks.result.hero_damage_per_min, percentile) * durationMinutes
    : player.hero_damage
  const proTowerDamage = benchmarks.result.tower_damage
    ? pickBenchmarkValue(benchmarks.result.tower_damage, percentile)
    : player.tower_damage

  const metrics: CarryComparisonMetric[] = [
    buildMetric('gold_per_min', 'GPM', player.gold_per_min, proGpm, percentile),
    buildMetric('xp_per_min', 'XPM', player.xp_per_min, proXp, percentile),
    buildMetric('last_hits_per_10', 'LH/10', userLh10, proLh10, percentile),
    buildMetric('hero_damage', 'Hero Damage', player.hero_damage, proHeroDamage, percentile),
    buildMetric('tower_damage', 'Tower Damage', player.tower_damage, proTowerDamage, percentile),
  ]

  if (position === 4 || position === 5) {
    const proAssistsStandard = position === 4 ? 14 : 12

    metrics.push(
      buildMetric('assists', 'Assists', player.assists, proAssistsStandard, percentile),
      buildMetric('observer_wards_placed', 'Observer Wards', player.obs_placed || 0, position === 5 ? 8 : 5, percentile),
      buildMetric('sentry_wards_placed', 'Sentry Wards', player.sen_placed || 0, position === 5 ? 8 : 5, percentile),
    )
  }

  return metrics
}
