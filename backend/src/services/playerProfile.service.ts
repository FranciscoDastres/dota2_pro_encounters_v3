import { z } from 'zod'
import { AsyncTtlCache } from './asyncTtlCache.service'
import {
  getPlayerHeroes,
  getPlayerProfile,
  getRecentMatches,
} from './openDota.service'

const profilePayloadSchema = z.object({
  rank_tier: z.number().nullable().default(null),
  profile: z.object({
    account_id: z.number(),
    personaname: z.string(),
    avatarfull: z.string(),
    profileurl: z.string(),
    loccountrycode: z.string().nullable().default(null),
  }).nullable(),
})

const heroStatSchema = z.object({
  hero_id: z.number(),
  games: z.number().nonnegative(),
  win: z.number().nonnegative(),
})

const recentMatchSchema = z.object({
  match_id: z.number(),
  player_slot: z.number(),
  radiant_win: z.boolean(),
  hero_id: z.number(),
  start_time: z.number(),
  duration: z.number().nonnegative(),
  kills: z.number().nonnegative().default(0),
  deaths: z.number().nonnegative().default(0),
  assists: z.number().nonnegative().default(0),
})

export interface PlayerProfileData {
  personaname: string
  avatarfull: string
  profileurl: string
  rankTier: number | null
  countryCode: string | null
  totalGames: number
  totalWins: number
  topHeroes: Array<{
    heroId: number
    games: number
    wins: number
    winRate: number
  }>
  recentMatches: Array<z.infer<typeof recentMatchSchema>>
}

const profileCache = new AsyncTtlCache<number, PlayerProfileData | null>(15 * 60 * 1000, 2_000)

export function clearPlayerProfileCache(): void {
  profileCache.clear()
}

export function getPlayerProfileSummary(accountId: number): Promise<PlayerProfileData | null> {
  return profileCache.getOrLoad(accountId, async () => {
    const [playerResult, heroesResult, recentResult] = await Promise.allSettled([
      getPlayerProfile(accountId),
      getPlayerHeroes(accountId),
      getRecentMatches(accountId),
    ])

    if (playerResult.status === 'rejected') throw playerResult.reason

    const player = profilePayloadSchema.parse(playerResult.value)
    if (!player.profile) return null

    const heroStats = heroesResult.status === 'fulfilled'
      ? z.array(heroStatSchema).parse(heroesResult.value)
      : []
    const recentMatches = recentResult.status === 'fulfilled'
      ? z.array(recentMatchSchema).parse(recentResult.value)
      : []

    const topHeroes = heroStats
      .filter((hero) => hero.games >= 20)
      .sort((a, b) => {
        const gamesDiff = b.games - a.games
        if (gamesDiff !== 0) return gamesDiff

        const winRateDiff = (b.win / b.games) - (a.win / a.games)
        if (winRateDiff !== 0) return winRateDiff

        return b.win - a.win
      })
      .slice(0, 3)
      .map((hero) => ({
        heroId: hero.hero_id,
        games: hero.games,
        wins: hero.win,
        winRate: hero.win / hero.games,
      }))

    return {
      personaname: player.profile.personaname,
      avatarfull: player.profile.avatarfull,
      profileurl: player.profile.profileurl,
      rankTier: player.rank_tier,
      countryCode: player.profile.loccountrycode,
      totalGames: heroStats.reduce((sum, hero) => sum + hero.games, 0),
      totalWins: heroStats.reduce((sum, hero) => sum + hero.win, 0),
      topHeroes,
      recentMatches: recentMatches.slice(0, 5),
    }
  })
}
