import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const mockGetCarryComparison = vi.fn()

vi.mock('../services/carryComparison.service', () => ({
  getCarryComparison: mockGetCarryComparison,
}))

const { default: app } = await import('../app')

describe('GET /api/carry-comparison/:accountId/:matchId/:heroId', () => {
  beforeEach(() => {
    mockGetCarryComparison.mockReset()
  })

  it('returns 503 with Retry-After when OpenDota is unreachable', async () => {
    const upstreamErr = Object.assign(new Error('OpenDota 521'), {
      isAxiosError: true,
      response: { status: 521 },
    })
    mockGetCarryComparison.mockRejectedValueOnce(upstreamErr)

    const res = await request(app).get('/api/carry-comparison/195348954/8827126159/138?percentile=99')

    expect(res.status).toBe(503)
    expect(res.headers['retry-after']).toBe('30')
  })

  it('returns 503 with Retry-After when the OpenDota circuit breaker is open', async () => {
    mockGetCarryComparison.mockRejectedValueOnce(
      new Error('OpenDota service temporarily unavailable (circuit open)'),
    )

    const res = await request(app).get('/api/carry-comparison/195348954/8827126159/138?percentile=99')

    expect(res.status).toBe(503)
    expect(res.headers['retry-after']).toBe('30')
  })
})
