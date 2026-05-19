import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { OpenDotaProEncounter } from '../types'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockGetPlayerPros = vi.fn()
vi.mock('../services/openDota.service', () => ({
  getPlayerPros: mockGetPlayerPros,
}))

// Supabase chainable builder: from().select().eq().single() / from().upsert()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockUpsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('../services/supabase.service', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('../config/env', () => ({
  env: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  },
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

    // Re-wire the Supabase chainable mock after resetAllMocks clears implementations
    mockSingle.mockResolvedValue({ data: null, error: null })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockUpsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert })
  })

  describe('when Supabase is configured', () => {

    it('returns cached data without calling OpenDota when the cache is fresh', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { pros: mockPros, cached_at: new Date().toISOString() },
        error: null,
      })

      const result = await getPlayerProsWithCache(12345)

      expect(result).toEqual(mockPros)
      expect(mockGetPlayerPros).not.toHaveBeenCalled()
    })

    it('calls OpenDota and upserts when the cache entry is stale (> 1h)', async () => {
      const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      mockSingle.mockResolvedValueOnce({
        data: { pros: [], cached_at: staleDate },
        error: null,
      })
      mockGetPlayerPros.mockResolvedValueOnce(mockPros)

      const result = await getPlayerProsWithCache(12345)

      expect(mockGetPlayerPros).toHaveBeenCalledWith(12345)
      expect(mockUpsert).toHaveBeenCalled()
      expect(result).toEqual(mockPros)
    })

    it('calls OpenDota and upserts when there is no cache entry', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null })
      mockGetPlayerPros.mockResolvedValueOnce(mockPros)

      const result = await getPlayerProsWithCache(12345)

      expect(mockGetPlayerPros).toHaveBeenCalledWith(12345)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ steam_id: 12345, pros: mockPros }),
        { onConflict: 'steam_id' },
      )
      expect(result).toEqual(mockPros)
    })

    it('stores the correct accountId as steam_id in the upsert', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null })
      mockGetPlayerPros.mockResolvedValueOnce([])

      await getPlayerProsWithCache(99999999)

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ steam_id: 99999999 }),
        expect.anything(),
      )
    })
  })
})
