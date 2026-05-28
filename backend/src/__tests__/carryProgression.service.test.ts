import { describe, expect, it } from 'vitest'
import {
  buildTalentChoices,
  compareItemTimings,
} from '../services/carryProgression.service'
import type {
  CarrySkillBuildEntry,
  HeroAbilityMetadata,
  ResolvedAbilityConstant,
  ResolvedItemConstant,
} from '../services/carryComparison.types'

describe('carry progression helpers', () => {
  it('uses canonical item keys so core item aliases still get icons and timings', () => {
    const itemConstants: ResolvedItemConstant[] = [
      {
        id: 21,
        key: 'invis_sword',
        dname: 'Shadow Blade',
        iconUrl: 'https://cdn.test/items/invis_sword.png',
        description: 'Become invisible and move faster.',
        components: [],
      },
    ]

    const result = compareItemTimings(
      11,
      [{ time: 15 * 60, key: 'invis_sword' }],
      itemConstants,
    )
    const shadowBlade = result.find((timing) => timing.itemName === 'Shadow Blade')

    expect(shadowBlade).toMatchObject({
      itemKey: 'invis_sword',
      iconUrl: 'https://cdn.test/items/invis_sword.png',
      description: 'Become invisible and move faster.',
      status: 'on_time',
      userMinute: 15,
      completedMinute: 15,
      timingSource: 'purchase_log',
    })
  })

  it('can estimate completed item timing from components when the final inventory confirms the item', () => {
    const itemConstants: ResolvedItemConstant[] = [
      itemConstant(166, 'maelstrom', 'Maelstrom', ['mithril_hammer', 'javelin', 'gloves']),
      itemConstant(161, 'mithril_hammer', 'Mithril Hammer'),
      itemConstant(225, 'javelin', 'Javelin'),
      itemConstant(24, 'gloves', 'Gloves of Haste'),
    ]

    const result = compareItemTimings(
      41,
      [
        { time: 420, key: 'mithril_hammer' },
        { time: 610, key: 'javelin' },
        { time: 720, key: 'gloves' },
      ],
      itemConstants,
      {
        match_id: 1,
        hero_id: 41,
        item_0: 166,
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
        kills: 0,
        deaths: 0,
        assists: 0,
        gold_per_min: 0,
        xp_per_min: 0,
        last_hits: 0,
        hero_damage: 0,
        tower_damage: 0,
        obs_placed: 0,
        sen_placed: 0,
        ability_upgrades_arr: [],
        purchase_log: [],
        neutral_item_history: [],
        deaths_log: [],
      },
    )

    const maelstrom = result.find((timing) => timing.itemKey === 'maelstrom')

    expect(maelstrom).toMatchObject({
      userMinute: 12,
      completedMinute: 12,
      timingSource: 'component_inference',
      status: 'on_time',
    })
  })

  it('maps selected level 20 and 25 talents by hero talent metadata', () => {
    const skillBuild: CarrySkillBuildEntry[] = [
      talentStep(10, 7001, 'special_bonus_attack_speed_15', '+15 Attack Speed'),
      talentStep(16, 7003, 'special_bonus_strength_10', '+10 Strength'),
      talentStep(22, 7005, 'special_bonus_unique_test_20_left', '+20 Example Left'),
      talentStep(27, 7008, 'special_bonus_unique_test_25_right', '+25 Example Right'),
    ]
    const heroAbilityData: Record<string, HeroAbilityMetadata> = {
      npc_dota_hero_test: {
        abilities: [],
        talents: [
          { name: 'special_bonus_damage_10', level: 10 },
          { name: 'special_bonus_attack_speed_15', level: 10 },
          { name: 'special_bonus_hp_200', level: 15 },
          { name: 'special_bonus_strength_10', level: 15 },
          { name: 'special_bonus_unique_test_20_left', level: 20 },
          { name: 'special_bonus_unique_test_20_right', level: 20 },
          { name: 'special_bonus_unique_test_25_left', level: 25 },
          { name: 'special_bonus_unique_test_25_right', level: 25 },
        ],
      },
    }
    const abilityConstants: ResolvedAbilityConstant[] = [
      talentConstant('special_bonus_unique_test_20_left', '+20 Example Left'),
      talentConstant('special_bonus_unique_test_20_right', '+20 Example Right'),
      talentConstant('special_bonus_unique_test_25_left', '+25 Example Left'),
      talentConstant('special_bonus_unique_test_25_right', '+25 Example Right'),
    ]

    const result = buildTalentChoices(skillBuild, 'npc_dota_hero_test', heroAbilityData, abilityConstants)
    const level20 = result.find((talent) => talent.level === 20)
    const level25 = result.find((talent) => talent.level === 25)

    expect(level20?.abilityKey).toBe('special_bonus_unique_test_20_left')
    expect(level20?.options).toEqual([
      expect.objectContaining({ abilityName: '+20 Example Left', branch: 'left', selected: true }),
      expect.objectContaining({ abilityName: '+20 Example Right', branch: 'right', selected: false }),
    ])
    expect(level25?.abilityKey).toBe('special_bonus_unique_test_25_right')
    expect(level25?.options).toEqual([
      expect.objectContaining({ abilityName: '+25 Example Left', branch: 'left', selected: false }),
      expect.objectContaining({ abilityName: '+25 Example Right', branch: 'right', selected: true }),
    ])
  })
})

function talentStep(level: number, abilityId: number, abilityKey: string, abilityName: string): CarrySkillBuildEntry {
  return {
    level,
    abilityId,
    abilityKey,
    abilityName,
    iconUrl: '',
    isTalent: true,
    hotkey: null,
  }
}

function talentConstant(key: string, dname: string): ResolvedAbilityConstant {
  return {
    key,
    dname,
    iconUrl: '',
    isTalent: true,
  }
}

function itemConstant(
  id: number,
  key: string,
  dname: string,
  components: string[] = [],
): ResolvedItemConstant {
  return {
    id,
    key,
    dname,
    iconUrl: `https://cdn.test/items/${key}.png`,
    description: dname,
    components,
  }
}
