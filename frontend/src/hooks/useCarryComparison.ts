import { useEffect, useRef, useState } from 'react'
import { fetchCarryComparison } from '../services/api'
import type { CarryComparisonResponse } from '../types'

interface CarryComparisonState {
  data: CarryComparisonResponse | null
  loading: boolean
  error: string | null
}

const carryComparisonCache = new Map<string, CarryComparisonResponse>()

function cacheKey(accountId: number, matchId: number, heroId: number, percentile: 95 | 99): string {
  return `${accountId}:${matchId}:${heroId}:${percentile}`
}

export function useCarryComparison(
  accountId: number | null,
  matchId: number | null,
  heroId: number | null,
  percentile: 95 | 99 = 99,
) {
  const [state, setState] = useState<CarryComparisonState>({
    data: null,
    loading: false,
    error: null,
  })
  const lastKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!accountId || !matchId || !heroId) {
      setState({ data: null, loading: false, error: null })
      lastKeyRef.current = null
      return
    }

    const key = cacheKey(accountId, matchId, heroId, percentile)
    if (lastKeyRef.current === key && state.data) return

    const cached = carryComparisonCache.get(key)
    if (cached) {
      lastKeyRef.current = key
      setState({ data: cached, loading: false, error: null })
      return
    }

    let cancelled = false
    lastKeyRef.current = key
    setState((current) => ({ ...current, loading: true, error: null }))

    fetchCarryComparison(accountId, matchId, heroId, percentile)
      .then((response) => {
        if (cancelled) return
        carryComparisonCache.set(key, response)
        setState({ data: response, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Could not load carry comparison.'
        setState({ data: null, loading: false, error: message })
      })

    return () => {
      cancelled = true
    }
  }, [accountId, matchId, heroId, percentile])

  return state
}
