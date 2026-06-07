import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ResolvedItemConstant } from '../services/carryComparison.types'

const mockGetHeroRankings = vi.fn()
const mockGetMatchDetails = vi.fn()
const mockGetPatches = vi.fn()
const mockGetPlayerMatchesByHeroPatch = vi.fn()

vi.mock('../services/openDota.service', () => ({
  getHeroRankings: mockGetHeroRankings,
  getMatchDetails: mockGetMatchDetails,
  getPatches: mockGetPatches,
  getPlayerMatchesByHeroPatch: mockGetPlayerMatchesByHeroPatch,
}))

const {
  clearHeroPurchaseReferenceCache,
  compareRankedPurchaseTrails,
  getHeroPurchaseReference,
} = await import('../services/heroPurchaseReference.service')

const items: ResolvedItemConstant[] = [
  {
    id: 166,
    key: 'maelstrom',
    dname: 'Maelstrom',
    iconUrl: 'https://cdn.test/maelstrom.png',
    description: 'Chain lightning.',
    components: ['mithril_hammer', 'javelin', 'gloves'],
  },
  {
    id: 116,
    key: 'black_king_bar',
    dname: 'Black King Bar',
    iconUrl: 'https://cdn.test/black_king_bar.png',
    description: 'Debuff immunity.',
    components: ['mithril_hammer', 'ogre_axe'],
  },
]

describe('heroPurchaseReference.service', () => {
  beforeEach(() => {
    mockGetHeroRankings.mockReset()
    mockGetMatchDetails.mockReset()
    mockGetPatches.mockReset()
    mockGetPlayerMatchesByHeroPatch.mockReset()
    clearHeroPurchaseReferenceCache()
  })

  it('falls back to the previous patch and returns a real parsed purchase trail', async () => {
    mockGetHeroRankings.mockResolvedValue({
      hero_id: 41,
      rankings: [{
        account_id: 100058342,
        score: 8314.43,
        personaname: 'I am Going To Be The Best Carry',
        name: 'skiter',
        rank_tier: 80,
      }],
    })
    mockGetPatches.mockResolvedValue([
      { id: 59, name: '7.40', date: '2025-12-16T00:50:40.281Z' },
      { id: 60, name: '7.41', date: '2026-03-24T00:50:59.580Z' },
    ])
    mockGetPlayerMatchesByHeroPatch
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        match_id: 8742496748,
        hero_id: 41,
        start_time: 1774386240,
        duration: 2614,
      }])
    mockGetMatchDetails.mockResolvedValueOnce({
      match_id: 8742496748,
      start_time: 1774386240,
      duration: 2614,
      players: [{
        account_id: 100058342,
        hero_id: 41,
        gold_per_min: 700,
        xp_per_min: 800,
        last_hits: 350,
        purchase_log: [{ time: 780, key: 'maelstrom' }],
      }],
    })

    const result = await getHeroPurchaseReference(41, items)

    expect(mockGetPlayerMatchesByHeroPatch).toHaveBeenNthCalledWith(1, 100058342, 41, 60, 3)
    expect(mockGetPlayerMatchesByHeroPatch).toHaveBeenNthCalledWith(2, 100058342, 41, 59, 3)
    expect(result).toMatchObject({
      playerName: 'skiter',
      rankingScore: 8314.43,
      matchId: 8742496748,
      patchId: 59,
      patchName: '7.40',
      purchaseTrail: [
        expect.objectContaining({
          itemKey: 'maelstrom',
          timeMinute: 13,
        }),
      ],
    })
  })

  it('evaluates completed item timing differences and improvement priorities', () => {
    const comparison = compareRankedPurchaseTrails(
      [
        trailEntry('maelstrom', 'Maelstrom', 16),
      ],
      {
        accountId: 100058342,
        playerName: 'skiter',
        rankingScore: 8314.43,
        rankTier: 80,
        matchId: 8742496748,
        startTime: 1774386240,
        patchId: 60,
        patchName: '7.41',
        withinLast14Days: false,
        purchaseTrail: [
          trailEntry('maelstrom', 'Maelstrom', 13),
          trailEntry('black_king_bar', 'Black King Bar', 24),
        ],
      },
      items,
    )

    expect(comparison?.items).toEqual([
      expect.objectContaining({
        itemKey: 'maelstrom',
        differenceMinutes: 3,
        status: 'behind',
      }),
      expect.objectContaining({
        itemKey: 'black_king_bar',
        userMinute: null,
        status: 'missing',
      }),
    ])
    expect(comparison?.evaluation).toMatchObject({
      status: 'behind',
      behindCount: 1,
      missingCount: 1,
    })
    expect(comparison?.evaluation.improvements).toHaveLength(2)
  })
})

function trailEntry(itemKey: string, itemName: string, timeMinute: number) {
  return {
    timeMinute,
    itemKey,
    itemName,
    iconUrl: `https://cdn.test/${itemKey}.png`,
    slotLabel: null,
    description: itemName,
  }
}
