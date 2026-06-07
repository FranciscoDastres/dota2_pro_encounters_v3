import { AsyncTtlCache } from './asyncTtlCache.service'
import {
  openDotaHeroRankingsSchema,
  openDotaMatchSchema,
  openDotaPatchesSchema,
  openDotaReferenceMatchesSchema,
  type OpenDotaPatch,
  type OpenDotaRankedPlayer,
  type OpenDotaReferenceMatch,
} from './carryComparison.schemas'
import type {
  CarryPurchaseTrailEntry,
  RankedPurchaseComparison,
  RankedPurchaseReference,
  ResolvedItemConstant,
} from './carryComparison.types'
import { buildPurchaseTrail } from './carryProgression.service'
import { round } from './carryMetrics.service'
import {
  getHeroRankings,
  getMatchDetails,
  getPatches,
  getPlayerMatchesByHeroPatch,
} from './openDota.service'

const REFERENCE_CACHE_TTL_MS = 6 * 60 * 60 * 1000
const EMPTY_REFERENCE_TTL_MS = 30 * 60 * 1000
const PATCH_LIMIT = 3
const CANDIDATE_LIMIT = 8
const CANDIDATE_BATCH_SIZE = 4
const MATCHES_PER_CANDIDATE = 3
const DETAILS_PER_BATCH = 8
const RECENT_WINDOW_SECONDS = 14 * 24 * 60 * 60

const referenceCache = new AsyncTtlCache<string, RankedPurchaseReference | null>(
  REFERENCE_CACHE_TTL_MS,
  200,
)

interface CandidateMatch {
  player: OpenDotaRankedPlayer
  playerOrder: number
  match: OpenDotaReferenceMatch
  patch: OpenDotaPatch
  withinLast14Days: boolean
}

export function clearHeroPurchaseReferenceCache(): void {
  referenceCache.clear()
}

function lastTimedPurchaseByKey(
  purchaseTrail: CarryPurchaseTrailEntry[],
): Map<string, CarryPurchaseTrailEntry & { timeMinute: number }> {
  const purchases = new Map<string, CarryPurchaseTrailEntry & { timeMinute: number }>()
  for (const entry of purchaseTrail) {
    if (entry.timeMinute === null) continue
    purchases.set(entry.itemKey, { ...entry, timeMinute: entry.timeMinute })
  }
  return purchases
}

export function compareRankedPurchaseTrails(
  userTrail: CarryPurchaseTrailEntry[],
  reference: RankedPurchaseReference | null,
  itemConstants: ResolvedItemConstant[],
): RankedPurchaseComparison | null {
  if (!reference) return null

  const completedItemKeys = new Set(
    itemConstants
      .filter((item) => item.components.length > 0 && !item.key.startsWith('recipe_'))
      .map((item) => item.key),
  )
  const userPurchases = lastTimedPurchaseByKey(userTrail)
  const referencePurchases = lastTimedPurchaseByKey(reference.purchaseTrail)
  const items = [...referencePurchases.values()]
    .filter((entry) => completedItemKeys.has(entry.itemKey))
    .map((entry) => {
      const userEntry = userPurchases.get(entry.itemKey)
      const differenceMinutes = userEntry
        ? round(userEntry.timeMinute - entry.timeMinute, 1)
        : null
      const status =
        differenceMinutes === null
          ? 'missing'
          : differenceMinutes < -2
            ? 'ahead'
            : differenceMinutes > 2
              ? 'behind'
              : 'close'

      return {
        itemKey: entry.itemKey,
        itemName: entry.itemName,
        iconUrl: entry.iconUrl,
        userMinute: userEntry?.timeMinute ?? null,
        referenceMinute: entry.timeMinute,
        differenceMinutes,
        status,
      } as const
    })

  const aheadCount = items.filter((item) => item.status === 'ahead').length
  const closeCount = items.filter((item) => item.status === 'close').length
  const behindCount = items.filter((item) => item.status === 'behind').length
  const missingCount = items.filter((item) => item.status === 'missing').length
  const matchedCount = aheadCount + closeCount + behindCount
  const evaluationStatus =
    matchedCount === 0
      ? 'insufficient'
      : behindCount + missingCount > aheadCount + closeCount
        ? 'behind'
        : aheadCount > behindCount
          ? 'ahead'
          : 'close'
  const summary = {
    ahead: 'Tu progresión de ítems fue más rápida que la referencia en la mayoría de los timings comparables.',
    close: 'Tu progresión estuvo cerca de la referencia; hay algunos timings puntuales que puedes ajustar.',
    behind: 'Tu build llegó más tarde o quedó incompleta frente a esta referencia de alto nivel.',
    insufficient: 'No hay suficientes ítems completados en común para evaluar los timings con confianza.',
  }[evaluationStatus]
  const improvements = items
    .filter((item) => item.status === 'behind' || item.status === 'missing')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'missing' ? -1 : 1
      return (b.differenceMinutes ?? 0) - (a.differenceMinutes ?? 0)
    })
    .slice(0, 3)
    .map((item) => (
      item.status === 'missing'
        ? `Revisa si ${item.itemName} encajaba en tu partida; la referencia lo completó al ${item.referenceMinute.toFixed(1)}m.`
        : `Intenta adelantar ${item.itemName}: llegó ${item.differenceMinutes?.toFixed(1)}m después que la referencia.`
    ))

  if (improvements.length === 0 && items.length > 0) {
    improvements.push('Mantén este ritmo y revisa si puedes convertir tus timings rápidos en objetivos y presión de mapa.')
  }

  return {
    items,
    evaluation: {
      status: evaluationStatus,
      summary,
      improvements,
      aheadCount,
      closeCount,
      behindCount,
      missingCount,
    },
  }
}

function rankedCandidates(rankings: OpenDotaRankedPlayer[]): OpenDotaRankedPlayer[] {
  const knownPros = rankings.filter((entry) => Boolean(entry.name))
  const otherTopPlayers = rankings.filter((entry) => !entry.name)
  return [...knownPros, ...otherTopPlayers].slice(0, CANDIDATE_LIMIT)
}

function candidateName(player: OpenDotaRankedPlayer): string {
  return player.name?.trim() || player.personaname?.trim() || `Player #${player.account_id}`
}

function compareCandidateMatches(a: CandidateMatch, b: CandidateMatch): number {
  if (a.withinLast14Days !== b.withinLast14Days) {
    return a.withinLast14Days ? -1 : 1
  }
  if (a.playerOrder !== b.playerOrder) return a.playerOrder - b.playerOrder
  return b.match.start_time - a.match.start_time
}

async function findParsedReference(
  candidates: CandidateMatch[],
  heroId: number,
  itemConstants: ResolvedItemConstant[],
): Promise<RankedPurchaseReference | null> {
  for (const candidate of candidates.slice(0, DETAILS_PER_BATCH)) {
    try {
      const match = openDotaMatchSchema.parse(await getMatchDetails(candidate.match.match_id))
      const player = match.players.find((entry) => (
        entry.account_id === candidate.player.account_id &&
        entry.hero_id === heroId
      ))
      if (!player || player.purchase_log.length === 0) continue

      return {
        accountId: candidate.player.account_id,
        playerName: candidateName(candidate.player),
        rankingScore: candidate.player.score,
        rankTier: candidate.player.rank_tier,
        matchId: match.match_id,
        startTime: match.start_time || candidate.match.start_time,
        patchId: candidate.patch.id,
        patchName: candidate.patch.name,
        withinLast14Days: candidate.withinLast14Days,
        purchaseTrail: buildPurchaseTrail(player, itemConstants),
      }
    } catch {
      // Reference data is optional; continue with the next ranked match.
    }
  }

  return null
}

export function getHeroPurchaseReference(
  heroId: number,
  itemConstants: ResolvedItemConstant[],
): Promise<RankedPurchaseReference | null> {
  const cacheKey = `${heroId}`

  return referenceCache.getOrLoad(cacheKey, async () => {
    const [rankingsPayload, patchesPayload] = await Promise.all([
      getHeroRankings(heroId),
      getPatches(),
    ])
    const rankings = openDotaHeroRankingsSchema.parse(rankingsPayload)
    const patches = openDotaPatchesSchema.parse(patchesPayload)
      .sort((a, b) => b.id - a.id)
      .slice(0, PATCH_LIMIT)
    const candidates = rankedCandidates(rankings.rankings)
    const recentCutoff = Math.floor(Date.now() / 1000) - RECENT_WINDOW_SECONDS

    for (const patch of patches) {
      for (let offset = 0; offset < candidates.length; offset += CANDIDATE_BATCH_SIZE) {
        const batch = candidates.slice(offset, offset + CANDIDATE_BATCH_SIZE)
        const histories = await Promise.allSettled(
          batch.map((player) => getPlayerMatchesByHeroPatch(
            player.account_id,
            heroId,
            patch.id,
            MATCHES_PER_CANDIDATE,
          )),
        )
        const candidateMatches = histories.flatMap((result, batchIndex) => {
          if (result.status === 'rejected') return []
          const matches = openDotaReferenceMatchesSchema.parse(result.value)
          return matches.map((match) => ({
            player: batch[batchIndex],
            playerOrder: offset + batchIndex,
            match,
            patch,
            withinLast14Days: match.start_time >= recentCutoff,
          }))
        }).sort(compareCandidateMatches)

        const reference = await findParsedReference(candidateMatches, heroId, itemConstants)
        if (reference) return reference
      }
    }

    return null
  }, (reference) => reference ? REFERENCE_CACHE_TTL_MS : EMPTY_REFERENCE_TTL_MS)
}
