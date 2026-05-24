const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com'

export function abilityIconUrl(abilityKey: string): string {
  return `${STEAM_CDN}/apps/dota2/images/dota_react/abilities/${abilityKey}.png`
}

export function itemIconUrl(itemKey: string): string {
  return `${STEAM_CDN}/apps/dota2/images/dota_react/items/${itemKey}.png`
}

export function normalizeIconName(iconName: string | null | undefined): string | null {
  if (!iconName) return null
  return iconName.replace(/^https?:\/\/[^/]+/i, '').replace(/\?.*$/, '')
}

export function toCdnImageUrl(path: string | null | undefined): string | null {
  const normalized = path?.trim().replace(/^https?:\/\/[^/]+/i, '')
  if (!normalized?.startsWith('/')) return null
  return `${STEAM_CDN}${normalized}`
}

export function titleCaseFromKey(key: string): string {
  return key
    .replace(/^(npc_dota_hero_|special_bonus_)/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function humanizeTalentName(key: string, dname: string | undefined): string {
  if (dname && !/[{}]/.test(dname)) return dname
  return titleCaseFromKey(key)
}
