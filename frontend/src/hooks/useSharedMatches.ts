import { useState, useCallback, useRef } from 'react'
import { fetchSharedMatches } from '../services/api'
import type { SharedMatch, MatchFilter } from '../types'

interface FilterState {
  data: SharedMatch[] | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
}

const EMPTY: FilterState = { data: null, status: 'idle', error: null }

type FilterCache = Record<MatchFilter, FilterState>

export function useSharedMatches(accountId: number, proAccountId: number) {
  const [activeFilter, setActiveFilter] = useState<MatchFilter>('all')
  const [cache, setCache] = useState<FilterCache>({
    all:     EMPTY,
    with:    EMPTY,
    against: EMPTY,
  })

  // Always-fresh ref so loadFilter never has stale closure over cache
  const cacheRef = useRef(cache)
  cacheRef.current = cache

  const loadFilter = useCallback(async (filter: MatchFilter) => {
    const current = cacheRef.current[filter]
    if (current.status === 'loading' || current.status === 'success') return

    setCache(prev => ({ ...prev, [filter]: { data: null, status: 'loading', error: null } }))
    try {
      const filterParam = filter === 'all' ? undefined : filter
      const res = await fetchSharedMatches(accountId, proAccountId, filterParam)
      setCache(prev => ({ ...prev, [filter]: { data: res.matches, status: 'success', error: null } }))
    } catch (err) {
      setCache(prev => ({
        ...prev,
        [filter]: {
          data: null,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      }))
    }
  }, [accountId, proAccountId])

  /** Initial load (called from MatchHistory useEffect) */
  const load = useCallback(() => loadFilter('all'), [loadFilter])

  /** Switch tab and fetch its data if not yet cached */
  const changeFilter = useCallback((filter: MatchFilter) => {
    setActiveFilter(filter)
    loadFilter(filter)
  }, [loadFilter])

  const current = cache[activeFilter]

  return {
    data: current.data,
    status: current.status,
    error: current.error,
    load,
    activeFilter,
    changeFilter,
    cache,
  }
}
