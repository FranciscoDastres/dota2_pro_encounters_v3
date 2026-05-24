import { describe, expect, it } from 'vitest'
import { detectPosition } from '../services/carryMetrics.service'
import type { OpenDotaMatchPlayer } from '../services/carryComparison.schemas'

function player(overrides: Partial<OpenDotaMatchPlayer>): OpenDotaMatchPlayer {
  return {
    account_id: 1,
    hero_id: 1,
    player_slot: 0,
    lane_role: 1,
    kills: 0,
    deaths: 0,
    assists: 0,
    gold_per_min: 0,
    xp_per_min: 0,
    last_hits: 0,
    net_worth: 0,
    hero_damage: 0,
    tower_damage: 0,
    obs_placed: 0,
    sen_placed: 0,
    ability_upgrades_arr: [],
    purchase_log: [],
    neutral_item_history: [],
    deaths_log: [],
    item_0: 0,
    item_1: 0,
    item_2: 0,
    item_3: 0,
    item_4: 0,
    item_5: 0,
    backpack_0: 0,
    backpack_1: 0,
    backpack_2: 0,
    item_neutral: 0,
    item_neutral2: 0,
    ...overrides,
  }
}

describe('detectPosition', () => {
  it('classifies pure supports by support net worth order instead of inverting pos 4 and 5', () => {
    const shadowShaman = player({
      account_id: 27,
      hero_id: 27,
      player_slot: 3,
      lane_role: 3,
      net_worth: 8200,
    })
    const hardSupport = player({
      account_id: 5,
      hero_id: 5,
      player_slot: 4,
      lane_role: 3,
      net_worth: 4200,
    })
    const highNetWorthTeammates = [
      player({ account_id: 1, hero_id: 1, player_slot: 0, lane_role: 1, net_worth: 17000 }),
      player({ account_id: 2, hero_id: 2, player_slot: 1, lane_role: 2, net_worth: 15000 }),
      player({ account_id: 3, hero_id: 3, player_slot: 2, lane_role: 3, net_worth: 11000 }),
      shadowShaman,
      hardSupport,
    ]
    const lowNetWorthShadowShaman = { ...shadowShaman, net_worth: 3500 }
    const lowNetWorthTeammates = [
      highNetWorthTeammates[0],
      highNetWorthTeammates[1],
      highNetWorthTeammates[2],
      lowNetWorthShadowShaman,
      hardSupport,
    ]

    expect(detectPosition(shadowShaman, highNetWorthTeammates)).toBe(4)
    expect(detectPosition(lowNetWorthShadowShaman, lowNetWorthTeammates)).toBe(5)
  })
})
