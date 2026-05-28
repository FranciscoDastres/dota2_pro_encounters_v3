import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetMatchDetails = vi.fn()
const mockGetHeroBenchmarks = vi.fn()
const mockGetAbilityConstants = vi.fn()
const mockGetAbilityIds = vi.fn()
const mockGetHeroes = vi.fn()
const mockGetHeroAbilityData = vi.fn()
const mockGetItems = vi.fn()

vi.mock('../services/openDota.service', () => ({
  getMatchDetails: mockGetMatchDetails,
  getHeroBenchmarks: mockGetHeroBenchmarks,
  getAbilityConstants: mockGetAbilityConstants,
  getAbilityIds: mockGetAbilityIds,
  getHeroes: mockGetHeroes,
  getHeroAbilityData: mockGetHeroAbilityData,
  getItems: mockGetItems,
}))

const { getCarryComparison } = await import('../services/carryComparison.service')
const { clearDotaConstantsCaches } = await import('../services/dotaConstants.service')

describe('getCarryComparison', () => {
  beforeEach(() => {
    mockGetMatchDetails.mockReset()
    mockGetHeroBenchmarks.mockReset()
    mockGetAbilityConstants.mockReset()
    mockGetAbilityIds.mockReset()
    mockGetHeroes.mockReset()
    mockGetHeroAbilityData.mockReset()
    mockGetItems.mockReset()
    clearDotaConstantsCaches()
  })

  it('uses the explicit matchId and heroId from the dashboard state', async () => {
    mockGetMatchDetails.mockResolvedValueOnce({
      match_id: 9001,
      duration: 2400,
      players: [
        {
          account_id: 12345,
          hero_id: 41,
          gold_per_min: 760,
          xp_per_min: 810,
          last_hits: 340,
          hero_damage: 28000,
          tower_damage: 5000,
          deaths: 1,
          purchase_log: [{ time: 780, key: 'maelstrom' }],
          deaths_log: [],
        },
      ],
    })

    mockGetHeroBenchmarks.mockResolvedValueOnce({
      hero_id: 41,
      result: {
        gold_per_min: [{ percentile: 99, value: 720 }],
        last_hits_per_min: [{ percentile: 99, value: 8.8 }],
        xp_per_min: [{ percentile: 99, value: 780 }],
      },
    })
    mockGetAbilityConstants.mockResolvedValueOnce({})
    mockGetAbilityIds.mockResolvedValueOnce({})
    mockGetHeroes.mockResolvedValueOnce([{ id: 41, name: 'npc_dota_hero_furion' }])
    mockGetHeroAbilityData.mockResolvedValueOnce({})
    mockGetItems.mockResolvedValueOnce({})

    const result = await getCarryComparison({
      accountId: 12345,
      matchId: 9001,
      heroId: 41,
      percentile: 99,
    })

    expect(mockGetMatchDetails).toHaveBeenCalledWith(9001)
    expect(mockGetHeroBenchmarks).toHaveBeenCalledWith(41)
    expect(result.match_id).toBe(9001)
    expect(result.hero_id).toBe(41)
  })

  it('handles partially parsed OpenDota matches without damage or progression logs', async () => {
    mockGetMatchDetails.mockResolvedValueOnce({
      match_id: 9002,
      duration: 1811,
      players: [
        {
          account_id: 12345,
          hero_id: 64,
          player_slot: 2,
          gold_per_min: 338,
          xp_per_min: 378,
          last_hits: 42,
          net_worth: 10200,
          kills: 4,
          deaths: 8,
          assists: 10,
          item_0: 50,
        },
      ],
    })

    mockGetHeroBenchmarks.mockResolvedValueOnce({
      hero_id: 64,
      result: {
        gold_per_min: [{ percentile: 99, value: 680 }],
        last_hits_per_min: [{ percentile: 99, value: 8.2 }],
        xp_per_min: [{ percentile: 99, value: 760 }],
        hero_damage_per_min: [{ percentile: 99, value: 650 }],
        tower_damage: [{ percentile: 99, value: 5000 }],
      },
    })
    mockGetAbilityConstants.mockResolvedValueOnce({})
    mockGetAbilityIds.mockResolvedValueOnce({})
    mockGetHeroes.mockResolvedValueOnce([{ id: 64, name: 'npc_dota_hero_jakiro' }])
    mockGetHeroAbilityData.mockResolvedValueOnce({})
    mockGetItems.mockResolvedValueOnce({
      phase_boots: {
        id: 50,
        dname: 'Phase Boots',
        img: '/apps/dota2/images/dota_react/items/phase_boots.png',
      },
    })

    const result = await getCarryComparison({
      accountId: 12345,
      matchId: 9002,
      heroId: 64,
      percentile: 99,
    })

    expect(result.raw_user.hero_damage).toBe(0)
    expect(result.raw_user.tower_damage).toBe(0)
    expect(result.raw_user.purchase_log).toEqual([])
    expect(result.progression.skill_build).toEqual([])
    expect(result.item_timings.every((timing) => timing.status === 'snapshot')).toBe(true)
    expect(result.purchase_trail).toEqual([
      expect.objectContaining({
        itemKey: 'phase_boots',
        itemName: 'Phase Boots',
        slotLabel: 'Slot 1',
      }),
    ])
  })
})
