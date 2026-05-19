import { z } from 'zod'
import {
  getAbilityConstants,
  getAbilityIds,
  getHeroes,
  getHeroAbilityData,
  getItems,
  getHeroBenchmarks,
  getMatchDetails,
} from './openDota.service'

const CORE_ITEM_TIMINGS_BY_HERO: Record<number, Record<string, { label: string; optimalMinute: number; graceMinutes: number }>> = {
  1: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    bfury: { label: 'Battle Fury', optimalMinute: 14, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 21, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 25, graceMinutes: 3 },
  },
  2: {
    phase_boots: { label: 'Phase Boots', optimalMinute: 8, graceMinutes: 2 },
    blink: { label: 'Blink Dagger', optimalMinute: 14, graceMinutes: 3 },
    blade_mail: { label: 'Blade Mail', optimalMinute: 19, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 25, graceMinutes: 3 },
  },
  6: {
    power_treads: { label: 'Power Treads', optimalMinute: 7, graceMinutes: 2 },
    hurricane_pike: { label: 'Hurricane Pike', optimalMinute: 16, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  8: {
    phase_boots: { label: 'Phase Boots', optimalMinute: 7, graceMinutes: 2 },
    maelstrom: { label: 'Maelstrom', optimalMinute: 13, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 20, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 24, graceMinutes: 3 },
  },
  11: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    shadow_sb: { label: 'Shadow Blade', optimalMinute: 15, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  18: {
    power_treads: { label: 'Power Treads', optimalMinute: 7, graceMinutes: 2 },
    echo_sabre: { label: 'Echo Sabre', optimalMinute: 13, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 20, graceMinutes: 3 },
  },
  21: {
    arcane_boots: { label: 'Arcane Boots', optimalMinute: 8, graceMinutes: 3 },
    blink: { label: 'Blink Dagger', optimalMinute: 18, graceMinutes: 4 },
    wind_waker: { label: 'Wind Waker', optimalMinute: 35, graceMinutes: 5 },
  },
  27: {
    arcane_boots: { label: 'Arcane Boots', optimalMinute: 9, graceMinutes: 3 },
    blink: { label: 'Blink Dagger', optimalMinute: 18, graceMinutes: 4 },
    aether_lens: { label: 'Aether Lens', optimalMinute: 24, graceMinutes: 4 },
  },
  41: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    maelstrom: { label: 'Maelstrom', optimalMinute: 14, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  44: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    bfury: { label: 'Battle Fury', optimalMinute: 15, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 23, graceMinutes: 3 },
  },
  48: {
    power_treads: { label: 'Power Treads', optimalMinute: 7, graceMinutes: 2 },
    mask_of_madness: { label: 'Mask of Madness', optimalMinute: 11, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 19, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 24, graceMinutes: 3 },
  },
  54: {
    phase_boots: { label: 'Phase Boots', optimalMinute: 7, graceMinutes: 2 },
    radiance: { label: 'Radiance', optimalMinute: 16, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 23, graceMinutes: 3 },
  },
  72: {
    power_treads: { label: 'Power Treads', optimalMinute: 7, graceMinutes: 2 },
    maelstrom: { label: 'Maelstrom', optimalMinute: 13, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  74: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    hand_of_midas: { label: 'Hand of Midas', optimalMinute: 11, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  94: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 18, graceMinutes: 3 },
    butterfly: { label: 'Butterfly', optimalMinute: 27, graceMinutes: 4 },
  },
  109: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 18, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 24, graceMinutes: 3 },
  },
}

const DEFAULT_CORE_TIMINGS = {
  power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
  maelstrom: { label: 'Maelstrom', optimalMinute: 14, graceMinutes: 2 },
  black_king_bar: { label: 'Black King Bar', optimalMinute: 23, graceMinutes: 3 },
}

const ROLE_METADATA: Record<number, { title: string; label: string; feedback_ok: string; feedback_fail: string }> = {
  1: {
    title: 'Hard Carry Benchmark',
    label: 'Hard Carry',
    feedback_ok: 'Cumpliste el rol de Hard Carry: tu economía y tus timings están cerca del estándar profesional.',
    feedback_fail: 'Tu economía de Hard Carry está por debajo del estándar pro. Prioriza rutas de farm y timings core.',
  },
  2: {
    title: 'Mid Lane Benchmark',
    label: 'Mid',
    feedback_ok: 'Dominaste el Mid: tus niveles y recursos están a la par de un jugador profesional.',
    feedback_fail: 'Como Mid, necesitas mayor impacto en oro y niveles. Mejora tu eficiencia en línea y rotaciones.',
  },
  3: {
    title: 'Offlaner Benchmark',
    label: 'Offlaner',
    feedback_ok: 'Gran desempeño como Offlaner: lograste balancear farm con presencia en el mapa.',
    feedback_fail: 'Tu impacto como Offlaner fue bajo. Necesitas asegurar tus items de utilidad/inicio más rápido.',
  },
  4: {
    title: 'Support Benchmark',
    label: 'Support',
    feedback_ok: 'Excelente trabajo de Support: aportaste impacto con recursos limitados.',
    feedback_fail: 'Como Support, busca participar en más kills y asegurar items clave de utilidad.',
  },
  5: {
    title: 'Hard Support Benchmark',
    label: 'Hard Support',
    feedback_ok: 'Hard Support ejemplar: sacrificaste farm para habilitar a tu equipo con gran eficiencia.',
    feedback_fail: 'Como Hard Support, enfócate en tu posicionamiento y en maximizar tu impacto con pocos recursos.',
  },
}

const openDotaAbilityConstantSchema = z.object({
  id: z.number().optional(),
  dname: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
}).passthrough()

const openDotaAbilityConstantsSchema = z.record(z.string(), openDotaAbilityConstantSchema)

const openDotaHeroSchema = z.object({
  id: z.number(),
  name: z.string(),
  localized_name: z.string().optional(),
}).passthrough()

const openDotaHeroesSchema = z.array(openDotaHeroSchema)

const openDotaItemSchema = z.object({
  id: z.number(),
  dname: z.string().optional(),
  img: z.string().optional(),
}).passthrough()

const openDotaItemsSchema = z.record(z.string(), openDotaItemSchema)

export const openDotaPlayerMatchSchema = z.object({
  match_id: z.number(),
  hero_id: z.number(),
})

export const openDotaPurchaseLogSchema = z.object({
  time: z.number(),
  key: z.string(),
})

export const openDotaNeutralItemHistorySchema = z.object({
  time: z.number(),
  item_neutral: z.string(),
  item_neutral_enhancement: z.string().nullable().optional(),
}).passthrough()

export const openDotaDeathLogSchema = z.object({
  time: z.number(),
}).passthrough()

export const openDotaMatchPlayerSchema = z.object({
  account_id: z.number().optional(),
  hero_id: z.number(),
  player_slot: z.number().optional(),
  isRadiant: z.boolean().optional(),
  lane_role: z.number().optional().nullable(),
  kills: z.number().nonnegative().default(0),
  deaths: z.number().nonnegative().default(0),
  assists: z.number().nonnegative().default(0),
  gold_per_min: z.number(),
  xp_per_min: z.number(),
  last_hits: z.number(),
  net_worth: z.number().optional(),
  hero_damage: z.number(),
  tower_damage: z.number(),
  obs_placed: z.number().optional().default(0),
  sen_placed: z.number().optional().default(0),
  ability_upgrades_arr: z.array(z.number()).default([]),
  purchase_log: z.array(openDotaPurchaseLogSchema).default([]),
  neutral_item_history: z.array(openDotaNeutralItemHistorySchema).default([]),
  deaths_log: z.array(openDotaDeathLogSchema).default([]),
  item_0: z.number().default(0),
  item_1: z.number().default(0),
  item_2: z.number().default(0),
  item_3: z.number().default(0),
  item_4: z.number().default(0),
  item_5: z.number().default(0),
  backpack_0: z.number().default(0),
  backpack_1: z.number().default(0),
  backpack_2: z.number().default(0),
  item_neutral: z.number().default(0),
  item_neutral2: z.number().default(0),
})

export const openDotaMatchSchema = z.object({
  match_id: z.number(),
  duration: z.number().positive(),
  players: z.array(openDotaMatchPlayerSchema),
})

const benchmarkValueSchema = z.object({
  percentile: z.number(),
  value: z.number(),
})

export const openDotaBenchmarksSchema = z.object({
  hero_id: z.number(),
  result: z.object({
    gold_per_min: z.array(benchmarkValueSchema),
    last_hits_per_min: z.array(benchmarkValueSchema),
    xp_per_min: z.array(benchmarkValueSchema).optional(),
    hero_damage_per_min: z.array(benchmarkValueSchema).optional(),
    tower_damage: z.array(benchmarkValueSchema).optional(),
  }),
})

export interface CarryComparisonMetric {
  key:
  | 'gold_per_min'
  | 'xp_per_min'
  | 'last_hits_per_10'
  | 'hero_damage'
  | 'tower_damage'
  | 'assists'
  | 'hero_healing'
  | 'stuns'
  | 'observer_wards_placed'
  | 'sentry_wards_placed'
  label: string
  value: number
  benchmark: number
  percentile: number
  ratio: number
}

export interface CarryItemTimingComparison {
  itemKey: string
  itemName: string
  iconUrl: string
  userMinute: number | null
  proMinute: number
  differenceMinutes: number | null
  status: 'on_time' | 'late' | 'missing' | 'snapshot'
}

export interface CarryPurchaseTrailEntry {
  timeMinute: number | null
  itemKey: string
  itemName: string
  iconUrl: string
  slotLabel: string | null
  description: string | null
}

export interface CarrySkillBuildEntry {
  level: number
  abilityId: number
  abilityKey: string
  abilityName: string
  iconUrl: string
  isTalent: boolean
  hotkey: 'Q' | 'W' | 'E' | 'R' | 'D' | 'F' | null
}

export interface CarryTalentChoice {
  level: 10 | 15 | 20 | 25
  abilityId: number | null
  abilityKey: string | null
  abilityName: string
  iconUrl: string
  branch: 'left' | 'right' | null
  alternativeName: string | null
  alternativeKey: string | null
}

export interface CarryNeutralItemHistoryEntry {
  tier: 1 | 2 | 3 | 4 | 5
  itemKey: string
  itemName: string
  iconUrl: string
  acquiredMinute: number | null
  enhancementKey: string | null
  enhancementName: string | null
}

export interface CarryComparisonResponse {
  account_id: number
  match_id: number
  hero_id: number
  benchmark_percentile: 95 | 99
  scenario: 'stomp' | 'comeback'
  fulfilled_role: boolean
  role_info: {
    position: 1 | 2 | 3 | 4 | 5
    label: string
    title: string
  }
  efficiency_gap: {
    score: number
    gpmRatio: number
    lh10Ratio: number
    feedback: string
  }
  metrics: CarryComparisonMetric[]
  item_timings: CarryItemTimingComparison[]
  purchase_trail: CarryPurchaseTrailEntry[]
  progression: {
    skill_build: CarrySkillBuildEntry[]
    talents: CarryTalentChoice[]
    neutral_items: CarryNeutralItemHistoryEntry[]
  }
  hero_name: string | null
  raw_user: {
    kills: number
    deaths: number
    assists: number
    gold_per_min: number
    xp_per_min: number
    last_hits: number
    net_worth: number | null
    hero_damage: number
    tower_damage: number
    ability_upgrades_arr: number[]
    neutral_item_history: z.infer<typeof openDotaNeutralItemHistorySchema>[]
    purchase_log: z.infer<typeof openDotaPurchaseLogSchema>[]
  }
}


interface ResolvedAbilityConstant {
  key: string
  dname: string
  iconUrl: string
  isTalent: boolean
}

interface ResolvedItemConstant {
  id: number
  key: string
  dname: string
  iconUrl: string
}

interface HeroAbilityMetadata {
  abilities: string[]
  talents: Array<{ name: string; level: number }>
}

let abilityConstantsCache: ResolvedAbilityConstant[] | null = null
let abilityConstantsPromise: Promise<ResolvedAbilityConstant[]> | null = null
let abilityIdsCache: Record<string, string> | null = null
let abilityIdsPromise: Promise<Record<string, string>> | null = null
let heroAbilityDataCache: Record<string, HeroAbilityMetadata> | null = null
let heroAbilityDataPromise: Promise<Record<string, HeroAbilityMetadata>> | null = null
function abilityIconUrl(abilityKey: string): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/abilities/${abilityKey}.png`
}

function itemIconUrl(itemKey: string): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${itemKey}.png`
}

function normalizeIconName(iconName: string | null | undefined): string | null {
  if (!iconName) return null
  return iconName.replace(/^https?:\/\/[^/]+/i, '').replace(/\?.*$/, '')
}

function toCdnImageUrl(path: string | null | undefined): string | null {
  const normalized = normalizeIconName(path)
  if (!normalized) return null
  return `https://cdn.cloudflare.steamstatic.com${normalized}`
}

function resolveItemByKey(constants: ResolvedItemConstant[], itemKey: string): ResolvedItemConstant | null {
  const aliases: Record<string, string> = {
    battlefury: 'bfury',
  }
  const lookup = aliases[itemKey] ?? itemKey
  return constants.find((entry) => entry.key === lookup) ?? null
}

function titleCaseFromKey(key: string): string {
  return key
    .replace(/^(npc_dota_hero_|special_bonus_)/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function humanizeTalentName(key: string, dname: string | undefined): string {
  if (dname && !/[{}]/.test(dname)) return dname
  return titleCaseFromKey(key)
}

function resolveNeutralTier(minute: number): 1 | 2 | 3 | 4 | 5 {
  if (minute < 12) return 1
  if (minute < 22) return 2
  if (minute < 32) return 3
  if (minute < 45) return 4
  return 5
}

async function loadAbilityConstants(): Promise<ResolvedAbilityConstant[]> {
  if (abilityConstantsCache) return abilityConstantsCache
  if (!abilityConstantsPromise) {
    abilityConstantsPromise = getAbilityConstants()
      .then((payload) => {
        const parsed = openDotaAbilityConstantsSchema.parse(payload) as Record<string, z.infer<typeof openDotaAbilityConstantSchema>>
        const resolved = Object.entries(parsed)
          .map(([key, value]) => {
            const dname = value.dname?.trim() || titleCaseFromKey(key)
            return {
              key,
              dname,
              iconUrl: toCdnImageUrl(value.img) ?? abilityIconUrl(key),
              isTalent: key.startsWith('special_bonus_'),
            }
          })
          .filter((entry): entry is ResolvedAbilityConstant => entry !== null)
        abilityConstantsCache = resolved
        abilityConstantsPromise = null
        return resolved
      })
      .catch((err) => {
        abilityConstantsPromise = null
        throw err
      })
  }
  return abilityConstantsPromise
}

async function loadAbilityIds(): Promise<Record<string, string>> {
  if (abilityIdsCache) return abilityIdsCache
  if (!abilityIdsPromise) {
    abilityIdsPromise = getAbilityIds()
      .then((payload) => {
        const parsed = z.record(z.string(), z.string()).parse(payload)
        abilityIdsCache = parsed
        abilityIdsPromise = null
        return parsed
      })
      .catch((err) => {
        abilityIdsPromise = null
        throw err
      })
  }
  return abilityIdsPromise
}

async function loadHeroAbilityData(): Promise<Record<string, HeroAbilityMetadata>> {
  if (heroAbilityDataCache) return heroAbilityDataCache
  if (!heroAbilityDataPromise) {
    heroAbilityDataPromise = getHeroAbilityData()
      .then((payload) => {
        const schema = z.record(z.string(), z.object({
          abilities: z.array(z.union([z.string(), z.array(z.string())])).default([]),
          talents: z.array(z.object({
            name: z.string(),
            level: z.number(),
          })).default([]),
        }).passthrough())
        const parsedRaw = schema.parse(payload)
        const parsed: Record<string, HeroAbilityMetadata> = Object.fromEntries(
          Object.entries(parsedRaw).map(([heroKey, value]) => [
            heroKey,
            {
              abilities: value.abilities.flatMap((entry) => Array.isArray(entry) ? entry : [entry]),
              talents: value.talents,
            },
          ]),
        )
        heroAbilityDataCache = parsed
        heroAbilityDataPromise = null
        return parsed
      })
      .catch((err) => {
        heroAbilityDataPromise = null
        throw err
      })
  }
  return heroAbilityDataPromise
}

function resolveAbilityByKey(constants: ResolvedAbilityConstant[], abilityKey: string): ResolvedAbilityConstant | null {
  return constants.find((entry) => entry.key === abilityKey) ?? null
}

function buildSkillProgression(
  abilityUpgrades: number[],
  abilityConstants: ResolvedAbilityConstant[],
  abilityIds: Record<string, string>,
  heroName: string | null,
  heroAbilityData: Record<string, HeroAbilityMetadata>,
): CarrySkillBuildEntry[] {
  const heroAbilities = heroName ? heroAbilityData[heroName] ?? null : null
  const learnedAbilityKeys = new Set(
    abilityUpgrades
      .map((abilityId) => abilityIds[String(abilityId)] ?? null)
      .filter((key): key is string => Boolean(key && !key.startsWith('special_bonus_'))),
  )
  const orderedAbilityKeys = heroAbilities
    ? heroAbilities.abilities.filter((key) => key !== 'generic_hidden' && learnedAbilityKeys.has(key))
    : [...learnedAbilityKeys]

  return abilityUpgrades.map((abilityId, index) => {
    const level = index + 1
    const abilityKey = abilityIds[String(abilityId)] ?? `ability_${abilityId}`
    const resolved = resolveAbilityByKey(abilityConstants, abilityKey)
    const isTalentLevel = abilityKey.startsWith('special_bonus_') || [10, 15, 20, 25].includes(level)
    const abilityName = resolved
      ? (resolved.isTalent ? humanizeTalentName(abilityKey, resolved.dname) : resolved.dname)
      : titleCaseFromKey(abilityKey)
    const hotkeyIndex = orderedAbilityKeys.indexOf(abilityKey)
    return {
      level,
      abilityId,
      abilityKey,
      abilityName,
      iconUrl: resolved?.iconUrl ?? (isTalentLevel ? '' : abilityIconUrl(abilityKey)),
      isTalent: (resolved?.isTalent ?? isTalentLevel) || abilityKey.startsWith('special_bonus_'),
      hotkey: !isTalentLevel && hotkeyIndex >= 0
        ? (['Q', 'W', 'E', 'R'][hotkeyIndex] as 'Q' | 'W' | 'E' | 'R')
        : null,
    }
  })
}

function buildTalentChoices(
  skillBuild: CarrySkillBuildEntry[],
  heroName: string | null,
  heroAbilityData: Record<string, HeroAbilityMetadata>,
): CarryTalentChoice[] {
  const tierLevels: Array<10 | 15 | 20 | 25> = [10, 15, 20, 25]
  const talentEntries = skillBuild.filter((entry) => entry.isTalent)
  const heroAbilities = heroName ? heroAbilityData[heroName] ?? null : null
  const talentPairs = heroAbilities?.talents ?? []

  return tierLevels.map((level, index) => {
    const entry = talentEntries[index]
    const talentPair = talentPairs.slice(index * 2, index * 2 + 2)
    const selectedKey = entry?.abilityKey ?? null
    const selectedName = entry?.abilityName ?? `Talent ${level}`
    const alternate = talentPair.find((talent) => talent.name !== selectedKey) ?? null
    const branch = talentPair.length === 2 && selectedKey
      ? (talentPair[0].name === selectedKey ? 'left' : 'right')
      : null
    return {
      level,
      abilityId: entry?.abilityId ?? null,
      abilityKey: selectedKey,
      abilityName: selectedKey ? humanizeTalentName(selectedKey, selectedName) : selectedName,
      iconUrl: '',
      branch,
      alternativeName: alternate ? titleCaseFromKey(alternate.name) : null,
      alternativeKey: alternate?.name ?? null,
    }
  })
}

function buildNeutralItems(
  neutralItemHistory: z.infer<typeof openDotaNeutralItemHistorySchema>[] | undefined,
): CarryNeutralItemHistoryEntry[] {
  const byTier = new Map<1 | 2 | 3 | 4 | 5, CarryNeutralItemHistoryEntry>()

  for (const entry of neutralItemHistory ?? []) {
    const minute = round(entry.time / 60, 1)
    const tier = resolveNeutralTier(minute)
    if (byTier.has(tier)) continue

    const itemKey = entry.item_neutral
    const enhancementKey = normalizeIconName(entry.item_neutral_enhancement)
    byTier.set(tier, {
      tier,
      itemKey,
      itemName: titleCaseFromKey(itemKey),
      iconUrl: itemIconUrl(itemKey),
      acquiredMinute: minute,
      enhancementKey,
      enhancementName: enhancementKey ? titleCaseFromKey(enhancementKey) : null,
    })
  }

  return [1, 2, 3, 4, 5]
    .map((tier) => byTier.get(tier as 1 | 2 | 3 | 4 | 5))
    .filter((entry): entry is CarryNeutralItemHistoryEntry => Boolean(entry))
}

function resolveItemById(constants: ResolvedItemConstant[], itemId: number): ResolvedItemConstant | null {
  return constants.find((entry) => entry.id === itemId) ?? null
}

function pickBenchmarkValue(values: z.infer<typeof benchmarkValueSchema>[], target: 95 | 99): number {
  const sorted = [...values].sort((a, b) => a.percentile - b.percentile)
  return sorted.find((entry) => entry.percentile >= target)?.value ?? sorted.at(-1)?.value ?? 0
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function buildMetric(
  key: CarryComparisonMetric['key'],
  label: string,
  userValue: number,
  proValue: number,
  percentile: 95 | 99,
): CarryComparisonMetric {
  const ratio = proValue > 0 ? userValue / proValue : 1

  return {
    key,
    label,
    value: round(userValue),
    benchmark: round(proValue),
    percentile,
    ratio: round(ratio, 3),
  }
}

function compareItemTimings(
  heroId: number,
  purchaseLog: z.infer<typeof openDotaPurchaseLogSchema>[],
  itemConstants: ResolvedItemConstant[],
): CarryItemTimingComparison[] {
  const timings = CORE_ITEM_TIMINGS_BY_HERO[heroId] ?? DEFAULT_CORE_TIMINGS
  const hasPurchaseLog = purchaseLog.length > 0

  return Object.entries(timings).map(([itemKey, target]) => {
    const purchase = purchaseLog.find((entry) => entry.key === itemKey)
    const userMinute = purchase ? round(purchase.time / 60) : null
    const differenceMinutes = userMinute === null ? null : round(userMinute - target.optimalMinute)
    const status =
      !hasPurchaseLog
        ? 'snapshot'
        : userMinute === null
          ? 'missing'
          : userMinute <= target.optimalMinute + target.graceMinutes
            ? 'on_time'
            : 'late'

    const resolvedItem = resolveItemByKey(itemConstants, itemKey)

    return {
      itemKey,
      itemName: target.label,
      iconUrl: resolvedItem?.iconUrl ?? itemIconUrl(resolvedItem?.key ?? itemKey),
      userMinute,
      proMinute: target.optimalMinute,
      differenceMinutes,
      status,
    }
  })
}

function buildPurchaseTrail(
  player: z.infer<typeof openDotaMatchPlayerSchema>,
  itemConstants: ResolvedItemConstant[],
): CarryPurchaseTrailEntry[] {
  const purchaseLog = player.purchase_log ?? []
  if (purchaseLog.length > 0) {
    return purchaseLog.slice(0, 18).map((entry) => {
      const resolved = resolveItemByKey(itemConstants, entry.key)
      const itemKey = resolved?.key ?? entry.key
      return {
        timeMinute: round(entry.time / 60, 1),
        itemKey,
        itemName: resolved?.dname ?? titleCaseFromKey(entry.key),
        iconUrl: resolved?.iconUrl ?? itemIconUrl(itemKey),
        slotLabel: null,
        description: resolved?.dname ?? titleCaseFromKey(entry.key),
      }
    })
  }

  const snapshotSlots: Array<{ key: 'item_0' | 'item_1' | 'item_2' | 'item_3' | 'item_4' | 'item_5' | 'backpack_0' | 'backpack_1' | 'backpack_2'; label: string }> = [
    { key: 'item_0', label: 'Slot 1' },
    { key: 'item_1', label: 'Slot 2' },
    { key: 'item_2', label: 'Slot 3' },
    { key: 'item_3', label: 'Slot 4' },
    { key: 'item_4', label: 'Slot 5' },
    { key: 'item_5', label: 'Slot 6' },
    { key: 'backpack_0', label: 'Backpack 1' },
    { key: 'backpack_1', label: 'Backpack 2' },
    { key: 'backpack_2', label: 'Backpack 3' },
  ]

  const neutralIds = [
    { value: player.item_neutral, label: 'Neutral' },
    { value: player.item_neutral2, label: 'Neutral Swap' },
  ]

  const entries = snapshotSlots
    .map(({ key, label }) => {
      const itemId = player[key]
      if (!itemId) return null
      const resolved = resolveItemById(itemConstants, itemId)
      if (!resolved) return null
      return {
        timeMinute: null,
        itemKey: resolved.key,
        itemName: resolved.dname,
        iconUrl: resolved.iconUrl,
        slotLabel: label,
        description: resolved.dname,
      }
    })
    .filter(Boolean) as CarryPurchaseTrailEntry[]

  for (const neutral of neutralIds) {
    if (!neutral.value) continue
    const resolved = resolveItemById(itemConstants, neutral.value)
    if (!resolved) continue
    entries.push({
      timeMinute: null,
      itemKey: resolved.key,
      itemName: resolved.dname,
      iconUrl: resolved.iconUrl,
      slotLabel: neutral.label,
      description: resolved.dname,
    })
  }

  return entries
}

// ============================================================================
// LOGICA DE DETECCIÓN DE POSICIÓN (OPTIMIZADA PARA SOPORTES PUROS)
// ============================================================================
function detectPosition(player: z.infer<typeof openDotaMatchPlayerSchema>, allPlayers: z.infer<typeof openDotaMatchPlayerSchema>[]): 1 | 2 | 3 | 4 | 5 {
  const isRadiant = player.player_slot !== undefined ? player.player_slot < 128 : (player.isRadiant ?? true)
  const teammates = allPlayers.filter((p) => {
    const pIsRadiant = p.player_slot !== undefined ? p.player_slot < 128 : (p.isRadiant ?? true)
    return pIsRadiant === isRadiant
  })

  const sortedByNw = [...teammates].sort((a, b) => (b.net_worth || 0) - (a.net_worth || 0))
  const nwRank = sortedByNw.findIndex((p) => p.hero_id === player.hero_id) + 1

  // Caso especial: Soportes puros que la API confunde por líneas rotas (27 = Shadow Shaman)
  const PURE_SUPPORTS = [27];
  if (PURE_SUPPORTS.includes(player.hero_id)) {
    if (player.lane_role === 2) return 2 // Mid explícito
    if (player.lane_role === 1 && nwRank <= 2) return 1 // Carry no convencional con mucho farm

    // Aislar la pareja de soportes reales ordenados por Net Worth
    const supports = teammates.filter(p => p.lane_role !== 2 && !(p.lane_role === 1 && sortedByNw.findIndex(c => c.hero_id === p.hero_id) < 2));
    const sortedSupports = [...supports].sort((a, b) => (b.net_worth || 0) - (a.net_worth || 0));
    const supportNwRank = sortedSupports.findIndex(p => p.hero_id === player.hero_id);

    return supportNwRank === 0 ? 5 : 4 // El de menos oro es Hard Support (5), el otro Soft Support (4)
  }

  if (player.lane_role === 2) return 2
  if (player.lane_role === 1) return nwRank <= 2 ? 1 : 5
  if (player.lane_role === 3) return nwRank <= 3 ? 3 : 4

  return (nwRank > 5 ? 5 : nwRank || 5) as 1 | 2 | 3 | 4 | 5
}

// ============================================================================
// MOTOR MODULAR DE MÉTRICAS POR ROL (CARRY, MID, OFFLANE, SUPPORTS)
// ============================================================================
function computeRoleMetrics(
  position: 1 | 2 | 3 | 4 | 5,
  player: z.infer<typeof openDotaMatchPlayerSchema>,
  benchmarks: z.infer<typeof openDotaBenchmarksSchema>,
  percentile: 95 | 99,
  durationMinutes: number
): CarryComparisonMetric[] {

  // Extraer valores base del benchmark de OpenDota
  const proGpm = pickBenchmarkValue(benchmarks.result.gold_per_min, percentile)
  const proLh10 = pickBenchmarkValue(benchmarks.result.last_hits_per_min, percentile) * 10
  const userLh10 = durationMinutes > 0 ? (player.last_hits / durationMinutes) * 10 : 0
  const proXp = benchmarks.result.xp_per_min ? pickBenchmarkValue(benchmarks.result.xp_per_min, percentile) : player.xp_per_min
  const proHeroDamage = benchmarks.result.hero_damage_per_min ? pickBenchmarkValue(benchmarks.result.hero_damage_per_min, percentile) * durationMinutes : player.hero_damage
  const proTowerDamage = benchmarks.result.tower_damage ? pickBenchmarkValue(benchmarks.result.tower_damage, percentile) : player.tower_damage

  // Arreglo base con las métricas core compartidas
  const metrics: CarryComparisonMetric[] = [
    buildMetric('gold_per_min', 'GPM', player.gold_per_min, proGpm, percentile),
    buildMetric('xp_per_min', 'XPM', player.xp_per_min, proXp, percentile),
    buildMetric('last_hits_per_10', 'LH/10', userLh10, proLh10, percentile),
    buildMetric('hero_damage', 'Hero Damage', player.hero_damage, proHeroDamage, percentile),
    buildMetric('tower_damage', 'Tower Damage', player.tower_damage, proTowerDamage, percentile),
  ]

  // Inyección de métricas específicas para Soportes (Pos 4 y 5)
  if (position === 4 || position === 5) {
    const proAssistsStandard = position === 4 ? 14 : 12

    metrics.push(
      buildMetric('assists', 'Assists', player.assists, proAssistsStandard, percentile),
      buildMetric('observer_wards_placed', 'Observer Wards', player.obs_placed || 0, position === 5 ? 8 : 5, percentile),
      buildMetric('sentry_wards_placed', 'Sentry Wards', player.sen_placed || 0, position === 5 ? 8 : 5, percentile),
    )
  }

  return metrics
}

// ============================================================================
// ORQUESTRADOR PRINCIPAL REFACTORIZADO Y CORREGIDO
// ============================================================================
export function compareCarryPerformance(params: {
  accountId: number
  match: z.infer<typeof openDotaMatchSchema>
  player: z.infer<typeof openDotaMatchPlayerSchema>
  benchmarks: z.infer<typeof openDotaBenchmarksSchema>
  skillBuild?: CarrySkillBuildEntry[]
  heroName?: string | null
  heroAbilityData?: Record<string, HeroAbilityMetadata>
  itemConstants?: ResolvedItemConstant[]
  percentile?: 95 | 99
}): CarryComparisonResponse {
  const percentile = params.percentile ?? 95
  const durationMinutes = params.match.duration / 60
  const position = detectPosition(params.player, params.match.players)
  const roleMeta = ROLE_METADATA[position] || ROLE_METADATA[1]
  const itemConstants = params.itemConstants ?? []

  // 1. Ejecutar el nuevo motor modular de métricas
  const metrics = computeRoleMetrics(position, params.player, params.benchmarks, percentile, durationMinutes)

  // 2. Calcular los tiempos de los items clave usando la constante limpia
  const itemTimings = compareItemTimings(params.player.hero_id, params.player.purchase_log, itemConstants)

  // Extraer ratios para el cálculo del score de eficiencia general
  const gpmMetric = metrics.find(m => m.key === 'gold_per_min')!
  const lh10Metric = metrics.find(m => m.key === 'last_hits_per_10')!
  const gpmRatio = gpmMetric.ratio
  const lh10Ratio = lh10Metric.ratio

  const deathsBeforeMinute10 = params.player.deaths_log.filter((death) => death.time <= 600).length
  const scenario: CarryComparisonResponse['scenario'] = deathsBeforeMinute10 > 2 ? 'comeback' : 'stomp'

  // Algoritmo de Score balanceado
  const timingPenalty = itemTimings.some((timing) => timing.status !== 'on_time') ? 0.08 : 0
  const score = Math.max(0, Math.min(1, (gpmRatio * 0.55) + (lh10Ratio * 0.35) + ((1 - timingPenalty) * 0.1)))

  // Validación de cumplimiento del rol
  const fulfilledRole = gpmRatio >= 0.75 && (position >= 4 || lh10Ratio >= 0.75) && itemTimings.every((timing) => timing.status !== 'missing')
  const feedback = gpmRatio < 0.75 ? roleMeta.feedback_fail : roleMeta.feedback_ok

  return {
    account_id: params.accountId,
    match_id: params.match.match_id,
    hero_id: params.player.hero_id,
    benchmark_percentile: percentile,
    scenario,
    fulfilled_role: fulfilledRole,
    role_info: {
      position,
      label: roleMeta.label,
      title: roleMeta.title,
    },
    efficiency_gap: {
      score: round(score, 3),
      gpmRatio: round(gpmRatio, 3),
      lh10Ratio: round(lh10Ratio, 3),
      feedback,
    },
    metrics,
    item_timings: itemTimings, // Asignado de forma limpia
    purchase_trail: buildPurchaseTrail(params.player, itemConstants),
    progression: {
      skill_build: params.skillBuild ?? [],
      talents: buildTalentChoices(params.skillBuild ?? [], params.heroName ?? null, params.heroAbilityData ?? {}),
      neutral_items: buildNeutralItems(params.player.neutral_item_history),
    },
    hero_name: params.heroName ?? null,
    raw_user: {
      kills: params.player.kills,
      deaths: params.player.deaths,
      assists: params.player.assists,
      gold_per_min: params.player.gold_per_min,
      xp_per_min: params.player.xp_per_min,
      last_hits: params.player.last_hits,
      net_worth: params.player.net_worth ?? null,
      hero_damage: params.player.hero_damage,
      tower_damage: params.player.tower_damage,
      ability_upgrades_arr: params.player.ability_upgrades_arr,
      neutral_item_history: params.player.neutral_item_history,
      purchase_log: params.player.purchase_log,
    },
  }
}

export async function getCarryComparison(params: {
  accountId: number
  matchId: number
  heroId: number
  percentile?: 95 | 99
}): Promise<CarryComparisonResponse> {
  const percentile = params.percentile ?? 95
  const match = openDotaMatchSchema.parse(await getMatchDetails(params.matchId))

  if (match.match_id !== params.matchId) {
    throw new Error('OpenDota match payload did not match the requested matchId.')
  }

  const player = match.players.find((entry) => entry.account_id === params.accountId)

  if (!player) {
    throw new Error('The account was not found in the parsed OpenDota match payload.')
  }

  if (player.hero_id !== params.heroId) {
    throw new Error('The requested heroId does not match the hero used in the selected match.')
  }

  const benchmarks = openDotaBenchmarksSchema.parse(await getHeroBenchmarks(params.heroId))
  const abilityConstants = await loadAbilityConstants()
  const abilityIds = await loadAbilityIds()
  const heroAbilityData = await loadHeroAbilityData()
  const heroes = openDotaHeroesSchema.parse(await getHeroes())
  const itemConstants = openDotaItemsSchema.parse(await getItems()) as Record<string, z.infer<typeof openDotaItemSchema>>
  const resolvedItemConstants = Object.entries(itemConstants).map(([key, value]) => ({
    id: value.id,
    key,
    dname: value.dname?.trim() || titleCaseFromKey(key),
    iconUrl: toCdnImageUrl(value.img) ?? itemIconUrl(key),
  }))
  const heroName = heroes.find((entry) => entry.id === params.heroId)?.name ?? null
  const skillBuild = buildSkillProgression(player.ability_upgrades_arr, abilityConstants, abilityIds, heroName, heroAbilityData)

  return compareCarryPerformance({
    accountId: params.accountId,
    match,
    player,
    benchmarks,
    skillBuild,
    heroName,
    heroAbilityData,
    itemConstants: resolvedItemConstants,
    percentile,
  })
}