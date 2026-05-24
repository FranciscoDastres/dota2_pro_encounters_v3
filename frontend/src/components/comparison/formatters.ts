const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com'
const OPENDOTA_ASSETS = 'https://api.opendota.com'

export function heroCoverUrl(heroName: string | undefined | null): string {
  const short = (heroName ?? '').replace('npc_dota_hero_', '')
  return `${STEAM_CDN}/apps/dota2/images/dota_react/heroes/${short}.png`
}

export function itemIconUrl(itemKey: string): string {
  return `${STEAM_CDN}/apps/dota2/images/dota_react/items/${itemKey}.png`
}

export function itemIconFallbackUrls(itemKey: string): string[] {
  return [
    `${OPENDOTA_ASSETS}/apps/dota2/images/dota_react/items/${itemKey}.png`,
    itemIconUrl(itemKey),
    `${STEAM_CDN}/apps/dota2/images/items/${itemKey}_lg.png`,
    `${OPENDOTA_ASSETS}/apps/dota2/images/items/${itemKey}_lg.png`,
  ]
}

export function formatNumber(value: number): string {
  return Math.abs(value) >= 1000 ? Math.round(value).toLocaleString() : value.toLocaleString()
}

export function formatSigned(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatNumber(value)}`
}

export function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

export function formatTime(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)}m`
}

export function formatKda(kills: number, deaths: number, assists: number): string {
  const safeDeaths = Math.max(1, deaths)
  return ((kills + assists) / safeDeaths).toFixed(1)
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function timingLabel(status: 'on_time' | 'late' | 'missing' | 'snapshot'): string {
  if (status === 'snapshot') return 'Snapshot'
  if (status === 'on_time') return 'On time'
  if (status === 'late') return 'Late'
  return 'Missing'
}

export function cleanTalentLabel(value: string): string {
  return value
    .replace(/[{}]/g, '')
    .replace(/s:([a-zA-Z0-9_]+)/g, '$1')
    .replace(/\bbonus_/g, '')
    .replace(/\bunique_/g, '')
    .replace(/\bspecial bonus /g, '')
    .replace(/\bmuerta\b/g, 'Muerta')
    .replace(/\bviper\b/g, 'Viper')
}
