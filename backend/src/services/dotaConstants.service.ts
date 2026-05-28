import { z } from 'zod'
import {
  getAbilityConstants,
  getAbilityIds,
  getHeroAbilityData,
  getItems,
} from './openDota.service'
import {
  openDotaAbilityConstantsSchema,
  type OpenDotaItem,
  openDotaItemsSchema,
} from './carryComparison.schemas'
import type {
  HeroAbilityMetadata,
  ResolvedAbilityConstant,
  ResolvedItemConstant,
} from './carryComparison.types'
import {
  abilityIconUrl,
  itemIconUrl,
  titleCaseFromKey,
  toCdnImageUrl,
} from './dotaAssetUtils'

let abilityConstantsCache: ResolvedAbilityConstant[] | null = null
let abilityConstantsPromise: Promise<ResolvedAbilityConstant[]> | null = null
let abilityIdsCache: Record<string, string> | null = null
let abilityIdsPromise: Promise<Record<string, string>> | null = null
let heroAbilityDataCache: Record<string, HeroAbilityMetadata> | null = null
let heroAbilityDataPromise: Promise<Record<string, HeroAbilityMetadata>> | null = null
let itemConstantsCache: ResolvedItemConstant[] | null = null
let itemConstantsPromise: Promise<ResolvedItemConstant[]> | null = null

export function clearDotaConstantsCaches(): void {
  abilityConstantsCache = null
  abilityConstantsPromise = null
  abilityIdsCache = null
  abilityIdsPromise = null
  heroAbilityDataCache = null
  heroAbilityDataPromise = null
  itemConstantsCache = null
  itemConstantsPromise = null
}

function cleanItemText(value: string | null | undefined): string | null {
  const cleaned = value
    ?.replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || null
}

function itemAttributeLabel(attribute: NonNullable<OpenDotaItem['attrib']>[number]): string | null {
  const rawValue = Array.isArray(attribute.value)
    ? attribute.value.join('/')
    : attribute.value
  const value = rawValue === undefined || rawValue === false ? null : String(rawValue)
  if (attribute.display) {
    return cleanItemText(attribute.display.replace('{value}', value ?? ''))
  }
  if (!attribute.key || !value) return null
  return `${titleCaseFromKey(attribute.key)}: ${value}`
}

function buildItemDescription(item: OpenDotaItem): string | null {
  const ability = item.abilities
    ?.map((entry) => {
      const description = cleanItemText(entry.description)
      if (!description) return null
      const title = cleanItemText(entry.title)
      return title ? `${title}: ${description}` : description
    })
    .find((entry): entry is string => Boolean(entry))
  const attributes = item.attrib
    ?.map(itemAttributeLabel)
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 4)
  const notes = cleanItemText(item.notes)
  const lore = cleanItemText(item.lore)
  const parts = [
    ability,
    attributes && attributes.length > 0 ? attributes.join(' · ') : null,
    notes,
    lore,
  ].filter((entry): entry is string => Boolean(entry))

  return parts.length > 0 ? parts.join('\n') : null
}

export async function loadAbilityConstants(): Promise<ResolvedAbilityConstant[]> {
  if (abilityConstantsCache) return abilityConstantsCache
  if (!abilityConstantsPromise) {
    abilityConstantsPromise = getAbilityConstants()
      .then((payload) => {
        const parsed = openDotaAbilityConstantsSchema.parse(payload)
        const resolved = Object.entries(parsed).map(([key, value]) => {
          const dname = value.dname?.trim() || titleCaseFromKey(key)
          return {
            key,
            dname,
            iconUrl: toCdnImageUrl(value.img) ?? abilityIconUrl(key),
            isTalent: key.startsWith('special_bonus_'),
          }
        })
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

export async function loadAbilityIds(): Promise<Record<string, string>> {
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

export async function loadHeroAbilityData(): Promise<Record<string, HeroAbilityMetadata>> {
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

export async function loadItemConstants(): Promise<ResolvedItemConstant[]> {
  if (itemConstantsCache) return itemConstantsCache
  if (!itemConstantsPromise) {
    itemConstantsPromise = getItems()
      .then((payload) => {
        const itemConstants = openDotaItemsSchema.parse(payload)
        const resolved = Object.entries(itemConstants).map(([key, value]) => ({
          id: value.id,
          key,
          dname: value.dname?.trim() || titleCaseFromKey(key),
          iconUrl: toCdnImageUrl(value.img) ?? itemIconUrl(key),
          description: buildItemDescription(value),
          components: value.components ?? [],
        }))
        itemConstantsCache = resolved
        itemConstantsPromise = null
        return resolved
      })
      .catch((err) => {
        itemConstantsPromise = null
        throw err
      })
  }
  return itemConstantsPromise
}
