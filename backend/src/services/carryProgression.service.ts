import { CORE_ITEM_TIMINGS_BY_HERO, DEFAULT_CORE_TIMINGS } from './carryComparison.constants'
import type {
  OpenDotaMatchPlayer,
  OpenDotaNeutralItemHistory,
  OpenDotaPurchaseLog,
} from './carryComparison.schemas'
import type {
  CarryItemTimingComparison,
  CarryNeutralItemHistoryEntry,
  CarryPurchaseTrailEntry,
  CarrySkillBuildEntry,
  CarryTalentChoice,
  CarryTalentOption,
  HeroAbilityMetadata,
  ResolvedAbilityConstant,
  ResolvedItemConstant,
} from './carryComparison.types'
import { round } from './carryMetrics.service'
import {
  abilityIconUrl,
  humanizeTalentName,
  itemIconUrl,
  normalizeIconName,
  titleCaseFromKey,
} from './dotaAssetUtils'

function resolveAbilityByKey(constants: ResolvedAbilityConstant[], abilityKey: string): ResolvedAbilityConstant | null {
  return constants.find((entry) => entry.key === abilityKey) ?? null
}

function canonicalItemKey(itemKey: string): string {
  const aliases: Record<string, string> = {
    battle_fury: 'bfury',
    battlefury: 'bfury',
    shadow_blade: 'invis_sword',
    shadow_sb: 'invis_sword',
  }
  return aliases[itemKey] ?? itemKey
}

function resolveItemByKey(constants: ResolvedItemConstant[], itemKey: string): ResolvedItemConstant | null {
  const lookup = canonicalItemKey(itemKey)
  return constants.find((entry) => entry.key === lookup) ?? null
}

function sameItemKey(left: string, right: string): boolean {
  return canonicalItemKey(left) === canonicalItemKey(right)
}

function resolveItemById(constants: ResolvedItemConstant[], itemId: number): ResolvedItemConstant | null {
  return constants.find((entry) => entry.id === itemId) ?? null
}

function resolveNeutralTier(minute: number): 1 | 2 | 3 | 4 | 5 {
  if (minute < 12) return 1
  if (minute < 22) return 2
  if (minute < 32) return 3
  if (minute < 45) return 4
  return 5
}

export function buildSkillProgression(
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

export function buildTalentChoices(
  skillBuild: CarrySkillBuildEntry[],
  heroName: string | null,
  heroAbilityData: Record<string, HeroAbilityMetadata>,
  abilityConstants: ResolvedAbilityConstant[] = [],
): CarryTalentChoice[] {
  const tierLevels: Array<10 | 15 | 20 | 25> = [10, 15, 20, 25]
  const heroAbilities = heroName ? heroAbilityData[heroName] ?? null : null
  const talentPairs = heroAbilities?.talents ?? []
  const knownTalentKeys = new Set(talentPairs.map((talent) => talent.name))
  const talentEntries = skillBuild.filter((entry) =>
    entry.isTalent &&
    (entry.abilityKey.startsWith('special_bonus_') || knownTalentKeys.has(entry.abilityKey)),
  )
  const usedTalentEntryIndexes = new Set<number>()

  function resolveTalentName(abilityKey: string, fallback?: string): string {
    const resolved = resolveAbilityByKey(abilityConstants, abilityKey)
    return humanizeTalentName(abilityKey, resolved?.dname ?? fallback)
  }

  return tierLevels.map((level, index) => {
    const talentsForLevel = talentPairs.filter((talent) => talent.level === level)
    const talentPair = (talentsForLevel.length > 0 ? talentsForLevel : talentPairs.slice(index * 2, index * 2 + 2)).slice(0, 2)
    const matchedEntryIndex = talentPair.length > 0
      ? talentEntries.findIndex((talentEntry, talentEntryIndex) =>
        !usedTalentEntryIndexes.has(talentEntryIndex) &&
        talentPair.some((talent) => talent.name === talentEntry.abilityKey),
      )
      : -1
    const fallbackEntryIndex = matchedEntryIndex === -1
      ? talentEntries.findIndex((_, talentEntryIndex) => !usedTalentEntryIndexes.has(talentEntryIndex))
      : -1
    const entryIndex = matchedEntryIndex !== -1 ? matchedEntryIndex : fallbackEntryIndex
    const entry = entryIndex === -1 ? undefined : talentEntries[entryIndex]
    if (entryIndex !== -1) usedTalentEntryIndexes.add(entryIndex)

    const selectedKey = entry?.abilityKey ?? null
    const options: CarryTalentOption[] = talentPair.map((talent, optionIndex) => ({
      abilityKey: talent.name,
      abilityName: resolveTalentName(talent.name),
      branch: optionIndex === 0 ? 'left' : 'right',
      selected: talent.name === selectedKey,
    }))
    if (entry && selectedKey && !options.some((option) => option.abilityKey === selectedKey)) {
      options.push({
        abilityKey: selectedKey,
        abilityName: resolveTalentName(selectedKey, entry.abilityName),
        branch: null,
        selected: true,
      })
    }

    const selectedOption = options.find((option) => option.selected) ?? null
    const alternate = selectedKey
      ? options.find((option) => option.abilityKey !== selectedKey) ?? null
      : null
    const branch = selectedOption?.branch ?? (talentPair.length === 2 && selectedKey
      ? (talentPair[0].name === selectedKey ? 'left' : 'right')
      : null
    )

    return {
      level,
      abilityId: entry?.abilityId ?? null,
      abilityKey: selectedKey,
      abilityName: selectedOption?.abilityName ?? (entry && selectedKey ? resolveTalentName(selectedKey, entry.abilityName) : `Talent ${level}`),
      iconUrl: entry?.iconUrl ?? '',
      branch,
      alternativeName: alternate?.abilityName ?? null,
      alternativeKey: alternate?.abilityKey ?? null,
      options,
    }
  })
}

export function buildNeutralItems(
  neutralItemHistory: OpenDotaNeutralItemHistory[] | undefined,
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

export function compareItemTimings(
  heroId: number,
  purchaseLog: OpenDotaPurchaseLog[],
  itemConstants: ResolvedItemConstant[],
): CarryItemTimingComparison[] {
  const timings = CORE_ITEM_TIMINGS_BY_HERO[heroId] ?? DEFAULT_CORE_TIMINGS
  const hasPurchaseLog = purchaseLog.length > 0

  return Object.entries(timings).map(([itemKey, target]) => {
    const purchase = purchaseLog.find((entry) => sameItemKey(entry.key, itemKey))
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
    const resolvedItemKey = resolvedItem?.key ?? canonicalItemKey(itemKey)

    return {
      itemKey: resolvedItemKey,
      itemName: target.label,
      iconUrl: resolvedItem?.iconUrl ?? itemIconUrl(resolvedItemKey),
      description: resolvedItem?.description ?? resolvedItem?.dname ?? target.label,
      userMinute,
      proMinute: target.optimalMinute,
      differenceMinutes,
      status,
    }
  })
}

export function buildPurchaseTrail(
  player: OpenDotaMatchPlayer,
  itemConstants: ResolvedItemConstant[],
): CarryPurchaseTrailEntry[] {
  const purchaseLog = player.purchase_log ?? []
  if (purchaseLog.length > 0) {
    return purchaseLog.slice(0, 18).map((entry) => {
      const resolved = resolveItemByKey(itemConstants, entry.key)
      const itemKey = resolved?.key ?? canonicalItemKey(entry.key)
      return {
        timeMinute: round(entry.time / 60, 1),
        itemKey,
        itemName: resolved?.dname ?? titleCaseFromKey(entry.key),
        iconUrl: resolved?.iconUrl ?? itemIconUrl(itemKey),
        slotLabel: null,
        description: resolved?.description ?? resolved?.dname ?? titleCaseFromKey(entry.key),
      }
    })
  }

  const snapshotSlots: Array<{
    key: 'item_0' | 'item_1' | 'item_2' | 'item_3' | 'item_4' | 'item_5' | 'backpack_0' | 'backpack_1' | 'backpack_2'
    label: string
  }> = [
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

  const entries: CarryPurchaseTrailEntry[] = snapshotSlots
    .map<CarryPurchaseTrailEntry | null>(({ key, label }) => {
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
        description: resolved.description ?? resolved.dname,
      }
    })
    .filter((entry): entry is CarryPurchaseTrailEntry => entry !== null)

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
      description: resolved.description ?? resolved.dname,
    })
  }

  return entries
}
