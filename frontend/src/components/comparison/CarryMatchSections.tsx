import type { ReactNode } from 'react'
import type {
  CarryComparisonMetric,
  CarryComparisonResponse,
  CarryCoreItemEntry,
  CarryItemTimingComparison,
  CarryNeutralItemHistoryEntry,
  CarryPurchaseTrailEntry,
  CarrySkillBuildEntry,
  CarryTalentChoice,
} from '../../types'
import type { HeroMap } from '../../hooks/useHeroes'
import {
  BenchmarkIcon,
  BootIcon,
  GpmIcon,
  LastHitsIcon,
  TowerIcon,
  MetricIcon,
} from './ComparisonIcons'
import { IconFrame } from './IconFrame'
import { ItemHoverCard } from './ItemHoverCard'
import { getRoleTheme, metricTone } from './comparisonStyles'
import {
  cleanTalentLabel,
  formatNumber,
  formatRatio,
  formatSigned,
  formatTime,
  heroCoverUrl,
  itemIconFallbackUrls,
  titleCase,
} from './formatters'

type Hero = HeroMap[number] | undefined

function itemCompletionMetaLines(timing: CarryItemTimingComparison): string[] {
  const completedMinute = timing.completedMinute ?? timing.userMinute
  const completionLine = completedMinute === null
    ? 'Timing de completado no disponible'
    : `Completado: ${formatTime(completedMinute)}`
  const sourceLine = timing.timingSource === 'purchase_log'
    ? 'Fuente: OpenDota purchase_log'
    : 'Fuente: inventario final sin timing'

  return [
    completionLine,
    sourceLine,
    `Objetivo pro: ${timing.proMinute.toFixed(1)}m`,
  ]
}

function coreItemMetaLines(item: CarryCoreItemEntry): string[] {
  return [
    item.completedMinute === null
      ? 'Timing de completado no disponible'
      : `Completado: ${formatTime(item.completedMinute)}`,
    item.timingSource === 'purchase_log'
      ? 'Fuente: OpenDota purchase_log'
      : 'Fuente: compra exacta no encontrada',
    `Inventario: ${item.slotLabel}`,
  ]
}

export function MatchBenchmarkHeader({
  data,
  hero,
  heroId,
  percentile,
  efficiencyScore,
  kda,
}: {
  data: CarryComparisonResponse
  hero: Hero
  heroId: number
  percentile: 95 | 99
  efficiencyScore: number
  kda: string
}) {
  const position = data.role_info.position
  const isSupport = position === 4 || position === 5
  const theme = getRoleTheme(position)
  const scoreHue = data.fulfilled_role
    ? (isSupport ? 'from-purple-400 to-fuchsia-300' : 'from-emerald-400 to-cyan-300')
    : 'from-rose-400 to-amber-300'
  const summaryChips = isSupport
    ? [
      { label: 'Assists', value: formatRatio(data.metrics.find((metric) => metric.key === 'assists')?.ratio ?? 1), tone: 'text-purple-200' },
      { label: 'Wards', value: data.raw_user.obs_placed + data.raw_user.sen_placed, tone: 'text-fuchsia-200' },
      { label: 'KDA', value: kda, tone: 'text-amber-100' },
      { label: 'NW', value: data.raw_user.net_worth === null ? '—' : formatNumber(data.raw_user.net_worth), tone: 'text-white' },
    ]
    : [
      { label: 'GPM', value: formatRatio(data.efficiency_gap.gpmRatio), tone: data.efficiency_gap.gpmRatio < 0.8 ? 'text-rose-200' : 'text-emerald-200' },
      { label: 'LH/10', value: formatRatio(data.efficiency_gap.lh10Ratio), tone: data.efficiency_gap.lh10Ratio < 0.8 ? 'text-amber-200' : 'text-cyan-200' },
      { label: 'KDA', value: kda, tone: 'text-amber-100' },
      { label: 'NW', value: data.raw_user.net_worth === null ? '—' : formatNumber(data.raw_user.net_worth), tone: 'text-white' },
    ]

  return (
    <div className="border-b border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${theme.borderClass}`}>
            {hero ? (
              <img src={heroCoverUrl(hero.name)} alt={hero.localized_name} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center ${theme.iconColor}`}>
                <BenchmarkIcon />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-xs uppercase tracking-[0.22em] ${theme.textClass}`}>{data.role_info.title}</p>
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
              background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(12,18,29,0.92)), conic-gradient(${data.fulfilled_role ? theme.glowColor : '#fb7185'} ${efficiencyScore * 3.6}deg, #0b1220 0deg)`,
            }}
          >
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#070b12]">
              <span className={`bg-gradient-to-r ${scoreHue} bg-clip-text text-2xl font-semibold text-transparent`}>
                {efficiencyScore}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{data.role_info.label} Score</p>
              <p className="mt-1 text-sm text-slate-300">
                {data.efficiency_gap.feedback}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {summaryChips.map((chip) => (
              <div key={chip.label} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{chip.label}</div>
                <div className={`mt-1 text-sm font-semibold ${chip.tone}`}>{chip.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MatchSnapshotSection({ data, kda }: { data: CarryComparisonResponse; kda: string }) {
  const coreItems = data.core_items
  const timedCoreItems = coreItems.filter((item) => item.completedMinute !== null).length
  const coreItemTotal = Math.max(coreItems.length, data.item_timings.length)
  const stats = [
    { group: 'Combat', label: 'Kills', value: data.raw_user.kills, tone: 'text-emerald-200' },
    { group: 'Combat', label: 'Deaths', value: data.raw_user.deaths, tone: 'text-rose-200' },
    { group: 'Combat', label: 'Assists', value: data.raw_user.assists, tone: 'text-cyan-200' },
    { group: 'Combat', label: 'KDA', value: kda, tone: 'text-amber-200' },
    { group: 'Economy', label: 'GPM', value: data.raw_user.gold_per_min, tone: 'text-emerald-100' },
    { group: 'Economy', label: 'XPM', value: data.raw_user.xp_per_min, tone: 'text-cyan-100' },
    { group: 'Economy', label: 'LH', value: data.raw_user.last_hits, tone: 'text-white' },
    { group: 'Economy', label: 'NW', value: data.raw_user.net_worth === null ? '—' : formatNumber(data.raw_user.net_worth), tone: 'text-white' },
  ]

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <SectionTitle
        icon={<BenchmarkIcon />}
        title="Match Snapshot"
        subtitle="Quick read of the match state and your purchase trail"
      />
      {!data.match_parse.purchase_log_available && data.match_parse.status !== 'not_needed' && (
        <div className="mb-3 rounded-md border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-100">
          Parse requested from OpenDota. Exact item completion timings may appear after the match finishes parsing.
        </div>
      )}

      <div className="grid gap-3">
        <div className="rounded-md border border-white/10 bg-black/20 p-2.5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Match Stats</p>
              <p className="text-[11px] text-slate-400">Combat and economy snapshot</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-300">
              {stats.length} stats
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            {stats.map((stat, index) => (
              <div key={`${stat.group}-${stat.label}`} className="min-h-[54px] rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                  {(index === 0 || index === 4) && (
                    <span className="hidden rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500 sm:inline">
                      {stat.group}
                    </span>
                  )}
                </div>
                <p className={`mt-1 truncate text-base font-semibold leading-5 ${stat.tone}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-cyan-300/15 bg-[rgba(8,17,27,0.72)] p-2.5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Core Items</p>
              <p className="text-[11px] text-slate-400">Final inventory timing</p>
            </div>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-100">
              {coreItemTotal === 0 ? 'No items' : `${timedCoreItems}/${coreItemTotal} timed`}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {coreItems.length > 0 ? coreItems.map((item, index) => (
              <ItemHoverCard
                key={`${item.slotLabel}-${item.itemKey}`}
                itemName={item.itemName}
                description={item.description}
                metaLines={coreItemMetaLines(item)}
                align={index % 3 === 2 || index === coreItems.length - 1 ? 'right' : 'left'}
                className="min-w-0"
              >
                <div
                className={[
                  'grid min-h-[62px] grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2.5 py-2 transition-colors',
                  item.completedMinute === null
                    ? 'border-cyan-300/20 bg-cyan-400/5 hover:border-cyan-300/40'
                    : 'border-emerald-300/20 bg-emerald-400/5 hover:border-emerald-300/40',
                ].join(' ')}
              >
                  <IconFrame
                    src={item.iconUrl}
                    alt={item.itemName}
                    fallback={item.itemName.slice(0, 2).toUpperCase()}
                    fallbackSrcs={itemIconFallbackUrls(item.itemKey)}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30"
                    imgClassName="h-full w-full object-contain p-0.5"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">{item.itemName}</p>
                    <p className={item.completedMinute === null ? 'mt-0.5 text-[11px] text-slate-400' : 'mt-0.5 text-[11px] text-emerald-200'}>
                      {item.completedMinute === null ? 'No exact timing' : formatTime(item.completedMinute)}
                    </p>
                  </div>
                  <span className="rounded bg-black/35 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    {item.slotLabel.replace('Slot ', 'S')}
                  </span>
                </div>
              </ItemHoverCard>
            )) : data.item_timings.map((timing, index) => (
              <ItemHoverCard
                key={timing.itemKey}
                itemName={timing.itemName}
                description={timing.description}
                metaLines={itemCompletionMetaLines(timing)}
                align={index % 3 === 2 || index === data.item_timings.length - 1 ? 'right' : 'left'}
                className="min-w-0"
              >
                <div className="grid min-h-[62px] grid-cols-[38px_minmax(0,1fr)] items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-400/5 px-2.5 py-2 transition-colors hover:border-cyan-300/40">
                  <IconFrame
                    src={timing.iconUrl}
                    alt={timing.itemName}
                    fallback={timing.itemName.slice(0, 2).toUpperCase()}
                    fallbackSrcs={itemIconFallbackUrls(timing.itemKey)}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30"
                    imgClassName="h-full w-full object-contain p-0.5"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">{timing.itemName}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">No exact timing</p>
                  </div>
                </div>
              </ItemHoverCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PurchaseTrailSection({ purchaseTrail }: { purchaseTrail: CarryPurchaseTrailEntry[] }) {
  const timedPurchases = purchaseTrail.filter((entry) => entry.timeMinute !== null).length

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={<BootIcon />}
          title="Purchase Trail"
          subtitle="The item path from your actual match log or inventory"
          className="mb-0"
        />
        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-100">
          {purchaseTrail.length === 0 ? 'No items' : `${timedPurchases}/${purchaseTrail.length} timed`}
        </span>
      </div>

      {purchaseTrail.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {purchaseTrail.map((entry, index) => (
            <ItemHoverCard
              key={`${entry.timeMinute ?? 'snapshot'}-${entry.slotLabel ?? entry.itemKey}-${entry.itemKey}`}
              itemName={entry.itemName}
              description={entry.description}
              metaLines={[
                entry.timeMinute === null
                  ? 'Minuto de compra no disponible'
                  : `Adquirido: ${formatTime(entry.timeMinute)}`,
                entry.slotLabel ? `Inventario: ${entry.slotLabel}` : '',
              ].filter(Boolean)}
              align={index % 4 === 3 || index === purchaseTrail.length - 1 ? 'right' : 'left'}
              className="min-w-0"
            >
              <div className="grid min-h-[62px] grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2.5 py-2 transition-colors hover:border-cyan-300/30 hover:bg-cyan-400/5">
                <IconFrame
                  src={entry.iconUrl}
                  alt={entry.itemName}
                  fallback={entry.itemName.slice(0, 2).toUpperCase()}
                  fallbackSrcs={itemIconFallbackUrls(entry.itemKey)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30"
                  imgClassName="h-full w-full object-contain p-0.5"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">{entry.itemName}</p>
                  <p className={entry.timeMinute === null ? 'mt-0.5 text-[11px] text-slate-400' : 'mt-0.5 text-[11px] text-cyan-200'}>
                    {entry.timeMinute === null ? (entry.slotLabel ?? 'No exact timing') : formatTime(entry.timeMinute)}
                  </p>
                </div>
                <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  {entry.slotLabel ? entry.slotLabel.replace('Slot ', 'S').replace('Backpack ', 'B') : index + 1}
                </span>
                <span className="sr-only">{entry.description ?? entry.itemName}</span>
              </div>
            </ItemHoverCard>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-white/10 bg-black/20 px-3 py-4 text-sm text-slate-400">
          No purchase trail data available for this match.
        </div>
      )}
    </div>
  )
}

export function SkillBuildSection({ skillBuild }: { skillBuild: CarrySkillBuildEntry[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <SectionTitle
        icon={<GpmIcon />}
        title="Skill Build"
        subtitle="Order of abilities as they were leveled"
      />

      {skillBuild.length > 0 ? (
        <div className="overflow-x-auto pb-1">
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))' }}>
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
                <span className={[
                  'mx-auto rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]',
                  step.isTalent ? 'bg-amber-400/10 text-amber-200' : 'bg-cyan-400/10 text-cyan-100',
                ].join(' ')}>
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
  )
}

export function TalentTreeSection({ talents }: { talents: CarryTalentChoice[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <SectionTitle
        icon={<LastHitsIcon />}
        title="Talent Tree"
        subtitle="Selected talent at each tier"
      />

      <div className="grid gap-2">
        {talents.map((talent) => (
          <div key={talent.level} className="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)]">
            <div className="flex items-center gap-3 sm:flex-col sm:items-start">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">
                Lv {talent.level}
              </span>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-amber-300/20 bg-amber-400/10 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                Talent
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">
                  {talent.abilityKey ? cleanTalentLabel(talent.abilityName) : 'No talent selected'}
                </p>
                <span className={[
                  'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]',
                  talent.branch === 'left'
                    ? 'border border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
                    : talent.branch === 'right'
                      ? 'border border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100'
                      : 'border border-white/10 bg-white/[0.04] text-slate-200',
                ].join(' ')}>
                  {talent.branch ? `${talent.branch} branch` : 'not reached'}
                </span>
              </div>
              <div className="mt-2 grid gap-2">
                {(talent.options.length > 0 ? talent.options : [{
                  abilityKey: talent.abilityKey ?? `talent_${talent.level}`,
                  abilityName: talent.abilityKey ? cleanTalentLabel(titleCase(talent.abilityKey.replace(/^special_bonus_/, 'special bonus '))) : `Talent ${talent.level}`,
                  branch: talent.branch,
                  selected: Boolean(talent.abilityKey),
                }]).map((option) => (
                  <div
                    key={`${talent.level}-${option.abilityKey}`}
                    className={[
                      'flex items-start justify-between gap-3 rounded-md border px-3 py-2',
                      option.selected
                        ? 'border-amber-300/30 bg-amber-400/10 text-white'
                        : 'border-white/10 bg-black/20 text-slate-300',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <p className="whitespace-normal break-words text-xs font-medium leading-5">
                        {cleanTalentLabel(option.abilityName)}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                        {option.branch ? `${option.branch} branch` : 'match choice'}
                      </p>
                    </div>
                    {option.selected ? (
                      <span className="shrink-0 rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-100">
                        Selected
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NeutralItemsSection({ neutralItems }: { neutralItems: CarryNeutralItemHistoryEntry[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <SectionTitle
        icon={<TowerIcon />}
        title="Neutral Items"
        subtitle="Tiered neutral pickups from the match"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        {neutralItems.map((item) => (
          <div key={item.tier} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <IconFrame
                  src={item.iconUrl}
                  alt={item.itemName}
                  fallback={`T${item.tier}`}
                  fallbackSrcs={itemIconFallbackUrls(item.itemKey)}
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
  )
}

export function MetricBreakdownSection({ metrics }: { metrics: CarryComparisonMetric[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <SectionTitle
        icon={<BenchmarkIcon />}
        title="Metric Breakdown"
        subtitle="Output against the benchmark template"
      />

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
            {metrics.map((metric) => {
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
                      <div className={[
                        'flex h-9 w-9 items-center justify-center rounded-lg border',
                        metricTone(metric.key, metric.ratio),
                      ].join(' ')}>
                        <MetricIcon metricKey={metric.key} />
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
                  <td className={[
                    'px-4 py-3 text-right font-mono',
                    difference >= 0 ? 'text-emerald-300' : 'text-rose-300',
                  ].join(' ')}>
                    {formatSigned(difference)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionTitle({
  icon,
  title,
  subtitle,
  className = 'mb-3',
}: {
  icon: ReactNode
  title: string
  subtitle: string
  className?: string
}) {
  return (
    <div className={`${className} flex items-center gap-2`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
        <p className="text-sm text-slate-300">{subtitle}</p>
      </div>
    </div>
  )
}
