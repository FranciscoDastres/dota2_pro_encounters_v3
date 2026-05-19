import { vi, describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app'
import * as openDotaService from '../services/openDota.service'
import type { SharedMatch } from '../types'

vi.mock('../services/openDota.service')

const mockMatches: SharedMatch[] = [
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
  {
    match_id: 7890123457,
    start_time: 1705262400,
    radiant_win: false,
    player_slot: 128,
    hero_id: 2,
    kills: 3,
    deaths: 7,
    assists: 12,
    duration: 3100,
  },
]

describe('GET /api/pro-matches/:accountId/:proAccountId', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 200 with shared matches for valid params', async () => {
    vi.mocked(openDotaService.getSharedMatches).mockResolvedValueOnce(mockMatches)

    const res = await request(app).get('/api/pro-matches/12345678/87278757')

    expect(res.status).toBe(200)
    expect(res.body.account_id).toBe(12345678)
    expect(res.body.pro_account_id).toBe(87278757)
    expect(res.body.matches).toHaveLength(2)
  })

  it('returns 200 with an empty matches array when there are no shared games', async () => {
    vi.mocked(openDotaService.getSharedMatches).mockResolvedValueOnce([])

    const res = await request(app).get('/api/pro-matches/12345678/87278757')

    expect(res.status).toBe(200)
    expect(res.body.matches).toEqual([])
  })

  it('returns 400 when accountId contains letters', async () => {
    const res = await request(app).get('/api/pro-matches/not-a-number/87278757')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid/i)
  })

  it('returns 400 when proAccountId contains letters', async () => {
    const res = await request(app).get('/api/pro-matches/12345678/not-a-number')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid/i)
  })

  it('returns 400 when accountId is 0', async () => {
    const res = await request(app).get('/api/pro-matches/0/87278757')

    expect(res.status).toBe(400)
  })

  it('returns 503 when OpenDota API is unreachable', async () => {
    const networkErr = Object.assign(new Error('connect ECONNREFUSED'), {
      isAxiosError: true,
      response: undefined,
    })
    vi.mocked(openDotaService.getSharedMatches).mockRejectedValueOnce(networkErr)

    const res = await request(app).get('/api/pro-matches/12345678/87278757')

    expect(res.status).toBe(503)
    expect(res.body.error).toBe('Internal server error')
  })

  it('returns 429 when OpenDota rate-limits the request', async () => {
    const rateLimitErr = Object.assign(new Error('Too Many Requests'), {
      isAxiosError: true,
      response: { status: 429 },
    })
    vi.mocked(openDotaService.getSharedMatches).mockRejectedValueOnce(rateLimitErr)

    const res = await request(app).get('/api/pro-matches/12345678/87278757')

    expect(res.status).toBe(429)
    expect(res.body.error).toMatch(/rate limit/i)
  })

  it('returns 500 on unexpected service errors', async () => {
    vi.mocked(openDotaService.getSharedMatches).mockRejectedValueOnce(new Error('Unexpected'))

    const res = await request(app).get('/api/pro-matches/12345678/87278757')

    expect(res.status).toBe(500)
  })
})
