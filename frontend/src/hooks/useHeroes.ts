import { useState, useEffect } from 'react'

interface Hero {
  id: number
  name: string          // "npc_dota_hero_antimage"
  localized_name: string
}

export type HeroMap = Record<number, Hero>

const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com'
const CACHE_KEY = 'dota2_heroes_v1'
const CACHE_TTL = 24 * 60 * 60 * 1000

function loadCache(): HeroMap | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as { data: HeroMap; ts: number }
    return Date.now() - ts < CACHE_TTL ? data : null
  } catch {
    return null
  }
}

// Module-level singleton to avoid multiple in-flight fetches
let inflight: Promise<HeroMap> | null = null

function getHeroes(): Promise<HeroMap> {
  const cached = loadCache()
  if (cached) return Promise.resolve(cached)
  if (inflight) return inflight

  inflight = fetch('https://api.opendota.com/api/heroes', { signal: AbortSignal.timeout(8000) })
    .then(r => r.json() as Promise<Hero[]>)
    .then(heroes => {
      const map: HeroMap = {}
      for (const h of heroes) map[h.id] = h
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: map, ts: Date.now() }))
      } catch { /* ignore quota errors */ }
      inflight = null
      return map
    })
    .catch(() => {
      inflight = null
      return {} as HeroMap
    })

  return inflight
}

export function heroIconUrl(hero: Hero): string {
  const shortName = hero.name.replace('npc_dota_hero_', '')
  return `${STEAM_CDN}/apps/dota2/images/dota_react/heroes/icons/${shortName}.png`
}

export function useHeroes(): HeroMap {
  const [heroMap, setHeroMap] = useState<HeroMap>(() => loadCache() ?? {})

  useEffect(() => {
    if (Object.keys(heroMap).length > 0) return
    getHeroes().then(setHeroMap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return heroMap
}
