import { lazy, Suspense, useEffect, useState, useMemo } from 'react'
import { usePlayerProfile } from '../hooks/usePlayerProfile'
import type { TopHero } from '../types'
import { useHeroes, heroIconUrl } from '../hooks/useHeroes'
import { countryCodeToFlag } from '../utils/formatters'

const CarryComparisonMatchPanel = lazy(() =>
  import('./CarryComparisonMatchPanel').then((module) => ({ default: module.CarryComparisonMatchPanel })),
)

interface Props {
  accountId: number
}

const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com'
const RANK_NAMES = ['', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal']
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V']

function rankLabel(tier: number | null): string | null {
  if (!tier) return null
  const medal = Math.floor(tier / 10)
  const stars = tier % 10
  const name = RANK_NAMES[medal]
  if (!name) return null
  if (medal === 8) return 'Immortal'
  return stars ? `${name} ${ROMAN[stars] ?? ''}` : name
}

function timeAgo(unixSeconds: number): string {
  const diff = Math.floor((Date.now() / 1000) - unixSeconds)
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const days = Math.floor(diff / 86400)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function isWin(slot: number, radiantWin: boolean): boolean {
  return slot < 128 ? radiantWin : !radiantWin
}

function heroCoverUrl(heroName: string | undefined | null): string {
  const short = (heroName ?? '').replace('npc_dota_hero_', '')
  return `${STEAM_CDN}/apps/dota2/images/dota_react/heroes/${short}.png`
}

function legacyHeroCoverUrl(heroName: string | undefined | null): string {
  const short = (heroName ?? '').replace('npc_dota_hero_', '')
  return `${STEAM_CDN}/apps/dota2/images/heroes/${short}_full.png`
}

function HeroIcon({ heroId, heroMap, size = 8 }: { heroId: number | null; heroMap: ReturnType<typeof useHeroes>; size?: number }) {
  const hero = heroId ? heroMap[heroId] : null
  const cls = `h-${size} w-${size} flex-shrink-0 rounded`
  return hero ? (
    <img
      src={heroIconUrl(hero)}
      alt={hero.localized_name}
      loading="lazy"
      decoding="async"
      className={cls + ' ring-1 ring-dota-border'}
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
    />
  ) : (
    <div className={cls + ' bg-dota-border/40'} />
  )
}

export function PlayerProfile({ accountId }: Props) {
  const { data, loading } = usePlayerProfile(accountId)
  const [selectedMatchIdx, setSelectedMatchIdx] = useState<number | null>(null)
  const heroMap = useHeroes()

  useEffect(() => {
    setSelectedMatchIdx(null)
  }, [accountId])

  const selectedMatch = useMemo(() => {
    if (selectedMatchIdx === null || !data?.recentMatches || data.recentMatches.length === 0) return null
    return data.recentMatches[selectedMatchIdx] ?? null
  }, [data, selectedMatchIdx])

  if (loading) {
    return (
      <div className="mb-6 overflow-hidden rounded-xl border border-dota-border">
        <div className="flex h-48 animate-pulse items-end bg-dota-surface px-5 pb-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-full bg-dota-border/40" />
            <div className="flex flex-col gap-2">
              <div className="h-5 w-40 animate-pulse rounded bg-dota-border/40" />
              <div className="h-3 w-28 animate-pulse rounded bg-dota-border/30" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const rank = rankLabel(data.rankTier)
  const overallWR = data.totalGames > 0
    ? Math.round((data.totalWins / data.totalGames) * 100)
    : null

  const splashHeroes = data.topHeroes
    .slice(0, 3)
    .map(th => heroMap[th.heroId])
    .filter(Boolean)

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-dota-border">

      {/* ── Hero Splash ───────────────────────────────── */}
      <div className="relative flex min-h-[220px] items-end overflow-hidden bg-dota-darker">

        {/* 3 hero cover images */}
        {splashHeroes.length > 0 && (
          <div className="absolute inset-0 flex">
            {splashHeroes.map((hero, i) => (
              <div key={hero!.id} className="relative flex-1 overflow-hidden">
                <img
                  src={heroCoverUrl(hero!.name)}
                  alt={hero!.localized_name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full scale-110 object-cover object-center opacity-90 saturate-125"
                  onError={e => {
                    const image = e.currentTarget as HTMLImageElement
                    if (image.dataset.fallback === 'true') {
                      image.style.opacity = '0'
                      return
                    }

                    image.dataset.fallback = 'true'
                    image.src = legacyHeroCoverUrl(hero!.name)
                  }}
                />
                {/* separator between heroes */}
                {i < splashHeroes.length - 1 && (
                  <div className="absolute right-0 top-0 h-full w-px bg-dota-border/60" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* gradient overlays: sides + bottom */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(4,6,8,0.95) 0%, rgba(4,6,8,0.3) 25%, rgba(4,6,8,0.18) 75%, rgba(4,6,8,0.85) 100%), linear-gradient(to top, #0f1623 0%, rgba(8,12,20,0.42) 46%, rgba(8,12,20,0.06) 100%)'
          }}
        />

        {/* player identity — bottom left */}
        <div className="relative z-10 flex w-full flex-wrap items-center gap-4 px-5 pb-5">
          <a href={data.profileurl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <img
              src={data.avatarfull}
              alt={data.personaname}
              loading="lazy"
              decoding="async"
              className="h-16 w-16 rounded-full ring-2 ring-dota-border transition-all hover:ring-dota-gold/60"
            />
          </a>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={data.profileurl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-display text-xl font-bold text-white transition-colors hover:text-dota-gold-light"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {data.personaname}
              </a>
              {data.countryCode && (
                <span className="text-base" title={data.countryCode}>
                  {countryCodeToFlag(data.countryCode)}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              {rank && (
                <span className="rounded-full border border-dota-gold/30 bg-dota-gold/10 px-2 py-0.5 text-[11px] font-medium text-dota-gold">
                  {rank}
                </span>
              )}
              {overallWR !== null && (
                <span className="text-xs text-gray-400">
                  <span className="font-mono text-white">{overallWR}%</span>
                  {' Win Rate · '}
                  <span className="font-mono text-white">{data.totalGames.toLocaleString()}</span>
                  {' games'}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* end player identity */}
      </div>
      {/* ── end Hero Splash ──────────────────────────── */}

      <div className="h-px bg-dota-border/60" />

      {/* ── Bottom: top heroes + recent matches ───────────── */}
      <div className="flex flex-col">

        {/* Top 3 heroes */}
        <div className="px-5 py-5">
          <p className="mb-3 text-xs uppercase tracking-wider text-gray-500">Most Played</p>
          {data.topHeroes.length === 0 ? (
            <div className="rounded-lg bg-dota-border/20 px-4 py-3">
              <p className="text-xs italic text-gray-600">Not enough data (min. 20 games per hero)</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.topHeroes.map((th: TopHero, i) => {
                const hero = heroMap[th.heroId]
                const winPct = Math.round(th.winRate * 100)
                const lossPct = 100 - winPct
                return (
                  <div key={th.heroId} className="flex items-center gap-3">
                    <span className="w-4 flex-shrink-0 font-mono text-[11px] text-gray-600">{i + 1}</span>
                    <HeroIcon heroId={th.heroId} heroMap={heroMap} size={8} />
                    <div className="flex flex-1 min-w-0 flex-col gap-1">
                      <span className="truncate text-sm font-medium text-white">{hero?.localized_name ?? '—'}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-dota-border">
                          <div className="flex h-full">
                            <div className="bg-dota-radiant" style={{ width: `${winPct}%` }} />
                            <div className="bg-dota-dire" style={{ width: `${lossPct}%` }} />
                          </div>
                        </div>
                        <span className="text-[11px] text-gray-500">{th.games} games</span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs font-mono text-dota-gold">{winPct}% Win Rate</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent matches */}
        <div className="border-t border-dota-border/60 px-5 py-5">
          <p className="mb-3 text-xs uppercase tracking-wider text-gray-500">Recent Matches (Select to analyze)</p>
          {data.recentMatches.length > 0 ? (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.recentMatches.map((match, idx) => {
                const won = isWin(match.player_slot, match.radiant_win)
                const hero = heroMap[match.hero_id]
                const isActive = selectedMatchIdx === idx

                return (
                  <button
                    key={match.match_id}
                    onClick={() => setSelectedMatchIdx(idx)}
                    className={[
                      'group relative flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all hover:scale-[1.01]',
                      isActive
                        ? (won ? 'border-dota-radiant bg-dota-radiant/10' : 'border-dota-dire bg-dota-dire/10')
                        : (won ? 'border-dota-radiant/20 bg-dota-radiant/5 hover:border-dota-radiant/40' : 'border-dota-dire/20 bg-dota-dire/5 hover:border-dota-dire/40'),
                    ].join(' ')}
                  >
                    <HeroIcon heroId={match.hero_id} heroMap={heroMap} size={8} />
                    <div className="flex flex-1 min-w-0 flex-col gap-0.5 text-left">
                      <span className="truncate text-[11px] font-medium text-gray-300">
                        {hero?.localized_name ?? '—'}
                      </span>
                      <span className="truncate font-mono text-[10px] text-gray-600">
                        #{match.match_id} · {timeAgo(match.start_time)}
                      </span>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                      <span className={`text-[11px] font-bold ${won ? 'text-dota-radiant' : 'text-dota-dire'}`}>
                        {won ? 'WIN' : 'LOSS'}
                      </span>
                      <span className="font-mono text-[10px] text-gray-500">
                        {match.kills}/{match.deaths}/{match.assists}
                        {' · '}
                        {formatDuration(match.duration)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-dota-border/20 px-4 py-3">
              <p className="text-xs italic text-gray-600">No recent matches found</p>
            </div>
          )}
        </div>

      </div>

      {selectedMatch && (
        <div className="border-t border-dota-border/60 px-5 py-5">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-dota-border/20" />}>
            <CarryComparisonMatchPanel
              accountId={accountId}
              matchId={selectedMatch.match_id}
              heroId={selectedMatch.hero_id}
              percentile={99}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
