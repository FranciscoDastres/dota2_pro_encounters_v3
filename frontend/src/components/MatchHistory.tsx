import { useEffect } from 'react'
import { useSharedMatches } from '../hooks/useSharedMatches'
import { useHeroes, heroIconUrl } from '../hooks/useHeroes'
import type { SharedMatch, MatchFilter } from '../types'

interface Props {
  accountId: number
  proAccountId: number
}

function isWin(match: SharedMatch): boolean {
  const isRadiant = match.player_slot < 128
  return isRadiant ? match.radiant_win : !match.radiant_win
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatMatchDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const TABS: { key: MatchFilter; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'with',    label: 'Ally' },
  { key: 'against', label: 'Enemy' },
]

export function MatchHistory({ accountId, proAccountId }: Props) {
  const { data, status, error, load, activeFilter, changeFilter, cache } =
    useSharedMatches(accountId, proAccountId)
  const heroMap = useHeroes()

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const matchLabel = activeFilter === 'with' ? 'ally' : activeFilter === 'against' ? 'enemy' : 'shared'

  function tabCount(key: MatchFilter): string {
    const s = cache[key]
    if (s.status === 'success' && s.data) return ` (${s.data.length})`
    if (s.status === 'loading') return ' …'
    return ''
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-3 flex gap-1.5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeFilter(key)}
            className={[
              'rounded-md border px-3 py-1 text-[11px] font-medium transition-all',
              activeFilter === key
                ? 'border-dota-gold/50 bg-dota-gold/10 text-dota-gold'
                : 'border-dota-border text-gray-600 hover:border-dota-gold/40 hover:text-dota-gold',
            ].join(' ')}
          >
            {label}{tabCount(key)}
          </button>
        ))}
      </div>

      {/* Content */}
      {status === 'loading' || status === 'idle' ? (
        <div>
          <p className="mb-2 text-[11px] text-gray-700">OpenDota can take up to 15s on first load…</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex h-[72px] animate-pulse items-center gap-2 rounded-lg border border-dota-border/40 bg-dota-border/20 px-3 py-2">
                <div className="h-8 w-8 flex-shrink-0 rounded bg-dota-border/40" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-2.5 w-3/4 rounded bg-dota-border/40" />
                  <div className="h-2 w-1/2 rounded bg-dota-border/30" />
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                  <div className="h-2.5 w-8 rounded bg-dota-border/40" />
                  <div className="h-2 w-12 rounded bg-dota-border/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : status === 'error' ? (
        <p className="py-3 text-center text-sm text-dota-red/80">{error}</p>
      ) : !data || data.length === 0 ? (
        <p className="py-3 text-center text-sm text-gray-600">
          No {matchLabel} matches found.
        </p>
      ) : (
        <div>
          <p className="mb-2 text-xs text-gray-600">
            {data.length} {matchLabel} {data.length === 1 ? 'match' : 'matches'} — click any to open in OpenDota
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((match) => {
              const won = isWin(match)
              const hero = heroMap[match.hero_id]
              return (
                <a
                  key={match.match_id}
                  href={`https://www.opendota.com/matches/${match.match_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                    'transition-all duration-150 hover:scale-[1.01]',
                    won
                      ? 'border-dota-radiant/25 bg-dota-radiant/5 hover:border-dota-radiant/50 hover:bg-dota-radiant/10'
                      : 'border-dota-dire/25 bg-dota-dire/5 hover:border-dota-dire/50 hover:bg-dota-dire/10',
                  ].join(' ')}
                >
                  {/* Hero portrait */}
                  {hero ? (
                    <img
                      src={heroIconUrl(hero)}
                      alt={hero.localized_name}
                      className="h-8 w-8 flex-shrink-0 rounded"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="h-8 w-8 flex-shrink-0 rounded bg-dota-border/50" />
                  )}

                  {/* Hero name + match ID + date */}
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-gray-300 truncate">
                      {hero?.localized_name ?? '—'}
                    </span>
                    <span className="font-mono text-[10px] text-gray-600">
                      #{match.match_id} · {formatMatchDate(match.start_time)}
                    </span>
                  </div>

                  {/* Result + stats */}
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span
                      className={`text-[11px] font-bold ${
                        won ? 'text-dota-radiant' : 'text-dota-dire'
                      }`}
                    >
                      {won ? 'WIN' : 'LOSS'}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500">
                      {match.kills}/{match.deaths}/{match.assists}
                      {' · '}
                      {formatDuration(match.duration)}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
