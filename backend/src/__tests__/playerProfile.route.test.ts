import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import app from '../app'
import * as playerProfileService from '../services/playerProfile.service'

vi.mock('../services/playerProfile.service')

describe('GET /api/player-profile/:accountId', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns the cached player profile response shape', async () => {
    vi.mocked(playerProfileService.getPlayerProfileSummary).mockResolvedValueOnce({
      personaname: 'Player',
      avatarfull: 'https://example.com/avatar.jpg',
      profileurl: 'https://example.com/player',
      rankTier: 75,
      countryCode: 'CL',
      totalGames: 30,
      totalWins: 18,
      topHeroes: [],
      recentMatches: [],
    })

    const res = await request(app).get('/api/player-profile/12345')

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toContain('max-age=300')
    expect(res.body).toMatchObject({
      account_id: 12345,
      profile: { personaname: 'Player' },
    })
  })

  it('rejects invalid account ids before calling the service', async () => {
    const res = await request(app).get('/api/player-profile/not-a-number')

    expect(res.status).toBe(400)
    expect(playerProfileService.getPlayerProfileSummary).not.toHaveBeenCalled()
  })
})
