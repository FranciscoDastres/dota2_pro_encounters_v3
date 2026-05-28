import { z } from 'zod'

export const openDotaAbilityConstantSchema = z.object({
  id: z.number().optional(),
  dname: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
}).passthrough()

export const openDotaAbilityConstantsSchema = z.record(z.string(), openDotaAbilityConstantSchema)

export const openDotaHeroSchema = z.object({
  id: z.number(),
  name: z.string(),
  localized_name: z.string().optional(),
}).passthrough()

export const openDotaHeroesSchema = z.array(openDotaHeroSchema)

export const openDotaItemAbilitySchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
}).passthrough()

export const openDotaItemAttributeSchema = z.object({
  key: z.string().nullable().optional(),
  display: z.string().nullable().optional(),
  value: z.unknown().optional(),
}).passthrough()

export const openDotaItemSchema = z.object({
  id: z.number(),
  dname: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
  components: z.array(z.string()).nullable().optional(),
  abilities: z.array(openDotaItemAbilitySchema).nullable().optional(),
  attrib: z.array(openDotaItemAttributeSchema).nullable().optional(),
  notes: z.string().nullable().optional(),
  lore: z.string().nullable().optional(),
}).passthrough()

export const openDotaItemsSchema = z.record(z.string(), openDotaItemSchema)

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

const parsedNumberWithFallback = z.preprocess(
  (value) => value ?? undefined,
  z.number().nonnegative().default(0),
)

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
  hero_damage: parsedNumberWithFallback,
  tower_damage: parsedNumberWithFallback,
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

export const benchmarkValueSchema = z.object({
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

export type OpenDotaAbilityConstant = z.infer<typeof openDotaAbilityConstantSchema>
export type OpenDotaItem = z.infer<typeof openDotaItemSchema>
export type OpenDotaPurchaseLog = z.infer<typeof openDotaPurchaseLogSchema>
export type OpenDotaNeutralItemHistory = z.infer<typeof openDotaNeutralItemHistorySchema>
export type OpenDotaMatchPlayer = z.infer<typeof openDotaMatchPlayerSchema>
export type OpenDotaMatch = z.infer<typeof openDotaMatchSchema>
export type BenchmarkValue = z.infer<typeof benchmarkValueSchema>
export type OpenDotaBenchmarks = z.infer<typeof openDotaBenchmarksSchema>
