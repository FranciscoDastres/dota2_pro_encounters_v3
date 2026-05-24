import { useHeroes } from '../hooks/useHeroes'
import { usePositionComparison } from '../hooks/usePositionComparison'
import { ComparisonErrorShell, ComparisonLoadingShell } from './comparison/ComparisonStateShell'
import {
  MatchBenchmarkHeader,
  MatchSnapshotSection,
  MetricBreakdownSection,
  NeutralItemsSection,
  PurchaseTrailSection,
  SkillBuildSection,
  TalentTreeSection,
} from './comparison/CarryMatchSections'
import { formatKda } from './comparison/formatters'

export interface PositionComparisonMatchPanelProps {
  accountId: number
  matchId: number
  heroId: number
  percentile?: 95 | 99
}

export function PositionComparisonMatchPanel({ accountId, matchId, heroId, percentile = 99 }: PositionComparisonMatchPanelProps) {
  const { data, loading, error } = usePositionComparison(accountId, matchId, heroId, percentile)
  const heroMap = useHeroes()
  const hero = heroMap[heroId]

  if (loading) return <ComparisonLoadingShell />
  if (error) return <ComparisonErrorShell error={error} />
  if (!data) return null

  const efficiencyScore = Math.max(0, Math.min(100, Math.round(data.efficiency_gap.score * 100)))
  const kda = formatKda(data.raw_user.kills, data.raw_user.deaths, data.raw_user.assists)

  return (
    <section className="carry-neon-shell overflow-hidden rounded-lg">
      <MatchBenchmarkHeader
        data={data}
        hero={hero}
        heroId={heroId}
        percentile={percentile}
        efficiencyScore={efficiencyScore}
        kda={kda}
      />

      <div className="space-y-4 p-4 sm:p-5">
        <MatchSnapshotSection data={data} kda={kda} />
        <PurchaseTrailSection purchaseTrail={data.purchase_trail} />

        <div className="grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
          <SkillBuildSection skillBuild={data.progression.skill_build} />
          <div className="space-y-4">
            <TalentTreeSection talents={data.progression.talents} />
            <NeutralItemsSection neutralItems={data.progression.neutral_items} />
            <MetricBreakdownSection metrics={data.metrics} />
          </div>
        </div>
      </div>
    </section>
  )
}

export function CarryComparisonMatchPanel(props: PositionComparisonMatchPanelProps) {
  return <PositionComparisonMatchPanel {...props} />
}
