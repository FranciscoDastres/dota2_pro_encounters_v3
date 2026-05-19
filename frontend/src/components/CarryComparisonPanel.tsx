import { useHeroes } from '../hooks/useHeroes'
import { useCarryComparison } from '../hooks/useCarryComparison'

interface Props {
  accountId: number
  matchId: number
  heroId: number
  percentile?: 95 | 99
}

const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com'

function heroCoverUrl(heroName: string | undefined | null): string {
  const short = (heroName ?? '').replace('npc_dota_hero_', '')
  return `${STEAM_CDN}/apps/dota2/images/dota_react/heroes/${short}.png`
}

function itemIconUrl(itemKey: string): string {
  return `${STEAM_CDN}/apps/dota2/images/dota_react/items/${itemKey}.png`
}

function formatMetricValue(value: number): string {
  return Math.abs(value) >= 1000 ? Math.round(value).toLocaleString() : value.toLocaleString()
}

function formatDifference(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatMetricValue(value)}`
}

function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

function formatMinutes(minute: number | null): string {
  if (minute === null) return '—'
  return `${minute.toFixed(1)}m`
}

function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function timingLabel(status: 'on_time' | 'late' | 'missing' | 'snapshot'): string {
  if (status === 'snapshot') return 'Snapshot'
  if (status === 'on_time') return 'On time'
  if (status === 'late') return 'Late'
  return 'Missing'
}

// ============================================================================
// ICONOS DE INTERFAZ
// ============================================================================
function BenchmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 7v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V7l-8-5Z" />
      <path d="M8 11h8" />
      <path d="M9.5 14.5 11 16l3.5-4" />
    </svg>
  )
}

function GpmIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19V5" />
      <path d="M5 19h14" />
      <path d="M8 15l3-4 3 2 4-6" />
    </svg>
  )
}

function LastHitsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18h16" />
      <path d="M7 18V9" />
      <path d="M12 18V6" />
      <path d="M17 18v-7" />
    </svg>
  )
}

function DamageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z" />
    </svg>
  )
}

function TowerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 21h10" />
      <path d="M9 21V9l3-4 3 4v12" />
      <path d="M9 13h6" />
    </svg>
  )
}

function AssistsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function WardsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function BootIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v9l4 2 1 3h8a2 2 0 0 0 0-4h-2l-1-2V4H6Z" />
    </svg>
  )
}

function TimingIcon({ status }: { status: 'on_time' | 'late' | 'missing' | 'snapshot' }) {
  if (status === 'on_time') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }

  if (status === 'late') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v5l4 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 8.5 7 7" />
      <path d="m15.5 8.5-7 7" />
    </svg>
  )
}

function metricIcon(metricKey: string) {
  switch (metricKey) {
    case 'gold_per_min':
      return <GpmIcon />
    case 'xp_per_min':
      return <BenchmarkIcon />
    case 'last_hits_per_10':
      return <LastHitsIcon />
    case 'hero_damage':
      return <DamageIcon />
    case 'tower_damage':
      return <TowerIcon />
    case 'assists':
      return <AssistsIcon />
    case 'wards':
      return <WardsIcon />
    default:
      return <BenchmarkIcon />
  }
}

function metricTone(metricKey: string, ratio: number): string {
  if (ratio < 0.75) return 'border-rose-300/30 bg-rose-400/10 text-rose-100'
  if (metricKey === 'gold_per_min') return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
  if (metricKey === 'last_hits_per_10') return 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100'
  if (metricKey === 'assists' || metricKey === 'wards') return 'border-purple-300/25 bg-purple-400/10 text-purple-100'
  return 'border-white/10 bg-white/[0.03] text-slate-100'
}

// ============================================================================
// CONFIGURACIÓN DE APARIENCIA DE NEÓN POR POSICIÓN
// ============================================================================
function getRoleTheme(position: number) {
  if (position >= 4) {
    return {
      textClass: 'text-purple-300/70',
      borderClass: 'border-purple-300/20 bg-purple-400/10',
      iconColor: 'text-purple-100',
      shellClass: 'border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-[#0b0f19]',
      glowColor: '#a855f7'
    }
  }
  return {
    textClass: 'text-cyan-300/70',
    borderClass: 'border-cyan-300/20 bg-cyan-400/10',
    iconColor: 'text-cyan-100',
    shellClass: 'carry-neon-shell bg-[#070b12]',
    glowColor: '#34d399'
  }
}

export function CarryComparisonPanel({ accountId, matchId, heroId, percentile = 99 }: Props) {
  const { data, loading, error } = useCarryComparison(accountId, matchId, heroId, percentile)
  const heroMap = useHeroes()
  const hero = heroMap[heroId]

  if (loading) {
    return (
      <section className="carry-neon-shell overflow-hidden rounded-lg">
        <div className="border-b border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="mb-4 h-5 w-52 animate-pulse rounded bg-cyan-300/20" />
          <div className="h-28 animate-pulse rounded-xl bg-white/5" />
        </div>
        <div className="p-4 sm:p-5">
          <div className="space-y-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="carry-neon-shell rounded-lg p-4">
        <p className="text-sm text-rose-200">{error}</p>
      </section>
    )
  }

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
      { label: 'Wards Placed', value: `${data.raw_user.assists} / ${((data.raw_user as any).obs_placed || 0) + ((data.raw_user as any).sen_placed || 0)}`, tone: 'text-fuchsia-200' },
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
                  {data.metrics.map((metric) => (
                    <tr
                      key={metric.key}
                      className={[
                        'border-b border-white/5 last:border-0 transition-colors',
                        metric.ratio < 0.75 && metric.proValue > 0 ? 'carry-neon-alert' : 'hover:bg-white/[0.02]',
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
                            {metricIcon(metric.key)}
                          </div>
                          <div>
                            <div className="font-medium text-white">{metric.label}</div>
                            <div className="text-[11px] text-slate-500">
                              {metric.proValue === 0 ? 'Impact check' : metric.ratio < 0.75 ? 'Needs more tempo' : 'Within target range'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-200">
                        {formatMetricValue(metric.userValue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-cyan-200">
                        {metric.proValue > 0 ? formatMetricValue(metric.proValue) : '—'}
                      </td>
                      <td
                        className={[
                          'px-4 py-3 text-right font-mono',
                          metric.proValue === 0 ? 'text-slate-400' : metric.difference >= 0 ? 'text-emerald-300' : 'text-rose-300',
                        ].join(' ')}
                      >
                        {metric.proValue > 0 ? formatDifference(metric.difference) : '—'}
                      </td>
                    </tr>
                  ))}
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
              {data.item_timings.map((timing) => (
                <div
                  key={timing.itemKey}
                  className={[
                    'rounded-md border px-3 py-3',
                    timing.status === 'on_time'
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
                          timing.status === 'on_time'
                            ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                            : timing.status === 'late'
                              ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
                              : 'border-rose-300/20 bg-rose-400/10 text-rose-200',
                        ].join(' ')}
                      >
                        <img src={itemIconUrl(timing.itemKey)} alt={timing.itemName} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="truncate text-sm font-medium text-white">{timing.itemName}</span>
                        <p className="text-[11px] text-slate-400">Pro target {timing.proMinute}m</p>
                      </div>
                    </div>
                    <span
                      className={[
                        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        timing.status === 'on_time'
                          ? 'bg-emerald-400/10 text-emerald-200'
                          : timing.status === 'late'
                            ? 'bg-amber-400/10 text-amber-200'
                            : 'bg-rose-400/10 text-rose-200',
                      ].join(' ')}
                    >
                      <TimingIcon status={timing.status} />
                      {timingLabel(timing.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>You: {formatMinutes(timing.userMinute)}</span>
                    <span>Pro: {timing.proMinute.toFixed(1)}m</span>
                    <span className={timing.differenceMinutes !== null && timing.differenceMinutes > 0 ? 'text-rose-200' : 'text-emerald-200'}>
                      {timing.differenceMinutes === null ? 'No timing' : formatDifference(timing.differenceMinutes)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={[
                        'h-full rounded-full',
                        timing.status === 'on_time'
                          ? 'bg-emerald-300'
                          : timing.status === 'late'
                            ? 'bg-amber-300'
                            : 'bg-rose-300',
                      ].join(' ')}
                      style={{ width: timing.userMinute ? `${Math.min(100, Math.max(20, (timing.proMinute / timing.userMinute) * 100))}%` : '22%' }}
                    />
                  </div>
                </div>
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