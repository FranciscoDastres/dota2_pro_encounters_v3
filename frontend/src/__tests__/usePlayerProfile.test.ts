import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlayerProfile } from '../hooks/usePlayerProfile'
import * as api from '../services/api'
import type { PlayerProfileResponse } from '../types'

vi.mock('../services/api')

const response: PlayerProfileResponse = {
  account_id: 12345,
  profile: {
    personaname: 'Player',
    avatarfull: 'https://example.com/avatar.jpg',
    profileurl: 'https://example.com/player',
    rankTier: 75,
    countryCode: 'CL',
    totalGames: 30,
    totalWins: 18,
    topHeroes: [],
    recentMatches: [],
  },
}

describe('usePlayerProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  it('loads a profile through the backend API', async () => {
    vi.mocked(api.fetchPlayerProfile).mockResolvedValueOnce(response)

    const { result } = renderHook(() => usePlayerProfile(12345))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(api.fetchPlayerProfile).toHaveBeenCalledWith(12345, expect.any(AbortSignal))
    expect(result.current.loading).toBe(false)
    expect(result.current.data?.personaname).toBe('Player')
  })

  it('reuses the browser profile cache on a later mount', async () => {
    vi.mocked(api.fetchPlayerProfile).mockResolvedValueOnce(response)

    const first = renderHook(() => usePlayerProfile(12345))
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    first.unmount()

    const second = renderHook(() => usePlayerProfile(12345))

    expect(second.result.current.data?.personaname).toBe('Player')
    expect(api.fetchPlayerProfile).toHaveBeenCalledTimes(1)
  })
})
