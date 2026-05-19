import { describe, expect, it } from 'vitest'
import { compareCarryPerformance } from '../services/carryComparison.service'

describe('compareCarryPerformance', () => {
  const baseMatch = {
    match_id: 123,
    duration: 2400,
    players: [],
  }

  const baseBenchmarks = {
    hero_id: 41,
    result: {
      gold_per_min: [
        { percentile: 95, value: 750 },
        { percentile: 99, value: 850 },
      ],
      last_hits_per_min: [
        { percentile: 95, value: 9 },
        { percentile: 99, value: 10 },
      ],
      xp_per_min: [{ percentile: 95, value: 780 }],
      hero_damage_per_min: [{ percentile: 95, value: 650 }],
      tower_damage: [{ percentile: 95, value: 4200 }],
    },
  }

  it('returns the required farming feedback when GPM is below 80% of pro benchmark', () => {
    const result = compareCarryPerformance({
      accountId: 10,
      match: baseMatch,
      player: {
        account_id: 10,
        hero_id: 41,
        gold_per_min: 590,
        xp_per_min: 700,
        last_hits: 280,
        hero_damage: 18000,
        tower_damage: 1200,
        deaths: 3,
        purchase_log: [],
        deaths_log: [],
      },
      benchmarks: baseBenchmarks,
      percentile: 95,
    })

    expect(result.efficiency_gap.gpmRatio).toBeLessThan(0.8)
    expect(result.efficiency_gap.feedback).toBe('Tu ruta de farming está dejando recursos en el mapa')
    expect(result.fulfilled_role).toBe(false)
  })

  it('marks the carry role as fulfilled when economy and core timings meet target', () => {
    const result = compareCarryPerformance({
      accountId: 10,
      match: baseMatch,
      player: {
        account_id: 10,
        hero_id: 41,
        gold_per_min: 760,
        xp_per_min: 800,
        last_hits: 370,
        hero_damage: 30000,
        tower_damage: 4500,
        deaths: 1,
        purchase_log: [
          { time: 450, key: 'power_treads' },
          { time: 800, key: 'maelstrom' },
          { time: 1300, key: 'black_king_bar' },
        ],
        deaths_log: [],
      },
      benchmarks: baseBenchmarks,
      percentile: 95,
    })

    expect(result.fulfilled_role).toBe(true)
    expect(result.item_timings.every((timing) => timing.status === 'on_time')).toBe(true)
  })
})
