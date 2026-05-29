import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { OpenDotaProEncounter } from '../types'

// mockGet must be declared before vi.mock because vi.mock is hoisted
const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ get: mockGet, post: mockPost })),
    isAxiosError: vi.fn((err) => Boolean((err as { isAxiosError?: boolean }).isAxiosError)),
  },
  AxiosError: class AxiosError extends Error {},
}))

// Import AFTER mock setup so the service picks up the mocked axios.create
const {
  clearQueuedMatchParseRequests,
  getPlayerPros,
  queueMatchParseRequest,
  requestMatchParse,
} = await import('../services/openDota.service')

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

describe('openDota.service', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    clearQueuedMatchParseRequests()
  })

  describe('getPlayerPros', () => {
    it('calls the correct OpenDota endpoint', async () => {
      mockGet.mockResolvedValueOnce({ data: mockPros })

      await getPlayerPros(12345)

      expect(mockGet).toHaveBeenCalledWith('/players/12345/pros')
    })

    it('returns the pros array from the response', async () => {
      mockGet.mockResolvedValueOnce({ data: mockPros })

      const result = await getPlayerPros(12345)

      expect(result).toEqual(mockPros)
    })

    it('returns an empty array when OpenDota returns []', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })

      const result = await getPlayerPros(99999999)

      expect(result).toEqual([])
    })

    it('propagates errors thrown by axios', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'))

      await expect(getPlayerPros(12345)).rejects.toThrow('Network error')
    })
  })

  describe('requestMatchParse', () => {
    it('calls the OpenDota parse request endpoint', async () => {
      mockPost.mockResolvedValueOnce({ data: { job: { jobId: 123 } } })

      await requestMatchParse(9001)

      expect(mockPost).toHaveBeenCalledWith('/request/9001')
    })

    it('queues each match parse request once per process', async () => {
      mockPost.mockResolvedValue({ data: { job: { jobId: 123 } } })

      const first = queueMatchParseRequest(9002)
      const second = queueMatchParseRequest(9002)

      expect(first).toBe('requested')
      expect(second).toBe('already_requested')
      expect(mockPost).toHaveBeenCalledTimes(1)
    })
  })
})
