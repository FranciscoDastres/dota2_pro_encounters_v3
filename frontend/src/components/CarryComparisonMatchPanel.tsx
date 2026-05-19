import { useState } from 'react'
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

function formatNumber(value: number): string {
  return Math.abs(value) >= 1000 ? Math.round(value).toLocaleString() : value.toLocaleString()
}

function formatSigned(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatNumber(value)}`
}

function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

function formatTime(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)}m`
}

function formatKda(kills: number, deaths: number, assists: number): string {
  const safeDeaths = Math.max(1, deaths)
  return ((kills + assists) / safeDeaths).toFixed(1)
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
    default:
      return <BenchmarkIcon />
  }
}

function metricTone(metricKey: string, ratio: number): string {
  if (ratio < 0.8) return 'border-rose-300/30 bg-rose-400/10 text-rose-100'
  if (metricKey === 'gold_per_min') return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
  if (metricKey === 'last_hits_per_10') return 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100'
  return 'border-white/10 bg-white/[0.03] text-slate-100'
}

function IconFrame({
  src,
  alt,
  fallback,
  className = '',
  imgClassName = '',
}: {
  src: string
  alt: string
  fallback: string
  className?: string
  imgClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const showFallback = failed || !src

  return (
    <div className={className}>
      {!showFallback ? (
        <img
          src={src}
          alt={alt}
          className={imgClassName}
          onError={() => setFailed(true)}
          loading="eager"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-md border border-white/10 bg-black/35 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
          {fallback}
        </div>
      )}
    </div>
  )
}

function cleanTalentLabel(value: string): string {
  return value
    .replace(/[{}]/g, '')
    .replace(/s:([a-zA-Z0-9_]+)/g, '$1')
    .replace(/\bbonus_/g, '')
    .replace(/\bunique_/g, '')
    .replace(/\bspecial bonus /g, '')
    .replace(/\bmuerta\b/g, 'Muerta')
    .replace(/\bviper\b/g, 'Viper')
}

export function CarryComparisonMatchPanel({ accountId, matchId, heroId, percentile = 99 }: Props) {
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

  const efficiencyScore = Math.max(0, Math.min(100, Math.round(data.efficiency_gap.score * 100)))
  const scoreHue = data.fulfilled_role ? 'from-emerald-400 to-cyan-300' : 'from-rose-400 to-amber-300'
  const skillBuild = data.progression.skill_build
  const talents = data.progression.talents
  const neutralItems = data.progression.neutral_items
  const purchaseTrail = data.purchase_trail
  const hasTimingSnapshotOnly = data.item_timings.every((timing) => timing.status === 'snapshot')
  const kda = formatKda(data.raw_user.kills, data.raw_user.deaths, data.raw_user.assists)
  const gameSummary = [
    { label: 'Kills', value: data.raw_user.kills, tone: 'text-emerald-200' },
    { label: 'Deaths', value: data.raw_user.deaths, tone: 'text-rose-200' },
    { label: 'Assists', value: data.raw_user.assists, tone: 'text-cyan-200' },
    { label: 'KDA', value: kda, tone: 'text-amber-200' },
    { label: 'GPM', value: data.raw_user.gold_per_min, tone: 'text-white' },
    { label: 'XPM', value: data.raw_user.xp_per_min, tone: 'text-white' },
    { label: 'LH', value: data.raw_user.last_hits, tone: 'text-white' },
    { label: 'NW', value: data.raw_user.net_worth === null ? '—' : formatNumber(data.raw_user.net_worth), tone: 'text-white' },
  ]

  return (
    <section className="carry-neon-shell overflow-hidden rounded-lg">
      <div className="border-b border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-400/10">
              {hero ? (
                <img src={heroCoverUrl(hero.name)} alt={hero.localized_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cyan-100">
                  <BenchmarkIcon />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">Hard Carry Benchmark</p>
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
                  {data.fulfilled_role ? 'Role Met' : 'Role Gap'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Percentile {percentile} template vs this match · {data.scenario === 'comeback' ? 'Comeback' : 'Stomp'} scenario
              </p>
            </div>
          </div>

          <div className="grid gap-3 xl:w-[360px]">
            <div
              className="relative flex h-24 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(12,18,29,0.92)), conic-gradient(${data.fulfilled_role ? '#34d399' : '#fb7185'} ${efficiencyScore * 3.6}deg, #0b1220 0deg)`,
              }}
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#070b12]">
                <span className={`bg-gradient-to-r ${scoreHue} bg-clip-text text-2xl font-semibold text-transparent`}>
                  {efficiencyScore}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">HC Efficiency Score</p>
                <p className="mt-1 text-sm text-slate-300">
                  {data.efficiency_gap.feedback}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'GPM', value: formatRatio(data.efficiency_gap.gpmRatio), tone: data.efficiency_gap.gpmRatio < 0.8 ? 'text-rose-200' : 'text-emerald-200' },
                { label: 'LH/10', value: formatRatio(data.efficiency_gap.lh10Ratio), tone: data.efficiency_gap.lh10Ratio < 0.8 ? 'text-amber-200' : 'text-cyan-200' },
                { label: 'KDA', value: kda, tone: 'text-amber-100' },
                { label: 'NW', value: data.raw_user.net_worth === null ? '—' : formatNumber(data.raw_user.net_worth), tone: 'text-white' },
              ].map((chip) => (
                <div key={chip.label} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-2">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{chip.label}</div>
                  <div className={`mt-1 text-sm font-semibold ${chip.tone}`}>{chip.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
              <BenchmarkIcon />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Match Snapshot</p>
              <p className="text-sm text-slate-300">Quick read of the match state and your purchase trail</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {gameSummary.map((stat) => (
                <div key={stat.label} className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                  <p className={`mt-1 text-sm font-semibold ${stat.tone}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-white/10 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {hasTimingSnapshotOnly ? 'Core Items' : 'Core Timings'}
                </p>
                <span className="text-[11px] text-slate-400">
                  {hasTimingSnapshotOnly ? 'final inventory snapshot' : 'vs. pro target'}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {data.item_timings.map((timing) => (
                  <div
                    key={timing.itemKey}
                    className={[
                      'min-w-[92px] rounded-md border px-2 py-2',
                      timing.status === 'snapshot'
                        ? 'border-cyan-300/20 bg-cyan-400/5'
                        : timing.status === 'on_time'
                          ? 'border-emerald-300/20 bg-emerald-400/5'
                          : timing.status === 'late'
                            ? 'border-amber-300/20 bg-amber-400/5'
                            : 'border-rose-300/20 bg-rose-400/5',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <IconFrame
                        src={timing.iconUrl}
                        alt={timing.itemName}
                        fallback={timing.itemName.slice(0, 2).toUpperCase()}
                        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30"
                        imgClassName="h-5 w-5 object-contain"
                      />
                      <span
                        className={[
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          timing.status === 'snapshot'
                            ? 'bg-cyan-400/10 text-cyan-100'
                            : timing.status === 'on_time'
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
                    <p className="mt-2 truncate text-xs font-medium text-white">{timing.itemName}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {timing.status === 'snapshot'
                        ? 'Final loadout snapshot'
                        : `You ${formatTime(timing.userMinute)} · Pro ${timing.proMinute.toFixed(1)}m`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
              <BootIcon />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Purchase Trail</p>
              <p className="text-sm text-slate-300">The item path from your actual match log or final inventory snapshot</p>
            </div>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
              {purchaseTrail.map((entry) => (
                <div key={`${entry.timeMinute ?? 'snapshot'}-${entry.slotLabel ?? entry.itemKey}-${entry.itemKey}`} className="flex w-16 flex-shrink-0 flex-col items-center gap-1">
                  <IconFrame
                    src={entry.iconUrl}
                    alt={entry.itemName}
                    fallback={entry.itemName.slice(0, 2).toUpperCase()}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30"
                    imgClassName="h-full w-full object-contain p-0.5"
                  />
                  <span className="max-w-full truncate text-[10px] text-slate-300">{entry.itemName}</span>
                  <span className="text-[10px] text-cyan-200" title={entry.description ?? entry.itemName}>
                    {entry.slotLabel ?? formatTime(entry.timeMinute)}
                  </span>
                  <span className="sr-only">{entry.description ?? entry.itemName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                <GpmIcon />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Skill Build</p>
                <p className="text-sm text-slate-300">Order of abilities as they were leveled</p>
              </div>
            </div>

            {skillBuild.length > 0 ? (
              <div className="overflow-x-auto pb-1">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))' }}
                >
                  {skillBuild.map((step) => (
                    <div
                      key={`${step.level}-${step.abilityId}`}
                      className={[
                        'flex min-h-[116px] flex-col gap-2 rounded-md border px-2 py-2 text-center',
                        step.isTalent ? 'border-amber-300/20 bg-amber-400/5' : 'border-white/10 bg-white/[0.03]',
                      ].join(' ')}
                    >
                      <div className="relative mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30">
                        <IconFrame
                          src={step.iconUrl}
                          alt={step.abilityName}
                          fallback={step.abilityName.slice(0, 2).toUpperCase()}
                          className="flex h-full w-full items-center justify-center"
                          imgClassName="h-full w-full object-contain p-0.5"
                        />
                        <span className="absolute left-1 top-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {step.level}
                        </span>
                        {step.hotkey && (
                          <span className="absolute bottom-1 right-1 rounded bg-cyan-400/15 px-1 py-0.5 text-[9px] font-semibold text-cyan-100">
                            {step.hotkey}
                          </span>
                        )}
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
                        {step.isTalent ? 'Talent' : (step.hotkey ?? 'Ability')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No ability progression data available for this match.</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
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
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">
                      Lv {talent.level}
                    </span>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-amber-300/20 bg-amber-400/10 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                      Talent
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{cleanTalentLabel(talent.abilityName)}</p>
                      <p className="text-[11px] text-slate-400">
                        {talent.abilityKey ? cleanTalentLabel(titleCase(talent.abilityKey.replace(/^special_bonus_/, 'special bonus '))) : 'Talent choice'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className={[
                          'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]',
                          talent.branch === 'left'
                            ? 'border border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
                            : talent.branch === 'right'
                              ? 'border border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100'
                              : 'border border-white/10 bg-white/[0.04] text-slate-200',
                        ].join(' ')}>
                          {talent.branch ? `${talent.branch} branch` : 'match choice'}
                        </span>
                        {talent.alternativeName ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-200">
                            Alt: {cleanTalentLabel(talent.alternativeName)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                  <TowerIcon />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Neutral Items</p>
                  <p className="text-sm text-slate-300">Tiered neutral pickups from the match</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {neutralItems.map((item) => (
                  <div key={item.tier} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <IconFrame
                          src={item.iconUrl}
                          alt={item.itemName}
                          fallback={`T${item.tier}`}
                          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30"
                          imgClassName="h-full w-full object-contain p-0.5"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{item.itemName}</p>
                          <p className="text-[11px] text-slate-400">Tier {item.tier}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-100">
                        {formatTime(item.acquiredMinute)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.enhancementName ? (
                        <>
                          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-amber-100">
                            Enhancement
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-200">
                            {item.enhancementName}
                          </span>
                        </>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-200">
                          {item.itemName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                  <BenchmarkIcon />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Metric Breakdown</p>
                  <p className="text-sm text-slate-300">Output against the benchmark template</p>
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
                            metric.ratio < 0.8 ? 'carry-neon-alert' : 'hover:bg-white/[0.02]',
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
                                  {metric.ratio < 0.8 ? 'Needs more tempo' : 'Within target range'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-200">
                            {formatNumber(metric.value)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-cyan-200">
                            {formatNumber(metric.benchmark)}
                          </td>
                          <td
                            className={[
                              'px-4 py-3 text-right font-mono',
                              difference >= 0 ? 'text-emerald-300' : 'text-rose-300',
                            ].join(' ')}
                          >
                            {formatSigned(difference)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
