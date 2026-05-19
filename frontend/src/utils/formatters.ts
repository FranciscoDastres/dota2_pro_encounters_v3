export function formatDate(isoString: string | null): string {
  if (!isoString) return 'N/A'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatWinRate(games: number, wins: number): string {
  if (games === 0) return 'N/A'
  return `${Math.round((wins / games) * 100)}%`
}

/** Converts an ISO 3166-1 alpha-2 code to a flag emoji. Returns 🌐 for null. */
export function countryCodeToFlag(code: string | null): string {
  if (!code) return '🌐'
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
}
