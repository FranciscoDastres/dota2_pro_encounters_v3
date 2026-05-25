import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { OpenDotaProEncounter } from '../types'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockGetPlayerPros = vi.fn()
vi.mock('../services/openDota.service', () => ({
  getPlayerPros: mockGetPlayerPros,
}))

const mockQuery = vi.fn()

vi.mock('../services/database.service', () => ({
  query: mockQuery,
}))

// Import after mocks so the module picks up the mocked dependencies
const { clearPlayerProsMemoryCache, getPlayerProsWithCache } = await import('../services/cache.service')

// ── Fixtures ──────────────────────────────────────────────────────────────────

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
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('cache.service — getPlayerProsWithCache', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    clearPlayerProsMemoryCache()

    mockQuery.mockResolvedValue({ rows: [] })
  })

  describe('when Postgres is configured', () => {

    it('returns cached data without calling OpenDota when the cache is fresh', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ pros: mockPros, cached_at: new Date().toISOString() }],
      })

      const result = await getPlayerProsWithCache(12345)

      expect(result).toEqual(mockPros)
      expect(mockGetPlayerPros).not.toHaveBeenCalled()
    })

    it('calls OpenDota and upserts when the cache entry is stale (> 1h)', async () => {
      const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      mockQuery.mockResolvedValueOnce({
        rows: [{ pros: [], cached_at: staleDate }],
      })
      mockGetPlayerPros.mockResolvedValueOnce(mockPros)

      const result = await getPlayerProsWithCache(12345)

      expect(mockGetPlayerPros).toHaveBeenCalledWith(12345)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('insert into match_cache'),
        [12345, JSON.stringify(mockPros)],
      )
      expect(result).toEqual(mockPros)
    })

    it('calls OpenDota and upserts when there is no cache entry', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })
      mockGetPlayerPros.mockResolvedValueOnce(mockPros)

      const result = await getPlayerProsWithCache(12345)

      expect(mockGetPlayerPros).toHaveBeenCalledWith(12345)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('insert into match_cache'),
        [12345, JSON.stringify(mockPros)],
      )
      expect(result).toEqual(mockPros)
    })

    it('stores the correct accountId as steam_id in the upsert', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })
      mockGetPlayerPros.mockResolvedValueOnce([])

      await getPlayerProsWithCache(99999999)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('insert into match_cache'),
        [99999999, JSON.stringify([])],
      )
    })

    it('falls back to OpenDota when the cache read fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('database down'))
      mockGetPlayerPros.mockResolvedValueOnce(mockPros)

      const result = await getPlayerProsWithCache(12345)

      expect(mockGetPlayerPros).toHaveBeenCalledWith(12345)
      expect(result).toEqual(mockPros)
    })
  })
})
