import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useSharedMatches } from '../hooks/useSharedMatches'
import * as api from '../services/api'
import type { SharedMatchesResponse } from '../types'

vi.mock('../services/api')

const mockResponse: SharedMatchesResponse = {
  account_id: 12345678,
  pro_account_id: 87278757,
  matches: [
    {
      match_id: 7890123456,
      start_time: 1705348800,
      radiant_win: true,
      player_slot: 0,
      hero_id: 1,
      kills: 10,
      deaths: 2,
      assists: 5,
      duration: 2400,
    },
  ],
}

describe('useSharedMatches', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useSharedMatches(12345678, 87278757))

    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('sets loading state immediately when load is called', async () => {
    let resolvePromise!: (v: SharedMatchesResponse) => void
    vi.mocked(api.fetchSharedMatches).mockImplementationOnce(
      () => new Promise((r) => { resolvePromise = r }),
    )

    const { result } = renderHook(() => useSharedMatches(12345678, 87278757))

    act(() => { result.current.load() })
    expect(result.current.status).toBe('loading')

    // Settle the pending promise to avoid act() warnings
    await act(async () => { resolvePromise(mockResponse) })
  })

  it('sets success state with the matches array on resolve', async () => {
    vi.mocked(api.fetchSharedMatches).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSharedMatches(12345678, 87278757))
    await act(async () => { await result.current.load() })

    expect(result.current.status).toBe('success')
    expect(result.current.data).toEqual(mockResponse.matches)
    expect(result.current.error).toBeNull()
  })

  it('sets error state on rejection', async () => {
    vi.mocked(api.fetchSharedMatches).mockRejectedValueOnce(new Error('Account not found'))

    const { result } = renderHook(() => useSharedMatches(12345678, 87278757))
    await act(async () => { await result.current.load() })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Account not found')
    expect(result.current.data).toBeNull()
  })

  it('uses "Unknown error" when the thrown value is not an Error instance', async () => {
    vi.mocked(api.fetchSharedMatches).mockRejectedValueOnce('plain string error')

    const { result } = renderHook(() => useSharedMatches(12345678, 87278757))
    await act(async () => { await result.current.load() })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Unknown error')
  })

  it('ignores a second load() call while already loading', async () => {
    let resolvePromise!: (v: SharedMatchesResponse) => void
    vi.mocked(api.fetchSharedMatches).mockImplementationOnce(
      () => new Promise((r) => { resolvePromise = r }),
    )

    const { result } = renderHook(() => useSharedMatches(12345678, 87278757))

    // First call starts loading
    act(() => { result.current.load() })
    expect(result.current.status).toBe('loading')

    // Second call while loading — should be ignored
    act(() => { result.current.load() })

    expect(vi.mocked(api.fetchSharedMatches)).toHaveBeenCalledTimes(1)

    await act(async () => { resolvePromise(mockResponse) })
  })

  it('calls fetchSharedMatches with the correct accountId and proAccountId', async () => {
    vi.mocked(api.fetchSharedMatches).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSharedMatches(12345678, 87278757))
    await act(async () => { await result.current.load() })

    // load() triggers the 'all' filter — no filter param passed (undefined)
    expect(vi.mocked(api.fetchSharedMatches)).toHaveBeenCalledWith(12345678, 87278757, undefined)
  })
})
