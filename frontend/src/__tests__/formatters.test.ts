import { formatDate, formatWinRate, countryCodeToFlag } from '../utils/formatters'

describe('formatDate', () => {
  it('returns N/A for null', () => {
    expect(formatDate(null)).toBe('N/A')
  })

  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-01-15T20:00:00.000Z')
    expect(result).toBeTruthy()
    expect(result).not.toBe('N/A')
    expect(result).not.toBe('Invalid date')
  })

  it('returns "Invalid date" for a malformed string', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date')
  })
})

describe('formatWinRate', () => {
  it('returns N/A when games is 0', () => {
    expect(formatWinRate(0, 0)).toBe('N/A')
  })

  it('calculates 50% correctly', () => {
    expect(formatWinRate(4, 2)).toBe('50%')
  })

  it('calculates 100% correctly', () => {
    expect(formatWinRate(3, 3)).toBe('100%')
  })

  it('calculates 0% correctly', () => {
    expect(formatWinRate(10, 0)).toBe('0%')
  })

  it('rounds to nearest integer', () => {
    expect(formatWinRate(3, 1)).toBe('33%')
  })
})

describe('countryCodeToFlag', () => {
  it('returns 🌐 for null', () => {
    expect(countryCodeToFlag(null)).toBe('🌐')
  })

  it('converts US to 🇺🇸', () => {
    expect(countryCodeToFlag('US')).toBe('🇺🇸')
  })

  it('converts lowercase code to flag', () => {
    expect(countryCodeToFlag('ee')).toBe('🇪🇪')
  })
})
