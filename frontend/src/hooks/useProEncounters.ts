import { useState, useCallback, useEffect } from 'react'
import { fetchProEncounters } from '../services/api'
import type { ProEncountersResponse, SearchStatus } from '../types'

interface State {
  data: ProEncountersResponse | null
  status: SearchStatus
  error: string | null
}

interface UseProEncountersReturn extends State {
  search: (accountId: string) => Promise<void>
  reset: () => void
}

const INITIAL_STATE: State = { data: null, status: 'idle', error: null }

export function useProEncounters(): UseProEncountersReturn {
  const [state, setState] = useState<State>(INITIAL_STATE)

  const search = useCallback(async (accountId: string) => {
    window.history.replaceState(null, '', `?account=${accountId}`)
    setState({ data: null, status: 'loading', error: null })
    try {
      const data = await fetchProEncounters(accountId)
      setState({ data, status: 'success', error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setState({ data: null, status: 'error', error: message })
    }
  }, [])

  const reset = useCallback(() => {
    window.history.replaceState(null, '', window.location.pathname)
    setState(INITIAL_STATE)
  }, [])

  useEffect(() => {
    const accountId = new URLSearchParams(window.location.search).get('account')
    if (accountId) search(accountId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ...state, search, reset }
}
