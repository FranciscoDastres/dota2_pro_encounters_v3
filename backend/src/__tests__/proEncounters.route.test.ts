import { vi, describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app'
import * as cacheService from '../services/cache.service'
import type { OpenDotaProEncounter } from '../types'

vi.mock('../services/cache.service')

const mockPros: OpenDotaProEncounter[] = [
  {
    account_id: 87278757,
    avatarfull: 'https://example.com/avatar.jpg',
    profileurl: 'https://steamcommunity.com/id/Miracle-/',
    personaname: 'Miracle-',
    team_name: 'Team Liquid',
    last_match_time: '2024-01-15T20:00:00.000Z',
    games: 3,
    win: 1,
    country_code: 'JO',
  },
  {
    account_id: 111620041,
    avatarfull: 'https://example.com/avatar2.jpg',
    profileurl: 'https://steamcommunity.com/id/Puppey/',
    personaname: 'Puppey',
    team_name: 'Team Secret',
    last_match_time: '2023-11-20T18:30:00.000Z',
    games: 1,
    win: 0,
    country_code: 'EE',
  },
]

describe('GET /api/pro-encounters/:accountId', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 200 with pros array for a valid accountId', async () => {
    vi.mocked(cacheService.getPlayerProsWithCache).mockResolvedValueOnce(mockPros)

    const res = await request(app).get('/api/pro-encounters/12345678')

    expect(res.status).toBe(200)
    expect(res.body.account_id).toBe(12345678)
    expect(res.body.pros).toHaveLength(2)
    expect(res.body.pros[0].personaname).toBe('Miracle-')
  })

  it('returns 200 with empty pros array when player has no pro encounters', async () => {
    vi.mocked(cacheService.getPlayerProsWithCache).mockResolvedValueOnce([])

    const res = await request(app).get('/api/pro-encounters/99999999')

    expect(res.status).toBe(200)
    expect(res.body.account_id).toBe(99999999)
    expect(res.body.pros).toEqual([])
  })

  it('returns 400 when accountId contains letters', async () => {
    const res = await request(app).get('/api/pro-encounters/not-a-number')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid/i)
  })

  it('returns 400 when accountId mixes letters and digits', async () => {
    const res = await request(app).get('/api/pro-encounters/123abc')

    expect(res.status).toBe(400)
  })

  // En proEncounters.route.test.ts

  it('returns 503 when the circuit breaker is open', async () => {
    vi.mocked(cacheService.getPlayerProsWithCache).mockRejectedValueOnce(
      new Error('OpenDota service temporarily unavailable (circuit open)')
    )

    const res = await request(app).get('/api/pro-encounters/12345678')

    expect(res.status).toBe(503)
    expect(res.body.error).toBe('Internal server error')
  })

  it('returns 429 when OpenDota rate-limits the request', async () => {
    const rateLimitErr = Object.assign(new Error('Too Many Requests'), {
      isAxiosError: true,
      response: { status: 429 },
    })
    vi.mocked(cacheService.getPlayerProsWithCache).mockRejectedValueOnce(rateLimitErr)

    const res = await request(app).get('/api/pro-encounters/12345678')

    expect(res.status).toBe(429)
  })

  it('returns 500 on unexpected service errors', async () => {
    vi.mocked(cacheService.getPlayerProsWithCache).mockRejectedValueOnce(new Error('Unexpected'))

    const res = await request(app).get('/api/pro-encounters/12345678')

    expect(res.status).toBe(500)
  })
})
