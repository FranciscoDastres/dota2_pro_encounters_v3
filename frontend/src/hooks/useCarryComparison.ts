import { useEffect, useRef, useState } from 'react'
import { fetchPositionComparison } from '../services/api'
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

export function usePositionComparison(
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
    const cached = carryComparisonCache.get(key)
    if (cached) {
      lastKeyRef.current = key
      setState({ data: cached, loading: false, error: null })
      return
    }

    const controller = new AbortController()
    lastKeyRef.current = key
    setState((current) => ({ ...current, loading: true, error: null }))

    fetchPositionComparison(accountId, matchId, heroId, percentile, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return
        carryComparisonCache.set(key, response)
        setState({ data: response, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : 'Could not load carry comparison.'
        setState({ data: null, loading: false, error: message })
      })

    return () => controller.abort()
  }, [accountId, matchId, heroId, percentile])

  return state
}

export const useCarryComparison = usePositionComparison
