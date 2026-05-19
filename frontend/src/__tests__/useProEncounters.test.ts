import { renderHook, act } from '@testing-library/react'
import { useProEncounters } from '../hooks/useProEncounters'
import * as api from '../services/api'
import type { ProEncountersResponse } from '../types'

vi.mock('../services/api')

const mockResponse: ProEncountersResponse = {
  account_id: 12345678,
  pros: [],
}

describe('useProEncounters', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    window.history.replaceState(null, '', '/')
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useProEncounters())
    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('sets loading state immediately when search is called', async () => {
    let resolvePromise!: (v: ProEncountersResponse) => void
    vi.mocked(api.fetchProEncounters).mockImplementationOnce(
      () => new Promise((r) => { resolvePromise = r }),
    )

    const { result } = renderHook(() => useProEncounters())

    act(() => { result.current.search('12345678') })
    expect(result.current.status).toBe('loading')

    await act(async () => { resolvePromise(mockResponse) })
  })

  it('sets success state with data on resolve', async () => {
    vi.mocked(api.fetchProEncounters).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useProEncounters())
    await act(async () => { await result.current.search('12345678') })

    expect(result.current.status).toBe('success')
    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.error).toBeNull()
  })

  it('sets error state on rejection', async () => {
    vi.mocked(api.fetchProEncounters).mockRejectedValueOnce(new Error('Account not found'))

    const { result } = renderHook(() => useProEncounters())
    await act(async () => { await result.current.search('12345678') })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Account not found')
    expect(result.current.data).toBeNull()
  })

  it('reset returns to idle state', async () => {
    vi.mocked(api.fetchProEncounters).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useProEncounters())
    await act(async () => { await result.current.search('12345678') })
    act(() => { result.current.reset() })

    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
