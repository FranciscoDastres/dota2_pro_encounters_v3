import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetPlayerProfile = vi.fn()
const mockGetPlayerHeroes = vi.fn()
const mockGetRecentMatches = vi.fn()

vi.mock('../services/openDota.service', () => ({
  getPlayerProfile: mockGetPlayerProfile,
  getPlayerHeroes: mockGetPlayerHeroes,
  getRecentMatches: mockGetRecentMatches,
}))

const { clearPlayerProfileCache, getPlayerProfileSummary } = await import('../services/playerProfile.service')

describe('playerProfile.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    clearPlayerProfileCache()

    mockGetPlayerProfile.mockResolvedValue({
      rank_tier: 75,
      profile: {
        account_id: 12345,
        personaname: 'Player',
        avatarfull: 'https://example.com/avatar.jpg',
        profileurl: 'https://example.com/player',
        loccountrycode: 'CL',
      },
    })
    mockGetPlayerHeroes.mockResolvedValue([
      { hero_id: 1, games: 30, win: 18 },
      { hero_id: 2, games: 10, win: 7 },
    ])
    mockGetRecentMatches.mockResolvedValue([
      {
        match_id: 9001,
        player_slot: 0,
        radiant_win: true,
        hero_id: 1,
        start_time: 1_700_000_000,
        duration: 2400,
        kills: 10,
        deaths: 2,
        assists: 8,
      },
    ])
  })

  it('builds and caches a profile summary', async () => {
    const first = await getPlayerProfileSummary(12345)
    const second = await getPlayerProfileSummary(12345)

    expect(first).toEqual(second)
    expect(first).toMatchObject({
      personaname: 'Player',
      rankTier: 75,
      totalGames: 40,
      totalWins: 25,
      topHeroes: [{ heroId: 1, games: 30, wins: 18, winRate: 0.6 }],
    })
    expect(mockGetPlayerProfile).toHaveBeenCalledTimes(1)
    expect(mockGetPlayerHeroes).toHaveBeenCalledTimes(1)
    expect(mockGetRecentMatches).toHaveBeenCalledTimes(1)
  })

  it('deduplicates concurrent requests for the same account', async () => {
    const [first, second] = await Promise.all([
      getPlayerProfileSummary(12345),
      getPlayerProfileSummary(12345),
    ])

    expect(first).toEqual(second)
    expect(mockGetPlayerProfile).toHaveBeenCalledTimes(1)
  })
})
