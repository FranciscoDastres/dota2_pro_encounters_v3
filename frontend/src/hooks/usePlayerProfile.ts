import { useState, useEffect } from 'react'

interface OpenDotaPlayerResponse {
  rank_tier: number | null
  profile: {
    account_id: number
    personaname: string
    avatarfull: string
    profileurl: string
    loccountrycode: string | null
  } | null
}

interface HeroStat {
  hero_id: number
  games: number
  win: number
  last_played: number
}

export interface RecentMatch {
  match_id: number
  player_slot: number
  radiant_win: boolean
  hero_id: number
  start_time: number
  duration: number
  kills: number
  deaths: number
  assists: number
}

export interface TopHero {
  heroId: number
  games: number
  wins: number
  winRate: number
}

export interface PlayerProfileData {
  personaname: string
  avatarfull: string
  profileurl: string
  rankTier: number | null
  countryCode: string | null
  totalGames: number
  totalWins: number
  topHeroes: TopHero[]
  recentMatches: RecentMatch[]
}

const OPENDOTA = 'https://api.opendota.com/api'
const CACHE_PREFIX = 'dota2_profile_v4_'
const CACHE_TTL = 30 * 60 * 1000 // 30 min

function loadProfileCache(accountId: number): PlayerProfileData | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + accountId)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as { data: PlayerProfileData; ts: number }
    return Date.now() - ts < CACHE_TTL ? data : null
  } catch {
    return null
  }
}

function saveProfileCache(accountId: number, data: PlayerProfileData) {
  try {
    localStorage.setItem(CACHE_PREFIX + accountId, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore quota errors */ }
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export function usePlayerProfile(accountId: number | null) {
  const [data, setData] = useState<PlayerProfileData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!accountId) { setData(null); return }

    const cached = loadProfileCache(accountId)
    if (cached) { setData(cached); return }

    let cancelled = false
    setLoading(true)
    setData(null)

    Promise.allSettled([
      get<OpenDotaPlayerResponse>(`${OPENDOTA}/players/${accountId}`),
      get<HeroStat[]>(`${OPENDOTA}/players/${accountId}/heroes`),
      get<RecentMatch[]>(`${OPENDOTA}/players/${accountId}/recentMatches`),
    ]).then(([playerRes, heroRes, recentRes]) => {
      if (cancelled) return

      if (playerRes.status === 'rejected') return
      const player = playerRes.value
      if (!player.profile) return

      const heroStats: HeroStat[] = heroRes.status === 'fulfilled' ? heroRes.value : []
      const recentMatches: RecentMatch[] = recentRes.status === 'fulfilled' ? recentRes.value : []

      const eligible = heroStats.filter(h => h.games >= 20)
      const topHeroes: TopHero[] = eligible
        .sort((a, b) => {
          const gamesDiff = b.games - a.games
          if (gamesDiff !== 0) return gamesDiff

          const winRateDiff = (b.win / b.games) - (a.win / a.games)
          if (winRateDiff !== 0) return winRateDiff

          return b.win - a.win
        })
        .slice(0, 3)
        .map(h => ({ heroId: h.hero_id, games: h.games, wins: h.win, winRate: h.win / h.games }))

      const totalGames = heroStats.reduce((s, h) => s + h.games, 0)
      const totalWins = heroStats.reduce((s, h) => s + h.win, 0)

      const profile: PlayerProfileData = {
        personaname: player.profile.personaname,
        avatarfull: player.profile.avatarfull,
        profileurl: player.profile.profileurl,
        rankTier: player.rank_tier,
        countryCode: player.profile.loccountrycode,
        totalGames,
        totalWins,
        topHeroes,
        recentMatches: recentMatches.slice(0, 5),
      }
      saveProfileCache(accountId, profile)
      setData(profile)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [accountId])

  return { data, loading }
}

