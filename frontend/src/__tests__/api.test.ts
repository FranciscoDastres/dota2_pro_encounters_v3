import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPositionComparison } from '../services/api'

describe('api retry behavior', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not retry responses that include Retry-After', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '30',
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPositionComparison(195348954, 8827126159, 138, 99))
      .rejects
      .toThrow('Internal server error')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
