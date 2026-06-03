import { useEffect, useState } from 'react'
import { fetchPlayerProfile } from '../services/api'
import type { PlayerProfileData } from '../types'

export type { PlayerProfileData, RecentMatch, TopHero } from '../types'

const CACHE_PREFIX = 'dota2_profile_v5_'
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

export function usePlayerProfile(accountId: number | null) {
  const [data, setData] = useState<PlayerProfileData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!accountId) {
      setData(null)
      setLoading(false)
      return
    }

    const cached = loadProfileCache(accountId)
    if (cached) {
      setData(cached)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setData(null)

    fetchPlayerProfile(accountId, controller.signal)
      .then((response) => {
        if (!response.profile) return
        saveProfileCache(accountId, response.profile)
        setData(response.profile)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        console.error('[player-profile]', err)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [accountId])

  return { data, loading }
}
