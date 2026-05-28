import { useHeroes } from '../hooks/useHeroes'
import { usePositionComparison } from '../hooks/usePositionComparison'
import type { CarryItemTimingComparison } from '../types'
import {
  AssistsIcon,
  BenchmarkIcon,
  BootIcon,
  GpmIcon,
  LastHitsIcon,
  TowerIcon,
  MetricIcon,
} from './comparison/ComparisonIcons'
import { getRoleTheme, metricTone as sharedMetricTone } from './comparison/comparisonStyles'
import {
  formatNumber as formatMetricValue,
  formatRatio,
  formatSigned as formatDifference,
  formatTime as formatMinutes,
  heroCoverUrl,
  itemIconFallbackUrls,
  titleCase,
} from './comparison/formatters'
import { ComparisonErrorShell, ComparisonLoadingShell } from './comparison/ComparisonStateShell'
import { IconFrame } from './comparison/IconFrame'
import { ItemHoverCard } from './comparison/ItemHoverCard'

export interface PositionComparisonPanelProps {
  accountId: number
  matchId: number
  heroId: number
  percentile?: 95 | 99
}

function metricTone(metricKey: string, ratio: number): string {
  return sharedMetricTone(metricKey, ratio, 0.75)
}

function itemCompletionMetaLines(timing: CarryItemTimingComparison): string[] {
  const completedMinute = timing.completedMinute ?? timing.userMinute
  const completionLine = completedMinute === null
    ? 'Timing de completado no disponible'
    : timing.timingSource === 'component_inference'
      ? `Completado estimado: ${formatMinutes(completedMinute)}`
      : `Completado: ${formatMinutes(completedMinute)}`
  const sourceLine = timing.timingSource === 'component_inference'
    ? 'Fuente: inferido por ultimo componente registrado'
    : timing.timingSource === 'purchase_log'
      ? 'Fuente: OpenDota purchase_log'
      : 'Fuente: inventario final sin timing'

  return [
    completionLine,
    sourceLine,
    `Objetivo pro: ${timing.proMinute.toFixed(1)}m`,
  ]
}

export function PositionComparisonPanel({ accountId, matchId, heroId, percentile = 99 }: PositionComparisonPanelProps) {
  const { data, loading, error } = usePositionComparison(accountId, matchId, heroId, percentile)
  const heroMap = useHeroes()
  const hero = heroMap[heroId]

  if (loading) return <ComparisonLoadingShell />
  if (error) return <ComparisonErrorShell error={error} />

  if (!data) return null

  const position = data.role_info.position
  const theme = getRoleTheme(position)

  const efficiencyScore = Math.max(0, Math.min(100, Math.round(data.efficiency_gap.score * 100)))

  // Color del gradiente circular según si cumplió el rol
  const scoreHue = data.fulfilled_role
    ? (position >= 4 ? 'from-purple-400 to-fuchsia-300' : 'from-emerald-400 to-cyan-300')
    : 'from-rose-400 to-amber-300'

  const skillBuild = data.progression.skill_build
  const talents = data.progression.talents
  const neutralItems = data.progression.neutral_items

  // Definición de las tarjetas de KPIs dinámicas superiores según el rol (Core vs Soporte)
  const isSupport = position === 4 || position === 5
  const metricChips = isSupport
    ? [
      { label: 'Assists Ratio', value: formatRatio(data.metrics.find(m => m.key === 'assists')?.ratio || 1), tone: 'text-purple-200' },
      {
        label: 'Wards Placed',
        value: String(
          data.raw_user.obs_placed + data.raw_user.sen_placed
        ),
        tone: 'text-fuchsia-200'
      },
      { label: 'Percentile', value: `${percentile}`, tone: 'text-cyan-200' },
    ]
    : [
      { label: 'GPM', value: formatRatio(data.efficiency_gap.gpmRatio), tone: data.efficiency_gap.gpmRatio < 0.8 ? 'text-rose-200' : 'text-emerald-200' },
      { label: 'LH/10', value: formatRatio(data.efficiency_gap.lh10Ratio), tone: data.efficiency_gap.lh10Ratio < 0.8 ? 'text-amber-200' : 'text-cyan-200' },
      { label: 'Percentile', value: `${percentile}`, tone: 'text-cyan-200' },
    ]

  const alertTriggered = isSupport
    ? (data.metrics.find(m => m.key === 'assists')?.ratio || 1) < 0.75
    : data.efficiency_gap.gpmRatio < 0.8

  return (
    <section className={`overflow-hidden rounded-lg transition-all duration-300 ${theme.shellClass}`}>
      <div className="border-b border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${theme.borderClass}`}>
              {hero ? (
                <img
                  src={heroCoverUrl(hero.name)}
                  alt={hero.localized_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center ${theme.iconColor}`}>
                  <BenchmarkIcon />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-xs uppercase tracking-[0.22em] ${theme.textClass}`}>
                {data.role_info.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-white sm:text-xl">
                  {hero?.localized_name ?? `Hero #${heroId}`}
                </h2>
                <span className={[
                  'rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]',
                  data.fulfilled_role
                    ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200'
                    : 'border-rose-300/40 bg-rose-400/10 text-rose-200',
                ].join(' ')}>
                  {data.role_info.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Percentile {percentile} template vs your last match
              </p>
            </div>
          </div>

          <div
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em]',
              data.fulfilled_role
                ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200'
                : 'border-rose-300/40 bg-rose-400/10 text-rose-200',
            ].join(' ')}
          >
            {data.fulfilled_role ? 'Role Met' : 'Role Gap'}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)]">
          <div className="flex items-center justify-center">
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-black/25"
              style={{
                background: `conic-gradient(${data.fulfilled_role ? theme.glowColor : '#fb7185'} ${efficiencyScore * 3.6}deg, #0b1220 0deg)`,
              }}
            >
              <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-[#070b12] text-center">
                <span className={`bg-gradient-to-r ${scoreHue} bg-clip-text text-2xl font-semibold text-transparent`}>
                  {efficiencyScore}
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Score</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {metricChips.map((chip) => (
                <div key={chip.label} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{chip.label}</div>
                  <div className={`mt-1 text-lg font-semibold ${chip.tone}`}>{chip.value}</div>
                </div>
              ))}
            </div>

            {alertTriggered ? (
              <div className="carry-neon-alert rounded-md px-3 py-2 text-sm font-medium text-rose-100">
                {data.efficiency_gap.feedback}
              </div>
            ) : (
              <p className={`border-l-2 ${position >= 4 ? 'border-purple-400/60' : 'border-cyan-300/60'} pl-3 text-sm text-slate-300`}>
                {data.efficiency_gap.feedback}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${theme.borderClass} ${theme.iconColor}`}>
                {isSupport ? <AssistsIcon /> : <GpmIcon />}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Metric Breakdown</p>
                <p className="text-sm text-slate-300">Compare your output with the pro template</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-[0.16em] text-cyan-200/70">
                    <th className="px-4 py-3 font-medium">Metric</th>
                    <th className="px-4 py-3 text-right font-medium">Your Value</th>
                    <th className="px-4 py-3 text-right font-medium">Pro Value</th>
                    <th className="px-4 py-3 text-right font-medium">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {data.metrics.map((metric) => {
                    const difference = metric.value - metric.benchmark

                    return (
                      <tr
                        key={metric.key}
                        className={[
                          'border-b border-white/5 last:border-0 transition-colors',
                          metric.ratio < 0.75 && metric.benchmark > 0 ? 'carry-neon-alert' : 'hover:bg-white/[0.02]',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={[
                                'flex h-9 w-9 items-center justify-center rounded-lg border',
                                metricTone(metric.key, metric.ratio),
                              ].join(' ')}
                            >
                              <MetricIcon metricKey={metric.key} />
                            </div>
                            <div>
                              <div className="font-medium text-white">{metric.label}</div>
                              <div className="text-[11px] text-slate-500">
                                {metric.benchmark === 0 ? 'Impact check' : metric.ratio < 0.75 ? 'Needs more tempo' : 'Within target range'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-200">
                          {formatMetricValue(metric.value)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-cyan-200">
                          {metric.benchmark > 0 ? formatMetricValue(metric.benchmark) : '—'}
                        </td>
                        <td
                          className={[
                            'px-4 py-3 text-right font-mono',
                            metric.benchmark === 0 ? 'text-slate-400' : difference >= 0 ? 'text-emerald-300' : 'text-rose-300',
                          ].join(' ')}
                        >
                          {metric.benchmark > 0 ? formatDifference(difference) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${theme.borderClass} ${theme.iconColor}`}>
                <BootIcon />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Core Item Timings</p>
                <p className="text-sm text-slate-300">Your timings vs the hero standard</p>
              </div>
            </div>

            <div className="grid gap-3">
              {data.item_timings.map((timing, index) => (
                <ItemHoverCard
                  key={timing.itemKey}
                  itemName={timing.itemName}
                  description={timing.description}
                  metaLines={itemCompletionMetaLines(timing)}
                  align={index === data.item_timings.length - 1 ? 'right' : 'left'}
                  className={[
                    'rounded-md border px-3 py-3',
                    timing.status === 'snapshot'
                      ? 'border-cyan-300/20 bg-cyan-400/5'
                      : timing.status === 'on_time'
                      ? 'border-emerald-300/20 bg-emerald-400/5'
                      : timing.status === 'late'
                        ? 'border-amber-300/20 bg-amber-400/5'
                        : 'border-rose-300/20 bg-rose-400/5',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className={[
                          'flex h-8 w-8 items-center justify-center rounded-lg border',
                          timing.status === 'snapshot'
                            ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
                            : timing.status === 'on_time'
                            ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                            : timing.status === 'late'
                              ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
                              : 'border-rose-300/20 bg-rose-400/10 text-rose-200',
                        ].join(' ')}
                      >
                        <IconFrame
                          src={timing.iconUrl}
                          alt={timing.itemName}
                          fallback={timing.itemName.slice(0, 2).toUpperCase()}
                          fallbackSrcs={itemIconFallbackUrls(timing.itemKey)}
                          className="flex h-full w-full items-center justify-center"
                          imgClassName="h-full w-full object-contain p-0.5"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="truncate text-sm font-medium text-white">{timing.itemName}</span>
                        <p className="text-[11px] text-slate-400">Pro target {timing.proMinute}m</p>
                      </div>
                    </div>
                  </div>
                  {timing.status !== 'snapshot' && (
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>You: {formatMinutes(timing.completedMinute ?? timing.userMinute)}</span>
                      <span>Pro: {timing.proMinute.toFixed(1)}m</span>
                      <span className={timing.differenceMinutes !== null && timing.differenceMinutes > 0 ? 'text-rose-200' : 'text-emerald-200'}>
                        {timing.differenceMinutes === null ? 'No timing' : formatDifference(timing.differenceMinutes)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={[
                        'h-full rounded-full',
                        timing.status === 'snapshot'
                          ? 'bg-cyan-300'
                          : timing.status === 'on_time'
                          ? 'bg-emerald-300'
                          : timing.status === 'late'
                            ? 'bg-amber-300'
                            : 'bg-rose-300',
                      ].join(' ')}
                      style={{ width: timing.userMinute ? `${Math.min(100, Math.max(20, (timing.proMinute / timing.userMinute) * 100))}%` : '22%' }}
                    />
                  </div>
                </ItemHoverCard>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${theme.borderClass} ${theme.iconColor}`}>
                <BenchmarkIcon />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Skill Build</p>
                <p className="text-sm text-slate-300">Level-by-level ability order from the match</p>
              </div>
            </div>

            {skillBuild.length > 0 ? (
              <div className="overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2">
                  {skillBuild.map((step) => (
                    <div
                      key={`${step.level}-${step.abilityId}`}
                      className={[
                        'flex w-24 shrink-0 flex-col gap-2 rounded-md border px-2 py-2 text-center',
                        step.isTalent ? 'border-amber-300/20 bg-amber-400/5' : 'border-white/10 bg-white/[0.03]',
                      ].join(' ')}
                    >
                      <div className="relative mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                        <img src={step.iconUrl} alt={step.abilityName} className="h-full w-full object-cover" />
                        <span className="absolute left-1 top-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {step.level}
                        </span>
                      </div>
                      <span className="min-h-[2.25rem] w-full text-[11px] font-medium leading-4 text-white">
                        {step.abilityName}
                      </span>
                      <span
                        className={[
                          'mx-auto rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]',
                          step.isTalent ? 'bg-amber-400/10 text-amber-200' : 'bg-cyan-400/10 text-cyan-100',
                        ].join(' ')}
                      >
                        {step.isTalent ? 'Talent' : 'Skill'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No ability progression data available for this match.</p>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${theme.borderClass} ${theme.iconColor}`}>
                <LastHitsIcon />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Talent Tree</p>
                <p className="text-sm text-slate-300">Selected talent at each tier</p>
              </div>
            </div>

            <div className="grid gap-2">
              {talents.map((talent) => (
                <div
                  key={talent.level}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${theme.borderClass} ${theme.iconColor}`}>
                    Lv {talent.level}
                  </span>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30">
                    <img src={talent.iconUrl} alt={talent.abilityName} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{talent.abilityName}</p>
                    <p className="text-[11px] text-slate-400">
                      {talent.abilityKey ? titleCase(talent.abilityKey.replace(/^special_bonus_/, 'special bonus ')) : 'Talent choice'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${theme.borderClass} ${theme.iconColor}`}>
                <TowerIcon />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Neutral Items</p>
                <p className="text-sm text-slate-300">Tiered timeline from the match</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {neutralItems.map((item) => (
                <div key={item.tier} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30">
                        <img src={item.iconUrl} alt={item.itemName} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{item.itemName}</p>
                        <p className="text-[11px] text-slate-400">
                          Tier {item.tier}
                          {item.enhancementName ? ` · ${item.enhancementName}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${theme.borderClass} ${theme.iconColor}`}>
                      {formatMinutes(item.acquiredMinute)}
                    </span>
                  </div>
                  {item.enhancementName && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-amber-100">
                        Enhancement
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-200">
                        {item.enhancementName}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function CarryComparisonPanel(props: PositionComparisonPanelProps) {
  return <PositionComparisonPanel {...props} />
}
