import { useState, useMemo } from 'react'
import type { ProEncountersResponse, ProEncounter } from '../types'
import { ProEncounterRow } from './ProEncounterRow'

interface Props {
  data?: ProEncountersResponse
  loading?: boolean
}

type SortKey = 'personaname' | 'team_name' | 'last_match_time' | 'games' | 'win' | 'losses' | 'winrate'
type SortDir = 'asc' | 'desc'

interface Header {
  key: string
  label: string
  sortKey: SortKey | null
  align?: 'left' | 'center'
  hideOnMobile?: boolean
}

const HEADERS: Header[] = [
  { key: 'avatar',     label: '',           sortKey: null },
  { key: 'player',     label: 'Player',     sortKey: 'personaname' },
  { key: 'account_id', label: 'ID',         sortKey: null,              align: 'center' },
  { key: 'team',       label: 'Team',       sortKey: 'team_name' },
  { key: 'last_match', label: 'Last Match', sortKey: 'last_match_time', hideOnMobile: true },
  { key: 'games',      label: 'Games',      sortKey: 'games',           align: 'center' },
  { key: 'wins',       label: 'W',          sortKey: 'win',             align: 'center' },
  { key: 'losses',     label: 'L',          sortKey: 'losses',          align: 'center' },
  { key: 'winrate',    label: 'Win Rate',   sortKey: 'winrate',         align: 'center' },
  { key: 'country',    label: 'Country',    sortKey: null,              align: 'center', hideOnMobile: true },
  { key: 'expand',     label: '',           sortKey: null,              align: 'center' },
]

function sortPros(pros: ProEncounter[], key: SortKey, dir: SortDir): ProEncounter[] {
  return [...pros].sort((a, b) => {
    let valA: number | string
    let valB: number | string

    switch (key) {
      case 'losses':
        valA = a.games - a.win
        valB = b.games - b.win
        break
      case 'winrate':
        valA = a.games > 0 ? a.win / a.games : -1
        valB = b.games > 0 ? b.win / b.games : -1
        break
      case 'last_match_time':
        valA = a.last_match_time ? new Date(a.last_match_time).getTime() : 0
        valB = b.last_match_time ? new Date(b.last_match_time).getTime() : 0
        break
      default:
        valA = (a[key] as number | string) ?? ''
        valB = (b[key] as number | string) ?? ''
    }

    if (valA < valB) return dir === 'asc' ? -1 : 1
    if (valA > valB) return dir === 'asc' ? 1 : -1
    return 0
  })
}

const SKELETON_WIDTHS = [
  ['w-28', 'w-20', 'w-16'],
  ['w-36', 'w-28', 'w-20'],
  ['w-24', 'w-16', 'w-12'],
  ['w-32', 'w-24', 'w-14'],
  ['w-20', 'w-14', 'w-10'],
]

function SkeletonBody() {
  return (
    <>
      {SKELETON_WIDTHS.map((widths, i) => (
        <tr key={i} className="border-b border-dota-border/50">
          <td className="px-4 py-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-dota-border/40" />
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-col gap-1.5">
              <div className={`h-3 animate-pulse rounded bg-dota-border/40 ${widths[0]}`} />
              <div className={`h-2.5 animate-pulse rounded bg-dota-border/30 ${widths[1]}`} />
            </div>
          </td>
          <td className="px-4 py-3">
            <div className={`h-2.5 animate-pulse rounded bg-dota-border/30 ${widths[2]}`} />
          </td>
          <td className="px-4 py-3 text-center">
            <div className="mx-auto h-3 w-16 animate-pulse rounded bg-dota-border/35" />
          </td>
          <td className="hidden px-4 py-3 sm:table-cell">
            <div className="h-2.5 w-20 animate-pulse rounded bg-dota-border/30" />
          </td>
          <td className="px-4 py-3 text-center">
            <div className="mx-auto h-3 w-8 animate-pulse rounded bg-dota-border/40" />
          </td>
          <td className="px-4 py-3 text-center">
            <div className="mx-auto h-3 w-5 animate-pulse rounded bg-dota-border/40" />
          </td>
          <td className="px-4 py-3 text-center">
            <div className="mx-auto h-3 w-5 animate-pulse rounded bg-dota-border/40" />
          </td>
          <td className="px-4 py-3 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-3 w-10 animate-pulse rounded bg-dota-border/40" />
              <div className="h-1 w-16 animate-pulse rounded-full bg-dota-border/30" />
            </div>
          </td>
          <td className="hidden px-4 py-3 text-center sm:table-cell">
            <div className="mx-auto h-5 w-6 animate-pulse rounded bg-dota-border/30" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-16 animate-pulse rounded-md bg-dota-border/30" />
          </td>
        </tr>
      ))}
    </>
  )
}

export function ProEncounterTable({ data, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('games')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [onlyNamed, setOnlyNamed] = useState(true)

  const filtered = useMemo(
    () => data ? (onlyNamed ? data.pros.filter(p => p.name) : data.pros) : [],
    [data, onlyNamed],
  )

  const sorted = useMemo(
    () => filtered.length ? sortPros(filtered, sortKey, sortDir) : [],
    [filtered, sortKey, sortDir],
  )

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (loading || !data) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-10 animate-pulse rounded bg-dota-border/40" />
            <div className="h-4 w-48 animate-pulse rounded bg-dota-border/30" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-dota-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dota-border bg-dota-surface">
                {HEADERS.map(({ key, label, align, hideOnMobile }) => (
                  <th
                    key={key}
                    className={[
                      'px-4 py-3 text-xs font-medium uppercase tracking-widest text-gray-500 whitespace-nowrap',
                      align === 'center' ? 'text-center' : 'text-left',
                      hideOnMobile ? 'hidden sm:table-cell' : '',
                    ].join(' ')}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SkeletonBody />
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const total = data.pros.length
  const count = sorted.length

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p data-testid="summary-bar" className="text-gray-400">
          <span className="text-2xl font-bold text-dota-gold">{count}</span>
          {onlyNamed && count < total && (
            <span className="ml-1 text-sm text-gray-600">of {total}</span>
          )}
          {' '}
          <span className="text-sm">
            {count === 1 ? 'pro found' : 'pros found'} for account{' '}
            <span className="font-mono text-white">#{data.account_id}</span>
          </span>
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOnlyNamed(v => !v)}
            className={[
              'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all',
              onlyNamed
                ? 'border-dota-gold/50 bg-dota-gold/10 text-dota-gold'
                : 'border-dota-border text-gray-500 hover:border-dota-gold/30 hover:text-gray-400',
            ].join(' ')}
          >
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${onlyNamed ? 'bg-dota-gold' : 'bg-gray-600'}`} />
            Named pros only
          </button>

          <span className="hidden rounded-full border border-dota-border px-3 py-1 text-xs text-gray-600 sm:block">
            Data by OpenDota
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        <div className="overflow-x-auto rounded-xl border border-dota-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dota-border bg-dota-surface">
                {HEADERS.map(({ key, label, sortKey: sk, align, hideOnMobile }) => (
                  <th
                    key={key}
                    scope="col"
                    title={sk && label ? `Sort by ${label}` : undefined}
                    className={[
                      'px-4 py-3 text-xs font-medium uppercase tracking-widest whitespace-nowrap',
                      align === 'center' ? 'text-center' : 'text-left',
                      sk ? 'cursor-pointer select-none transition-colors hover:text-dota-gold' : '',
                      sk && sortKey === sk ? 'text-dota-gold' : 'text-gray-500',
                      hideOnMobile ? 'hidden sm:table-cell' : '',
                      key === 'expand' ? 'w-px' : '',
                    ].join(' ')}
                    onClick={sk ? () => handleSort(sk) : undefined}
                  >
                    {label}
                    {sk && (
                      <span className="ml-1 inline-block w-3">
                        {sortKey === sk
                          ? <span className="text-dota-gold">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          : <span className="text-gray-700">↕</span>}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((pro, index) => (
                <ProEncounterRow
                  key={pro.account_id}
                  pro={pro}
                  index={index}
                  accountId={data.account_id}
                />
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile scroll hint */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 rounded-r-xl bg-gradient-to-l from-dota-dark/80 to-transparent sm:hidden" />
      </div>
    </div>
  )
}
